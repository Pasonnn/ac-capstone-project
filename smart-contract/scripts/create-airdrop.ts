import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create an airdrop using the factory
 * Usage: npx hardhat run scripts/create-airdrop.ts -- --factory 0x... --token 0x... --claims data/claims.json
 */

interface ClaimsData {
  merkleRoot: string;
  totalAmount: string;
  claims: Record<
    string,
    {
      index: number;
      address: string;
      amount: string;
      proof: string[];
    }
  >;
}

async function loadClaimsData(claimsPath: string): Promise<ClaimsData> {
  if (!fs.existsSync(claimsPath)) {
    throw new Error(`Claims file not found: ${claimsPath}`);
  }

  const claimsContent = fs.readFileSync(claimsPath, "utf8");
  return JSON.parse(claimsContent);
}

async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const factoryArg = args.find((arg) => arg.startsWith("--factory="));
  const tokenArg = args.find((arg) => arg.startsWith("--token="));
  const claimsArg = args.find((arg) => arg.startsWith("--claims="));
  const metadataArg = args.find((arg) => arg.startsWith("--metadata="));

  const factoryAddress = factoryArg ? factoryArg.split("=")[1] : null;
  const tokenAddress = tokenArg ? tokenArg.split("=")[1] : null;
  const claimsPath = claimsArg ? claimsArg.split("=")[1] : "data/claims.json";
  const metadataURI = metadataArg
    ? metadataArg.split("=")[1]
    : "https://ipfs.io/ipfs/QmExample";

  if (!factoryAddress) {
    console.error("❌ Factory address required. Use --factory=0x...");
    process.exit(1);
  }

  if (!tokenAddress) {
    console.error("❌ Token address required. Use --token=0x...");
    process.exit(1);
  }

  console.log("🚀 Creating airdrop...");
  console.log(`🏭 Factory: ${factoryAddress}`);
  console.log(`🪙 Token: ${tokenAddress}`);
  console.log(`📄 Claims: ${claimsPath}`);
  console.log(`🔗 Metadata: ${metadataURI}`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Creator: ${deployer.address}`);

  try {
    // Load claims data
    console.log("\n📊 Loading claims data...");
    const claimsData = await loadClaimsData(claimsPath);
    console.log(`✅ Loaded ${Object.keys(claimsData.claims).length} claims`);
    console.log(
      `💰 Total amount: ${ethers.formatEther(claimsData.totalAmount)} tokens`
    );
    console.log(`🌳 Merkle root: ${claimsData.merkleRoot}`);

    // Get factory contract
    const factory = await ethers.getContractAt(
      "AirdropFactory",
      factoryAddress
    );

    // Get token contract
    const token = await ethers.getContractAt("IERC20", tokenAddress);

    // Check token balance
    const balance = await token.balanceOf(deployer.address);
    const requiredAmount = BigInt(claimsData.totalAmount);

    console.log(`\n💰 Token balance: ${ethers.formatEther(balance)} tokens`);
    console.log(
      `💰 Required amount: ${ethers.formatEther(requiredAmount)} tokens`
    );

    if (balance < requiredAmount) {
      console.error("❌ Insufficient token balance");
      process.exit(1);
    }

    // Check allowance
    const allowance = await token.allowance(deployer.address, factoryAddress);
    console.log(
      `🔐 Current allowance: ${ethers.formatEther(allowance)} tokens`
    );

    if (allowance < requiredAmount) {
      console.log("🔐 Approving tokens for factory...");
      const approveTx = await token.approve(factoryAddress, requiredAmount);
      await approveTx.wait();
      console.log("✅ Tokens approved");
    }

    // Create airdrop
    console.log("\n🏭 Creating airdrop...");
    const createTx = await factory.createAirdropAndFund(
      tokenAddress,
      claimsData.merkleRoot,
      metadataURI,
      requiredAmount
    );

    console.log(`⏳ Transaction submitted: ${createTx.hash}`);
    const receipt = await createTx.wait();

    // Find the AirdropCreated event
    const airdropCreatedEvent = receipt.logs.find((log) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === "AirdropCreated";
      } catch {
        return false;
      }
    });

    if (airdropCreatedEvent) {
      const parsed = factory.interface.parseLog(airdropCreatedEvent);
      const airdropAddress = parsed?.args.airdropAddress;

      console.log("\n🎉 Airdrop created successfully!");
      console.log(`📍 Airdrop address: ${airdropAddress}`);
      console.log(`🌳 Merkle root: ${claimsData.merkleRoot}`);
      console.log(
        `💰 Total amount: ${ethers.formatEther(claimsData.totalAmount)} tokens`
      );
      console.log(`🔗 Metadata URI: ${metadataURI}`);
      console.log(
        `⏰ Claim deadline: ${new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );
      console.log(
        `🔓 Unlock timestamp: ${new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()}`
      );

      // Save airdrop info
      const airdropInfo = {
        airdropAddress,
        factoryAddress,
        tokenAddress,
        merkleRoot: claimsData.merkleRoot,
        metadataURI,
        totalAmount: claimsData.totalAmount,
        creator: deployer.address,
        creationTx: createTx.hash,
        creationBlock: receipt.blockNumber,
        timestamp: Date.now(),
      };

      const airdropsDir = path.join(__dirname, "..", "airdrops");
      if (!fs.existsSync(airdropsDir)) {
        fs.mkdirSync(airdropsDir, { recursive: true });
      }

      const airdropFile = path.join(airdropsDir, `${airdropAddress}.json`);
      fs.writeFileSync(airdropFile, JSON.stringify(airdropInfo, null, 2));

      console.log(`💾 Airdrop info saved to: ${airdropFile}`);
    } else {
      console.error("❌ AirdropCreated event not found in transaction");
    }
  } catch (error) {
    console.error("❌ Failed to create airdrop:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
