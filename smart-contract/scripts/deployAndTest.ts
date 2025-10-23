import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers";

interface AirdropData {
  index: number;
  account: string;
  amount: string;
}

async function main() {
  console.log("🚀 Starting Complete Airdrop Flow Demo...\n");

  // Get signers
  const [deployer, creator, user1, user2, user3, user4] =
    await ethers.getSigners();
  console.log("📋 Accounts:");
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Creator:  ${creator.address}`);
  console.log(`  User1:    ${user1.address}`);
  console.log(`  User2:    ${user2.address}`);
  console.log(`  User3:    ${user3.address}`);
  console.log(`  User4:    ${user4.address}\n`);

  // Step 1: Deploy MockERC20 Token
  console.log("1️⃣ Deploying MockERC20 Token...");
  const MockERC20Factory = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20Factory.deploy(
    "Demo Token",
    "DEMO",
    18,
    ethers.parseEther("1000000") // 1M tokens
  );
  await token.waitForDeployment();
  console.log(`   ✅ Token deployed at: ${await token.getAddress()}\n`);

  // Step 2: Deploy MerkleAirdrop Implementation
  console.log("2️⃣ Deploying MerkleAirdrop Implementation...");
  const MerkleAirdropFactory = await ethers.getContractFactory("MerkleAirdrop");
  const implementation = await MerkleAirdropFactory.deploy(
    await token.getAddress(),
    deployer.address,
    ethers.keccak256(ethers.toUtf8Bytes("dummy")),
    "https://example.com/metadata",
    ethers.parseEther("1000")
  );
  await implementation.waitForDeployment();
  console.log(
    `   ✅ Implementation deployed at: ${await implementation.getAddress()}\n`
  );

  // Step 3: Deploy AirdropFactory
  console.log("3️⃣ Deploying AirdropFactory...");
  const AirdropFactoryFactory = await ethers.getContractFactory(
    "AirdropFactory"
  );
  const factory = await AirdropFactoryFactory.deploy(
    await implementation.getAddress()
  );
  await factory.waitForDeployment();
  console.log(`   ✅ Factory deployed at: ${await factory.getAddress()}\n`);

  // Step 4: Create Test Airdrop Data
  console.log("4️⃣ Creating Test Airdrop Data...");
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

  // Generate Merkle Tree
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

  const totalAmount = airdropData.reduce(
    (sum, data) => sum + BigInt(data.amount),
    0n
  );
  const metadataURI = "https://ipfs.io/ipfs/QmTestMetadataHash";

  console.log(`   📊 Total recipients: ${airdropData.length}`);
  console.log(`   💰 Total amount: ${ethers.formatEther(totalAmount)} DEMO`);
  console.log(`   🌳 Merkle root: ${merkleRoot}`);
  console.log(`   📄 Metadata URI: ${metadataURI}\n`);

  // Step 5: Fund Creator with Tokens
  console.log("5️⃣ Funding Creator with Tokens...");
  const creatorFunding = ethers.parseEther("10000");
  await token.connect(deployer).transfer(creator.address, creatorFunding);
  const creatorBalance = await token.balanceOf(creator.address);
  console.log(
    `   ✅ Creator balance: ${ethers.formatEther(creatorBalance)} DEMO\n`
  );

  // Step 6: Create and Fund Airdrop
  console.log("6️⃣ Creating and Funding Airdrop...");

  // Approve factory to spend tokens
  await token.connect(creator).approve(await factory.getAddress(), totalAmount);
  console.log(
    `   ✅ Approved factory to spend ${ethers.formatEther(totalAmount)} DEMO`
  );

  // Create airdrop
  const createTx = await factory
    .connect(creator)
    .createAirdropAndFund(
      await token.getAddress(),
      merkleRoot,
      metadataURI,
      totalAmount
    );
  const createReceipt = await createTx.wait();

  // Get airdrop address from event
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

  console.log(`   ✅ Airdrop created at: ${airdropAddress}`);
  console.log(
    `   💰 Airdrop balance: ${ethers.formatEther(
      await token.balanceOf(airdropAddress)
    )} DEMO`
  );
  console.log(`   ⏰ Claim deadline: ${await airdropContract.claimDeadline()}`);
  console.log(
    `   🔒 Unlock timestamp: ${await airdropContract.unlockTimestamp()}\n`
  );

  // Step 7: Users Claim Their Tokens (leave one unclaimed for withdrawal demo)
  console.log("7️⃣ Users Claiming Tokens...");

  for (let i = 0; i < airdropData.length - 1; i++) {
    const userData = airdropData[i];
    const user = [user1, user2, user3, user4][i];

    console.log(
      `   👤 User${i + 1} (${user.address}) claiming ${ethers.formatEther(
        userData.amount
      )} DEMO...`
    );

    const leaf = keccak256(
      ethers.solidityPacked(
        ["uint256", "address", "uint256"],
        [userData.index, userData.account, userData.amount]
      )
    );
    const proof = merkleTree.getHexProof(leaf);

    const claimTx = await airdropContract
      .connect(user)
      .claim(userData.index, userData.account, userData.amount, proof);
    await claimTx.wait();

    const userBalance = await token.balanceOf(user.address);
    console.log(
      `      ✅ Claimed! Balance: ${ethers.formatEther(userBalance)} DEMO`
    );
  }

  console.log();

  // Step 8: Check Airdrop Status
  console.log("8️⃣ Checking Airdrop Status...");
  const remainingBalance = await token.balanceOf(airdropAddress);
  const daysUntilWithdrawal = await airdropContract.getDaysUntilWithdrawal();
  const daysUntilExpiry = await airdropContract.getDaysUntilExpiry();

  console.log(
    `   💰 Remaining balance: ${ethers.formatEther(remainingBalance)} DEMO`
  );
  console.log(`   ⏳ Days until withdrawal: ${daysUntilWithdrawal}`);
  console.log(`   ⏳ Days until expiry: ${daysUntilExpiry}\n`);

  // Step 9: Simulate Time Passage and Withdrawal
  console.log("9️⃣ Simulating Time Passage (7 days)...");

  // Fast forward 7 days + 1 second
  await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]);
  await ethers.provider.send("evm_mine", []);

  const daysUntilWithdrawalAfter =
    await airdropContract.getDaysUntilWithdrawal();
  const daysUntilExpiryAfter = await airdropContract.getDaysUntilExpiry();

  console.log(`   ⏳ Days until withdrawal: ${daysUntilWithdrawalAfter}`);
  console.log(`   ⏳ Days until expiry: ${daysUntilExpiryAfter}\n`);

  console.log("🔓 Withdrawing Remaining Tokens...");
  const creatorBalanceBefore = await token.balanceOf(creator.address);
  const remainingBeforeWithdrawal = await token.balanceOf(airdropAddress);

  const withdrawTx = await airdropContract.connect(creator).withdrawRemaining();
  await withdrawTx.wait();

  const creatorBalanceAfter = await token.balanceOf(creator.address);
  const remainingAfterWithdrawal = await token.balanceOf(airdropAddress);

  console.log(`   ✅ Withdrawal successful!`);
  console.log(
    `   💰 Creator received: ${ethers.formatEther(
      creatorBalanceAfter - creatorBalanceBefore
    )} DEMO`
  );
  console.log(
    `   💰 Remaining in airdrop: ${ethers.formatEther(
      remainingAfterWithdrawal
    )} DEMO\n`
  );

  // Step 10: Final Summary
  console.log("🎉 Complete Airdrop Flow Summary:");
  console.log(`   🏭 Factory: ${await factory.getAddress()}`);
  console.log(`   🪙 Token: ${await token.getAddress()}`);
  console.log(`   🎁 Airdrop: ${airdropAddress}`);
  console.log(`   👥 Recipients: ${airdropData.length}`);
  console.log(
    `   💰 Total distributed: ${ethers.formatEther(
      totalAmount - remainingAfterWithdrawal
    )} DEMO`
  );
  console.log(
    `   💰 Remaining: ${ethers.formatEther(remainingAfterWithdrawal)} DEMO`
  );
  console.log(`   🌳 Merkle root: ${merkleRoot}`);
  console.log(`   📄 Metadata: ${metadataURI}\n`);

  console.log("✅ Complete Airdrop Flow Demo Finished Successfully! 🚀");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
