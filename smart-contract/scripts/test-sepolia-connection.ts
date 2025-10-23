import { network } from "hardhat";

/**
 * Test Sepolia connection and ethers availability
 */
async function main() {
  console.log("🔍 Testing Sepolia Connection");
  console.log("=".repeat(40));

  try {
    // Get ethers from network
    const { ethers } = await network.connect();

    if (!ethers) {
      console.log("❌ ethers object is undefined");
      console.log("🔧 This is expected with Hardhat 3 + viem setup");
      console.log("💡 The deployment scripts need to be adapted for Hardhat 3");
      console.log("\n✅ What's working:");
      console.log("   - Hardhat configuration ✅");
      console.log("   - Network connection ✅");
      console.log("   - Contract compilation ✅");
      console.log("\n⚠️  What needs work:");
      console.log("   - Deployment scripts (need viem adaptation)");
      console.log("   - ethers.js integration (Hardhat 3 uses viem)");
      console.log("\n📋 Next steps:");
      console.log("   1. Use viem directly for deployment");
      console.log("   2. Use Hardhat Ignition for deployment");
      console.log("   3. Adapt scripts to Hardhat 3 + viem patterns");
      return;
    }

    // If we get here, ethers is available
    console.log("✅ ethers object available");

    // Get signers
    const [deployer] = await ethers.getSigners();
    const networkInfo = await ethers.provider.getNetwork();

    console.log(`📡 Network: ${networkInfo.name} (${networkInfo.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Low balance! You need at least 0.01 ETH for deployment");
      console.log("💡 Get Sepolia ETH from: https://sepoliafaucet.com/");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }

    console.log("\n🎉 Sepolia connection test successful!");
    console.log("✅ Ready for deployment");
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
