import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { keccak256 } from "viem";

/**
 * Create an airdrop using the deployed factory on Sepolia
 *
 * This script:
 * 1. Connects to deployed contracts
 * 2. Generates sample airdrop data
 * 3. Creates Merkle tree and proofs
 * 4. Creates and funds the airdrop
 * 5. Saves airdrop information
 */

// Manual implementation of solidityPackedKeccak256 for viem compatibility
function hashLeaf(index: number, account: string, amount: bigint): string {
  const indexBytes = new Uint8Array(32);
  const indexView = new DataView(indexBytes.buffer);
  indexView.setBigUint64(24, BigInt(index), false);

  const accountBytes = new Uint8Array(20);
  const accountHex = account.slice(2);
  for (let i = 0; i < 20; i++) {
    accountBytes[i] = parseInt(accountHex.slice(i * 2, i * 2 + 2), 16);
  }

  const amountBytes = new Uint8Array(32);
  const amountView = new DataView(amountBytes.buffer);
  amountView.setBigUint64(24, amount, false);

  const packed = new Uint8Array(84);
  packed.set(indexBytes, 0);
  packed.set(accountBytes, 32);
  packed.set(amountBytes, 52);

  return keccak256(packed);
}

async function generateMerkleTree(
  accounts: Array<{ address: string; amount: string; index: number }>
) {
  console.log("🌳 Generating Merkle tree...");

  const leaves = accounts.map((account, index) =>
    hashLeaf(index, account.address, BigInt(account.amount))
  );

  const { MerkleTree } = await import("merkletreejs");
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = tree.getHexRoot();

  const claims: {
    [key: string]: { index: number; amount: string; proof: string[] };
  } = {};
  accounts.forEach((account, index) => {
    const leaf = hashLeaf(index, account.address, BigInt(account.amount));
    const proof = tree.getHexProof(leaf);
    claims[account.address] = {
      index: index,
      amount: account.amount,
      proof: proof,
    };
  });

  return { merkleRoot, claims, tree };
}

async function main() {
  console.log("🎁 Creating Airdrop on Sepolia");
  console.log("=".repeat(40));

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const networkInfo = await ethers.provider.getNetwork();

    console.log(`📡 Network: ${networkInfo.name} (${networkInfo.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);

    // Load deployment information
    const deploymentsPath = path.join(__dirname, "../deployments");
    const deploymentFile = path.join(
      deploymentsPath,
      "sepolia_deployment.json"
    );

    if (!fs.existsSync(deploymentFile)) {
      console.log(
        "❌ Deployment file not found. Please run deploy-sepolia.ts first"
      );
      return;
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
    console.log("📄 Loaded deployment information");

    // Connect to deployed contracts
    console.log("\n🔗 CONNECTING TO DEPLOYED CONTRACTS");
    console.log("-".repeat(40));

    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = MockERC20Factory.attach(deploymentInfo.token);
    console.log(`✅ Connected to MockERC20: ${deploymentInfo.token}`);

    const AirdropFactoryFactory = await ethers.getContractFactory(
      "AirdropFactory"
    );
    const factory = AirdropFactoryFactory.attach(deploymentInfo.factory);
    console.log(`✅ Connected to AirdropFactory: ${deploymentInfo.factory}`);

    // ===== CREATE SAMPLE AIRDROP DATA =====
    console.log("\n📋 CREATING SAMPLE AIRDROP DATA");
    console.log("-".repeat(40));

    // Create sample recipients (you can replace these with real addresses)
    const sampleRecipients = [
      { address: "0x1234567890123456789012345678901234567890", amount: "100" },
      { address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", amount: "250" },
      { address: "0x9876543210987654321098765432109876543210", amount: "150" },
      { address: "0xfedcba9876543210fedcba9876543210fedcba98", amount: "200" },
      { address: "0x1111111111111111111111111111111111111111", amount: "300" },
    ];

    const testRecipients = sampleRecipients.map((recipient, index) => ({
      address: recipient.address,
      amount: ethers.parseEther(recipient.amount).toString(),
      index: index,
    }));

    console.log("📋 Sample recipients:");
    testRecipients.forEach((recipient, index) => {
      console.log(
        `   ${index}: ${recipient.address} - ${ethers.formatEther(
          recipient.amount
        )} tokens`
      );
    });

    // Generate Merkle tree
    const { merkleRoot, claims } = await generateMerkleTree(testRecipients);
    console.log(`\n🌳 Merkle root: ${merkleRoot}`);

    // Calculate total amount
    const totalAmount = testRecipients.reduce(
      (sum, recipient) => sum + BigInt(recipient.amount),
      0n
    );
    console.log(
      `💰 Total airdrop amount: ${ethers.formatEther(totalAmount)} tokens`
    );

    // ===== CREATE AIRDROP =====
    console.log("\n🎁 CREATING AIRDROP");
    console.log("-".repeat(40));

    // Check deployer's token balance
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log(
      `💰 Deployer token balance: ${ethers.formatEther(deployerBalance)} tokens`
    );

    if (deployerBalance < totalAmount) {
      console.log("⚠️  Insufficient token balance for airdrop");
      console.log(
        "💡 You need to mint more tokens or reduce the airdrop amount"
      );
      return;
    }

    // Approve factory to spend tokens
    console.log("1️⃣ Approving factory to spend tokens...");
    const approveTx = await token.approve(deploymentInfo.factory, totalAmount);
    await approveTx.wait();
    console.log("✅ Factory approved to spend tokens");

    // Create airdrop
    console.log("2️⃣ Creating airdrop...");
    const metadataURI = "ipfs://QmYourIPFSCIDHere"; // Replace with actual IPFS CID
    const createTx = await factory.createAirdropAndFund(
      deploymentInfo.token,
      merkleRoot,
      metadataURI,
      totalAmount
    );
    const createReceipt = await createTx.wait();
    console.log("✅ Airdrop creation transaction sent");

    // Extract airdrop address from event
    const airdropCreatedEvent = createReceipt.logs.find((log) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === "AirdropCreated";
      } catch {
        return false;
      }
    });

    if (!airdropCreatedEvent) {
      throw new Error("AirdropCreated event not found");
    }

    const airdropAddress =
      factory.interface.parseLog(airdropCreatedEvent).args.airdropAddress;
    console.log(`🎯 Airdrop deployed: ${airdropAddress}`);

    // Connect to airdrop contract
    const MerkleAirdropFactory = await ethers.getContractFactory(
      "MerkleAirdrop"
    );
    const airdrop = MerkleAirdropFactory.attach(airdropAddress);

    // Verify airdrop state
    console.log("\n3️⃣ Verifying airdrop state...");
    const airdropToken = await airdrop.token();
    const airdropOwner = await airdrop.owner();
    const airdropMerkleRoot = await airdrop.merkleRoot();
    const airdropBalance = await airdrop.getBalance();

    console.log(`   Token: ${airdropToken}`);
    console.log(`   Owner: ${airdropOwner}`);
    console.log(`   Merkle root: ${airdropMerkleRoot}`);
    console.log(`   Balance: ${ethers.formatEther(airdropBalance)} tokens`);

    // ===== SAVE AIRDROP INFORMATION =====
    console.log("\n💾 SAVING AIRDROP INFORMATION");
    console.log("-".repeat(40));

    const airdropInfo = {
      timestamp: Math.floor(Date.now() / 1000),
      network: networkInfo.name,
      airdropAddress: airdropAddress,
      token: deploymentInfo.token,
      factory: deploymentInfo.factory,
      merkleRoot: merkleRoot,
      metadataURI: metadataURI,
      totalAmount: totalAmount.toString(),
      recipients: testRecipients.length,
      claims: claims,
      deployer: deployer.address,
    };

    const airdropFile = path.join(
      deploymentsPath,
      `sepolia_airdrop_${airdropAddress}.json`
    );
    fs.writeFileSync(airdropFile, JSON.stringify(airdropInfo, null, 2));
    console.log(`📄 Airdrop information saved to: ${airdropFile}`);

    // ===== SUCCESS =====
    console.log("\n🎉 AIRDROP CREATED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log("✅ Airdrop deployed and funded");
    console.log("✅ Merkle tree generated");
    console.log("✅ Claims data saved");
    console.log("✅ Ready for users to claim tokens");

    console.log("\n🔗 Contract Addresses:");
    console.log(`   Airdrop: ${airdropAddress}`);
    console.log(`   Token: ${deploymentInfo.token}`);
    console.log(`   Factory: ${deploymentInfo.factory}`);

    console.log("\n🌐 Etherscan:");
    console.log(
      `   Airdrop: https://sepolia.etherscan.io/address/${airdropAddress}`
    );
    console.log(
      `   Token: https://sepolia.etherscan.io/address/${deploymentInfo.token}`
    );

    console.log("\n📋 Next Steps:");
    console.log("   1. Share the airdrop address with users");
    console.log("   2. Provide users with their Merkle proofs");
    console.log("   3. Users can claim tokens using the claim function");
    console.log("   4. Monitor the airdrop progress on Etherscan");
  } catch (error) {
    console.error("❌ Airdrop creation failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
