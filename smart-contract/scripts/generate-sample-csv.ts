import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parseEther } from "viem";

const { ethers } = await network.connect();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate sample CSV files for testing the airdrop system
 * Usage: npx hardhat run scripts/generate-sample-csv.ts
 */

interface AirdropRecipient {
  address: string;
  amount: string;
}

function generateRandomAddress(): string {
  // Generate a random address using crypto
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  const address =
    "0x" +
    Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  // Ensure it's exactly 42 characters
  if (address.length !== 42) {
    throw new Error(`Generated address has wrong length: ${address.length}`);
  }
  return address;
}

function generateRandomAmount(min: number, max: number): string {
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;
  return parseEther(amount.toString()).toString();
}

function generateSampleData(numRecipients: number): AirdropRecipient[] {
  const recipients: AirdropRecipient[] = [];

  for (let i = 0; i < numRecipients; i++) {
    recipients.push({
      address: generateRandomAddress(),
      amount: generateRandomAmount(1, 100), // 1 to 100 tokens
    });
  }

  return recipients;
}

function writeCSV(recipients: AirdropRecipient[], filename: string): void {
  const csvContent = recipients
    .map((recipient) => `${recipient.address},${recipient.amount}`)
    .join("\n");

  const filePath = path.join(__dirname, "..", "data", filename);
  fs.writeFileSync(filePath, csvContent);
  console.log(`✅ Generated ${filename} with ${recipients.length} recipients`);
}

async function main() {
  console.log("🚀 Generating sample CSV files...");

  // Ensure data directory exists
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Generate different sizes of airdrops
  const sizes = [
    { count: 10, filename: "small-airdrop.csv" },
    { count: 100, filename: "medium-airdrop.csv" },
    { count: 1000, filename: "large-airdrop.csv" },
  ];

  for (const size of sizes) {
    const recipients = generateSampleData(size.count);
    writeCSV(recipients, size.filename);
  }

  // Generate a specific test case with known addresses
  const testRecipients: AirdropRecipient[] = [
    {
      address: "0x1234567890123456789012345678901234567890",
      amount: parseEther("100").toString(),
    },
    {
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      amount: parseEther("250").toString(),
    },
    {
      address: "0x9876543210987654321098765432109876543210",
      amount: parseEther("50").toString(),
    },
    {
      address: "0xfedcba9876543210fedcba9876543210fedcba98",
      amount: parseEther("75").toString(),
    },
    {
      address: "0x1111111111111111111111111111111111111111",
      amount: parseEther("200").toString(),
    },
  ];

  writeCSV(testRecipients, "test-airdrop.csv");

  console.log("\n📁 Generated files:");
  console.log("  - small-airdrop.csv (10 recipients)");
  console.log("  - medium-airdrop.csv (100 recipients)");
  console.log("  - large-airdrop.csv (1000 recipients)");
  console.log("  - test-airdrop.csv (5 known recipients)");

  console.log("\n💡 Next steps:");
  console.log(
    "  1. Run: npm run build-merkle -- --input data/test-airdrop.csv"
  );
  console.log("  2. This will generate claims.json with Merkle proofs");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
