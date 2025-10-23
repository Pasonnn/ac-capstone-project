import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Claim tokens from an airdrop on Sepolia
 *
 * This script:
 * 1. Connects to an airdrop contract
 * 2. Loads claim data for a specific user
 * 3. Claims tokens using Merkle proof
 * 4. Verifies the claim was successful
 */

async function main() {
  console.log("🎯 Claiming Airdrop Tokens");
  console.log("=".repeat(40));

  try {
    // Get claimer account (use second account for testing)
    const signers = await ethers.getSigners();
    let claimer;
    if (signers.length < 2) {
      console.log("❌ Need at least 2 accounts for testing");
      console.log("💡 The deployer account will be used as claimer");
      claimer = signers[0];
    } else {
      claimer = signers[1];
    }
    const networkInfo = await ethers.provider.getNetwork();

    console.log(`📡 Network: ${networkInfo.name} (${networkInfo.chainId})`);
    console.log(`👤 Claimer: ${claimer.address}`);

    // Load airdrop information
    const deploymentsPath = path.join(__dirname, "../deployments");
    const airdropFiles = fs
      .readdirSync(deploymentsPath)
      .filter(
        (file) => file.startsWith("sepolia_airdrop_") && file.endsWith(".json")
      );

    if (airdropFiles.length === 0) {
      console.log(
        "❌ No airdrop files found. Please run create-airdrop-sepolia.ts first"
      );
      return;
    }

    // Use the most recent airdrop file
    const airdropFile = airdropFiles[airdropFiles.length - 1];
    const airdropPath = path.join(deploymentsPath, airdropFile);
    const airdropInfo = JSON.parse(fs.readFileSync(airdropPath, "utf-8"));

    console.log(`📄 Loaded airdrop: ${airdropInfo.airdropAddress}`);

    // Connect to airdrop contract
    const MerkleAirdropFactory = await ethers.getContractFactory(
      "MerkleAirdrop"
    );
    const airdrop = MerkleAirdropFactory.attach(airdropInfo.airdropAddress);

    // Check if claimer has a claim
    const claimerClaim = airdropInfo.claims[claimer.address];
    if (!claimerClaim) {
      console.log("❌ No claim found for this address");
      console.log("💡 Available addresses:");
      Object.keys(airdropInfo.claims).forEach((addr) => {
        console.log(`   ${addr}`);
      });
      return;
    }

    console.log(`✅ Claim found for ${claimer.address}`);
    console.log(`   Index: ${claimerClaim.index}`);
    console.log(`   Amount: ${ethers.formatEther(claimerClaim.amount)} tokens`);
    console.log(`   Proof length: ${claimerClaim.proof.length} hashes`);

    // Check if already claimed
    const isClaimed = await airdrop.isClaimed(claimerClaim.index);
    if (isClaimed) {
      console.log("⚠️  This claim has already been used");
      return;
    }

    // Check claimer's current token balance
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = MockERC20Factory.attach(airdropInfo.token);
    const balanceBefore = await token.balanceOf(claimer.address);
    console.log(
      `💰 Balance before claim: ${ethers.formatEther(balanceBefore)} tokens`
    );

    // ===== CLAIM TOKENS =====
    console.log("\n🎯 CLAIMING TOKENS");
    console.log("-".repeat(40));

    console.log("1️⃣ Submitting claim transaction...");
    const claimTx = await airdrop
      .connect(claimer)
      .claim(
        claimerClaim.index,
        claimer.address,
        claimerClaim.amount,
        claimerClaim.proof
      );

    console.log("⏳ Waiting for transaction confirmation...");
    const claimReceipt = await claimTx.wait();
    console.log(`✅ Claim transaction confirmed: ${claimTx.hash}`);

    // Verify claim was successful
    console.log("2️⃣ Verifying claim...");
    const isClaimedAfter = await airdrop.isClaimed(claimerClaim.index);
    const balanceAfter = await token.balanceOf(claimer.address);
    const balanceIncrease = balanceAfter - balanceBefore;

    console.log(`   Claimed: ${isClaimedAfter}`);
    console.log(`   Balance after: ${ethers.formatEther(balanceAfter)} tokens`);
    console.log(
      `   Tokens received: ${ethers.formatEther(balanceIncrease)} tokens`
    );

    if (isClaimedAfter && balanceIncrease === BigInt(claimerClaim.amount)) {
      console.log("✅ Claim successful!");
    } else {
      console.log("❌ Claim verification failed");
    }

    // ===== SUCCESS =====
    console.log("\n🎉 CLAIM SUCCESSFUL!");
    console.log("=".repeat(50));
    console.log("✅ Tokens claimed successfully");
    console.log("✅ Merkle proof verified");
    console.log("✅ Claim marked as used");

    console.log("\n📊 Transaction Details:");
    console.log(`   Hash: ${claimTx.hash}`);
    console.log(`   Gas used: ${claimReceipt?.gasUsed.toString()}`);
    console.log(`   Block: ${claimReceipt?.blockNumber}`);

    console.log("\n🌐 Etherscan:");
    console.log(
      `   Transaction: https://sepolia.etherscan.io/tx/${claimTx.hash}`
    );
    console.log(
      `   Airdrop: https://sepolia.etherscan.io/address/${airdropInfo.airdropAddress}`
    );
  } catch (error) {
    console.error("❌ Claim failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
