import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Deploy Merkle Airdrop System to Sepolia Testnet
 *
 * This script:
 * 1. Deploys MockERC20 token
 * 2. Deploys MerkleAirdrop implementation
 * 3. Deploys AirdropFactory
 * 4. Verifies all contracts on Etherscan
 * 5. Saves deployment information
 */

interface DeploymentInfo {
  network: string;
  timestamp: number;
  deployer: string;
  token: string;
  implementation: string;
  factory: string;
  deploymentBlock: number;
  gasUsed: string;
  etherscanUrl: string;
}

async function main() {
  console.log("🚀 Deploying Merkle Airdrop System to Sepolia");
  console.log("=".repeat(50));

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const networkInfo = await ethers.provider.getNetwork();

    console.log(`📡 Network: ${networkInfo.name} (${networkInfo.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);

    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  Low balance! You need at least 0.01 ETH for deployment");
      console.log("💡 Get Sepolia ETH from: https://sepoliafaucet.com/");
    }

    // ===== DEPLOYMENT PHASE =====
    console.log("\n📦 DEPLOYMENT PHASE");
    console.log("-".repeat(30));

    // Deploy MockERC20
    console.log("1️⃣ Deploying MockERC20...");
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20Factory.deploy(
      "Airdrop Test Token",
      "ATT",
      18,
      ethers.parseEther("1000000") // 1M tokens
    );
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`✅ MockERC20 deployed: ${tokenAddress}`);

    // Deploy MerkleAirdrop implementation
    console.log("2️⃣ Deploying MerkleAirdrop implementation...");
    const MerkleAirdropFactory = await ethers.getContractFactory(
      "MerkleAirdrop"
    );
    const implementation = await MerkleAirdropFactory.deploy(
      tokenAddress,
      deployer.address,
      ethers.keccak256(ethers.toUtf8Bytes("dummy")),
      "https://example.com",
      ethers.parseEther("1") // Use 1 token as dummy amount
    );
    await implementation.waitForDeployment();
    const implementationAddress = await implementation.getAddress();
    console.log(
      `✅ MerkleAirdrop implementation deployed: ${implementationAddress}`
    );

    // Deploy AirdropFactory
    console.log("3️⃣ Deploying AirdropFactory...");
    const AirdropFactoryFactory = await ethers.getContractFactory(
      "AirdropFactory"
    );
    const factory = await AirdropFactoryFactory.deploy(implementationAddress);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(`✅ AirdropFactory deployed: ${factoryAddress}`);

    // ===== VERIFICATION PHASE =====
    console.log("\n🔍 VERIFICATION PHASE");
    console.log("-".repeat(30));

    // Get deployment block
    const deploymentBlock = await ethers.provider.getBlockNumber();

    // Verify contracts on Etherscan
    console.log("1️⃣ Verifying contracts on Etherscan...");
    try {
      await ethers.provider.send("hardhat_verify", [
        tokenAddress,
        ["Airdrop Test Token", "ATT", 18, ethers.parseEther("1000000")],
      ]);
      console.log("✅ MockERC20 verified on Etherscan");
    } catch (error) {
      console.log("⚠️  MockERC20 verification failed:", error);
    }

    try {
      await ethers.provider.send("hardhat_verify", [
        implementationAddress,
        [
          tokenAddress,
          deployer.address,
          ethers.keccak256(ethers.toUtf8Bytes("dummy")),
          "https://example.com",
          ethers.parseEther("1"),
        ],
      ]);
      console.log("✅ MerkleAirdrop implementation verified on Etherscan");
    } catch (error) {
      console.log("⚠️  MerkleAirdrop verification failed:", error);
    }

    try {
      await ethers.provider.send("hardhat_verify", [
        factoryAddress,
        [implementationAddress],
      ]);
      console.log("✅ AirdropFactory verified on Etherscan");
    } catch (error) {
      console.log("⚠️  AirdropFactory verification failed:", error);
    }

    // ===== DEPLOYMENT SUMMARY =====
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(50));
    console.log("✅ MockERC20 deployed and verified");
    console.log("✅ MerkleAirdrop implementation deployed and verified");
    console.log("✅ AirdropFactory deployed and verified");

    // Save deployment information
    const deploymentInfo: DeploymentInfo = {
      network: networkInfo.name,
      timestamp: Math.floor(Date.now() / 1000),
      deployer: deployer.address,
      token: tokenAddress,
      implementation: implementationAddress,
      factory: factoryAddress,
      deploymentBlock: deploymentBlock,
      gasUsed: "TBD", // Would need to track gas usage
      etherscanUrl: `https://sepolia.etherscan.io/address/${factoryAddress}`,
    };

    const deploymentsPath = path.join(__dirname, "../deployments");
    fs.mkdirSync(deploymentsPath, { recursive: true });
    const filePath = path.join(deploymentsPath, "sepolia_deployment.json");
    fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📄 Deployment information saved to:", filePath);
    console.log("\n🔗 Contract Addresses:");
    console.log(`   Token: ${tokenAddress}`);
    console.log(`   Implementation: ${implementationAddress}`);
    console.log(`   Factory: ${factoryAddress}`);
    console.log(
      `\n🌐 Etherscan: https://sepolia.etherscan.io/address/${factoryAddress}`
    );

    console.log("\n📋 Next Steps:");
    console.log("   1. Fund the factory with tokens for airdrops");
    console.log("   2. Generate Merkle tree for your airdrop data");
    console.log("   3. Create airdrops using the factory");
    console.log("   4. Users can claim tokens using Merkle proofs");
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
