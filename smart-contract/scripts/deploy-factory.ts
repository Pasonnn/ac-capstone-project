import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
} from "viem";
import { hardhat } from "viem/chains";

const { ethers } = await network.connect();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create viem clients
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

/**
 * Deploy MerkleAirdrop implementation and AirdropFactory
 * Usage: npx hardhat run scripts/deploy-factory.ts --network sepolia
 */

interface DeploymentInfo {
  network: string;
  merkleAirdropImplementation: string;
  airdropFactory: string;
  deploymentBlock: number;
  timestamp: number;
}

async function main() {
  console.log("🚀 Deploying MerkleAirdrop system...");

  // Get deployer account - use the same pattern as Counter test
  const deployer = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log(`📡 Network: ${network.name} (${network.chainId})`);
  console.log(`👤 Deployer: ${deployer[0].address}`);
  console.log(
    `💰 Balance: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer[0].address)
    )} ETH`
  );

  // Deploy MerkleAirdrop implementation
  console.log("\n📦 Deploying MerkleAirdrop implementation...");
  const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");

  // We need to deploy with dummy parameters since constructor requires them
  // In practice, the implementation won't be used directly
  const dummyToken = ethers.ZeroAddress;
  const dummyOwner = deployer[0].address;
  const dummyMerkleRoot = ethers.keccak256(ethers.toUtf8Bytes("dummy"));
  const dummyMetadataURI = "https://example.com/metadata";
  const dummyTotalAmount = 0;

  const merkleAirdropImplementation = await MerkleAirdrop.deploy(
    dummyToken,
    dummyOwner,
    dummyMerkleRoot,
    dummyMetadataURI,
    dummyTotalAmount
  );

  await merkleAirdropImplementation.waitForDeployment();
  const implementationAddress = await merkleAirdropImplementation.getAddress();

  console.log(
    `✅ MerkleAirdrop implementation deployed to: ${implementationAddress}`
  );

  // Deploy AirdropFactory
  console.log("\n🏭 Deploying AirdropFactory...");
  const AirdropFactory = await ethers.getContractFactory("AirdropFactory");
  const airdropFactory = await AirdropFactory.deploy(implementationAddress);

  await airdropFactory.waitForDeployment();
  const factoryAddress = await airdropFactory.getAddress();

  console.log(`✅ AirdropFactory deployed to: ${factoryAddress}`);

  // Get deployment block
  const deploymentBlock = await ethers.provider.getBlockNumber();

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: network.name,
    merkleAirdropImplementation: implementationAddress,
    airdropFactory: factoryAddress,
    deploymentBlock,
    timestamp: Date.now(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  // Display summary
  console.log("\n🎉 Deployment Summary:");
  console.log(`   Network: ${network.name}`);
  console.log(`   MerkleAirdrop Implementation: ${implementationAddress}`);
  console.log(`   AirdropFactory: ${factoryAddress}`);
  console.log(`   Deployment Block: ${deploymentBlock}`);

  // Verify contracts if on a supported network
  if (network.name === "sepolia" || network.name === "mainnet") {
    console.log("\n🔍 Verifying contracts on Etherscan...");

    try {
      console.log("⏳ Waiting for block confirmations...");
      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

      console.log("🔍 Verifying MerkleAirdrop implementation...");
      await hre.run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [
          dummyToken,
          dummyOwner,
          dummyMerkleRoot,
          dummyMetadataURI,
          dummyTotalAmount,
        ],
      });

      console.log("🔍 Verifying AirdropFactory...");
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [implementationAddress],
      });

      console.log("✅ Contracts verified successfully!");
    } catch (error) {
      console.log(
        "⚠️  Verification failed (this is normal for some networks):",
        error
      );
    }
  }

  console.log("\n💡 Next steps:");
  console.log("   1. Use the factory to create airdrops:");
  console.log(`      npm run create:airdrop -- --factory ${factoryAddress}`);
  console.log("   2. Or use the factory address in your frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
