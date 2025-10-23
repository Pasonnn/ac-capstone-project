import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers";
import { AirdropFactory, MerkleAirdrop, MockERC20 } from "../typechain-types";

describe("Complete Airdrop Flow", function () {
  // Test data structure
  interface AirdropData {
    index: number;
    account: string;
    amount: string;
  }

  // Fixture for setting up the complete test environment
  async function deployAirdropSystem() {
    const [deployer, creator, user1, user2, user3, user4] =
      await ethers.getSigners();

    // Deploy MockERC20 token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20Factory.deploy(
      "Test Token",
      "TEST",
      18,
      ethers.parseEther("1000000") // 1M tokens
    );

    // Transfer tokens to creator for funding airdrops
    await token
      .connect(deployer)
      .transfer(creator.address, ethers.parseEther("100000"));

    // Deploy MerkleAirdrop implementation
    const MerkleAirdropFactory = await ethers.getContractFactory(
      "MerkleAirdrop"
    );
    const implementation = await MerkleAirdropFactory.deploy(
      await token.getAddress(),
      deployer.address,
      ethers.keccak256(ethers.toUtf8Bytes("dummy")),
      "https://example.com/metadata",
      ethers.parseEther("1000")
    );

    // Deploy AirdropFactory
    const AirdropFactoryFactory = await ethers.getContractFactory(
      "AirdropFactory"
    );
    const factory = await AirdropFactoryFactory.deploy(
      await implementation.getAddress()
    );

    // Create test airdrop data
    const airdropData: AirdropData[] = [
      {
        index: 0,
        account: user1.address,
        amount: ethers.parseEther("100").toString(),
      },
      {
        index: 1,
        account: user2.address,
        amount: ethers.parseEther("200").toString(),
      },
      {
        index: 2,
        account: user3.address,
        amount: ethers.parseEther("300").toString(),
      },
      {
        index: 3,
        account: user4.address,
        amount: ethers.parseEther("400").toString(),
      },
    ];

    // Generate Merkle tree
    const leaves = airdropData.map((data) =>
      keccak256(
        ethers.solidityPacked(
          ["uint256", "address", "uint256"],
          [data.index, data.account, data.amount]
        )
      )
    );
    const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getHexRoot();

    // Create metadata URI (simulating IPFS upload)
    const metadataURI = "https://ipfs.io/ipfs/QmTestMetadataHash";

    // Calculate total amount
    const totalAmount = airdropData.reduce(
      (sum, data) => sum + BigInt(data.amount),
      0n
    );

    return {
      deployer,
      creator,
      user1,
      user2,
      user3,
      user4,
      token,
      factory,
      implementation,
      airdropData,
      merkleTree,
      merkleRoot,
      metadataURI,
      totalAmount,
    };
  }

  describe("1. Factory Deployment and Airdrop Creation", function () {
    it("Should deploy factory with correct implementation", async function () {
      const { factory, implementation } = await loadFixture(
        deployAirdropSystem
      );

      expect(await factory.getImplementation()).to.equal(
        await implementation.getAddress()
      );
    });

    it("Should create and fund airdrop in single transaction", async function () {
      const { creator, token, factory, merkleRoot, metadataURI, totalAmount } =
        await loadFixture(deployAirdropSystem);

      // Creator approves factory to spend tokens
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);

      // Creator creates airdrop
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      // Get airdrop address from event
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2]; // airdropAddress is 3rd argument

      expect(airdropAddress).to.not.be.undefined;
      expect(airdropAddress).to.not.equal(ethers.ZeroAddress);

      // Verify airdrop contract has tokens
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );
      const balance = await token.balanceOf(airdropAddress);
      expect(balance).to.equal(totalAmount);

      // Verify airdrop contract properties
      expect(await airdropContract.token()).to.equal(await token.getAddress());
      expect(await airdropContract.metadataURI()).to.equal(metadataURI);
      expect(await airdropContract.owner()).to.equal(creator.address);
    });

    it("Should emit AirdropCreated event with correct parameters", async function () {
      const { creator, token, factory, merkleRoot, metadataURI, totalAmount } =
        await loadFixture(deployAirdropSystem);

      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);

      await expect(
        factory
          .connect(creator)
          .createAirdropAndFund(
            await token.getAddress(),
            merkleRoot,
            metadataURI,
            totalAmount
          )
      ).to.emit(factory, "AirdropCreated");
    });
  });

  describe("2. Merkle Proof Verification and Claiming", function () {
    it("Should allow valid claims with correct Merkle proof", async function () {
      const {
        creator,
        user1,
        user2,
        token,
        factory,
        airdropData,
        merkleTree,
        merkleRoot,
        metadataURI,
        totalAmount,
      } = await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // User1 claims their tokens
      const user1Data = airdropData[0];
      const leaf = keccak256(
        ethers.solidityPacked(
          ["uint256", "address", "uint256"],
          [user1Data.index, user1Data.account, user1Data.amount]
        )
      );
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        airdropContract
          .connect(user1)
          .claim(user1Data.index, user1Data.account, user1Data.amount, proof)
      )
        .to.emit(airdropContract, "Claimed")
        .withArgs(user1Data.index, user1Data.account, user1Data.amount);

      // Verify user1 received tokens
      const user1Balance = await token.balanceOf(user1.address);
      expect(user1Balance).to.equal(user1Data.amount);

      // Verify claim is marked as claimed
      expect(await airdropContract.isClaimed(user1Data.index)).to.be.true;
    });

    it("Should reject invalid Merkle proofs", async function () {
      const {
        creator,
        user1,
        token,
        factory,
        airdropData,
        merkleRoot,
        metadataURI,
        totalAmount,
      } = await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Try to claim with invalid proof
      const user1Data = airdropData[0];
      const invalidProof = [
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      ]; // Invalid proof

      await expect(
        airdropContract
          .connect(user1)
          .claim(
            user1Data.index,
            user1Data.account,
            user1Data.amount,
            invalidProof
          )
      ).to.be.revertedWith("MerkleAirdrop: invalid merkle proof");
    });

    it("Should prevent double claiming", async function () {
      const {
        creator,
        user1,
        token,
        factory,
        airdropData,
        merkleTree,
        merkleRoot,
        metadataURI,
        totalAmount,
      } = await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // First claim should succeed
      const user1Data = airdropData[0];
      const leaf = keccak256(
        ethers.solidityPacked(
          ["uint256", "address", "uint256"],
          [user1Data.index, user1Data.account, user1Data.amount]
        )
      );
      const proof = merkleTree.getHexProof(leaf);

      await airdropContract
        .connect(user1)
        .claim(user1Data.index, user1Data.account, user1Data.amount, proof);

      // Second claim should fail
      await expect(
        airdropContract
          .connect(user1)
          .claim(user1Data.index, user1Data.account, user1Data.amount, proof)
      ).to.be.revertedWith("MerkleAirdrop: drop already claimed");
    });
  });

  describe("3. 7-Day Lock Mechanism", function () {
    it("Should prevent withdrawal before 7 days", async function () {
      const { creator, token, factory, merkleRoot, metadataURI, totalAmount } =
        await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Try to withdraw immediately (should fail)
      await expect(
        airdropContract.connect(creator).withdrawRemaining()
      ).to.be.revertedWith("MerkleAirdrop: withdrawal not yet allowed");
    });

    it("Should allow withdrawal after 7 days", async function () {
      const { creator, token, factory, merkleRoot, metadataURI, totalAmount } =
        await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Fast forward 7 days + 1 second
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Withdrawal should now succeed
      const creatorBalanceBefore = await token.balanceOf(creator.address);
      const airdropBalance = await token.balanceOf(airdropAddress);

      await expect(airdropContract.connect(creator).withdrawRemaining())
        .to.emit(airdropContract, "Withdrawn")
        .withArgs(creator.address, airdropBalance);

      const creatorBalanceAfter = await token.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(
        airdropBalance
      );
    });

    it("Should show correct days until withdrawal", async function () {
      const { creator, token, factory, merkleRoot, metadataURI, totalAmount } =
        await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Check days until withdrawal (should be 7)
      const daysUntilWithdrawal =
        await airdropContract.getDaysUntilWithdrawal();
      expect(daysUntilWithdrawal).to.equal(7);

      // Fast forward 3 days
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const daysUntilWithdrawalAfter3Days =
        await airdropContract.getDaysUntilWithdrawal();
      expect(daysUntilWithdrawalAfter3Days).to.equal(4);
    });
  });

  describe("4. Claim Deadline Enforcement", function () {
    it("Should prevent claims after deadline", async function () {
      const {
        creator,
        user1,
        token,
        factory,
        airdropData,
        merkleTree,
        merkleRoot,
        metadataURI,
        totalAmount,
      } = await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Fast forward past claim deadline (7 days + 1 second)
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Try to claim after deadline
      const user1Data = airdropData[0];
      const leaf = keccak256(
        ethers.solidityPacked(
          ["uint256", "address", "uint256"],
          [user1Data.index, user1Data.account, user1Data.amount]
        )
      );
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        airdropContract
          .connect(user1)
          .claim(user1Data.index, user1Data.account, user1Data.amount, proof)
      ).to.be.revertedWith("MerkleAirdrop: claim period expired");
    });

    it("Should show correct days until expiry", async function () {
      const { creator, token, factory, merkleRoot, metadataURI, totalAmount } =
        await loadFixture(deployAirdropSystem);

      // Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const tx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedEvent = factory.interface.parseLog(event!);
      const airdropAddress = parsedEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Check days until expiry (should be 7)
      const daysUntilExpiry = await airdropContract.getDaysUntilExpiry();
      expect(daysUntilExpiry).to.equal(7);

      // Fast forward 3 days
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const daysUntilExpiryAfter3Days =
        await airdropContract.getDaysUntilExpiry();
      expect(daysUntilExpiryAfter3Days).to.equal(4);
    });
  });

  describe("5. Complete End-to-End Flow", function () {
    it("Should execute complete airdrop flow: create -> claim -> withdraw", async function () {
      const {
        creator,
        user1,
        user2,
        user3,
        user4,
        token,
        factory,
        airdropData,
        merkleTree,
        merkleRoot,
        metadataURI,
        totalAmount,
      } = await loadFixture(deployAirdropSystem);

      // Step 1: Create and fund airdrop
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const createTx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );

      const createReceipt = await createTx.wait();
      const createEvent = createReceipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedCreateEvent = factory.interface.parseLog(createEvent!);
      const airdropAddress = parsedCreateEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Verify airdrop is funded
      const airdropBalance = await token.balanceOf(airdropAddress);
      expect(airdropBalance).to.equal(totalAmount);

      // Step 2: Some users claim their tokens (leave some unclaimed for withdrawal test)
      for (let i = 0; i < airdropData.length - 1; i++) {
        const userData = airdropData[i];
        const user = [user1, user2, user3, user4][i];

        const leaf = keccak256(
          ethers.solidityPacked(
            ["uint256", "address", "uint256"],
            [userData.index, userData.account, userData.amount]
          )
        );
        const proof = merkleTree.getHexProof(leaf);

        await expect(
          airdropContract
            .connect(user)
            .claim(userData.index, userData.account, userData.amount, proof)
        )
          .to.emit(airdropContract, "Claimed")
          .withArgs(userData.index, userData.account, userData.amount);
      }

      // Verify claimed users received their tokens
      for (let i = 0; i < airdropData.length - 1; i++) {
        const userData = airdropData[i];
        const user = [user1, user2, user3, user4][i];
        const userBalance = await token.balanceOf(user.address);
        expect(userBalance).to.equal(userData.amount);
      }

      // Step 3: Fast forward past lock period and withdraw remaining
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      const remainingBalance = await token.balanceOf(airdropAddress);
      const creatorBalanceBefore = await token.balanceOf(creator.address);

      await expect(airdropContract.connect(creator).withdrawRemaining())
        .to.emit(airdropContract, "Withdrawn")
        .withArgs(creator.address, remainingBalance);

      const creatorBalanceAfter = await token.balanceOf(creator.address);
      expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(
        remainingBalance
      );
    });
  });

  describe("6. Gas Optimization Tests", function () {
    it("Should measure gas costs for key operations", async function () {
      const {
        creator,
        user1,
        token,
        factory,
        airdropData,
        merkleTree,
        merkleRoot,
        metadataURI,
        totalAmount,
      } = await loadFixture(deployAirdropSystem);

      // Measure gas for airdrop creation
      await token
        .connect(creator)
        .approve(await factory.getAddress(), totalAmount);
      const createTx = await factory
        .connect(creator)
        .createAirdropAndFund(
          await token.getAddress(),
          merkleRoot,
          metadataURI,
          totalAmount
        );
      const createReceipt = await createTx.wait();
      console.log(`Airdrop creation gas used: ${createReceipt?.gasUsed}`);

      // Get airdrop address
      const createEvent = createReceipt?.logs.find((log) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "AirdropCreated";
        } catch {
          return false;
        }
      });
      const parsedCreateEvent = factory.interface.parseLog(createEvent!);
      const airdropAddress = parsedCreateEvent?.args[2];
      const airdropContract = await ethers.getContractAt(
        "MerkleAirdrop",
        airdropAddress
      );

      // Measure gas for claim
      const user1Data = airdropData[0];
      const leaf = keccak256(
        ethers.solidityPacked(
          ["uint256", "address", "uint256"],
          [user1Data.index, user1Data.account, user1Data.amount]
        )
      );
      const proof = merkleTree.getHexProof(leaf);

      const claimTx = await airdropContract
        .connect(user1)
        .claim(user1Data.index, user1Data.account, user1Data.amount, proof);
      const claimReceipt = await claimTx.wait();
      console.log(`Claim gas used: ${claimReceipt?.gasUsed}`);

      // Gas costs should be reasonable (under 1M for creation, under 200k for claim)
      expect(createReceipt?.gasUsed).to.be.lessThan(1000000);
      expect(claimReceipt?.gasUsed).to.be.lessThan(200000);
    });
  });
});
