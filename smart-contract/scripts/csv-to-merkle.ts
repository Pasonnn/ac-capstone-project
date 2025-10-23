import { network } from "hardhat";
import { MerkleTree } from "merkletreejs";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import { fileURLToPath } from "url";
import { keccak256, formatEther } from "viem";

const { ethers } = await network.connect();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ClaimData {
  index: number;
  address: string;
  amount: string;
  proof: string[];
}

interface ClaimsData {
  merkleRoot: string;
  totalAmount: string;
  claims: Record<string, ClaimData>;
}

/**
 * Generate Merkle tree and proofs from CSV file
 * Usage: npx hardhat run scripts/csv-to-merkle.ts -- --input data/test-airdrop.csv
 */

function hashLeaf(index: number, account: string, amount: bigint): string {
  // Manually implement solidityPackedKeccak256
  // This is equivalent to keccak256(abi.encodePacked(index, account, amount))
  const indexBytes = new Uint8Array(32);
  const indexView = new DataView(indexBytes.buffer);
  indexView.setBigUint64(24, BigInt(index), false); // Big-endian

  const accountBytes = new Uint8Array(20);
  const accountHex = account.slice(2); // Remove 0x
  for (let i = 0; i < 20; i++) {
    accountBytes[i] = parseInt(accountHex.slice(i * 2, i * 2 + 2), 16);
  }

  const amountBytes = new Uint8Array(32);
  const amountView = new DataView(amountBytes.buffer);
  amountView.setBigUint64(24, amount, false); // Big-endian

  // Concatenate the packed data
  const packed = new Uint8Array(84); // 32 + 20 + 32
  packed.set(indexBytes, 0);
  packed.set(accountBytes, 32);
  packed.set(amountBytes, 52);

  return keccak256(packed);
}

async function parseCSV(
  filePath: string
): Promise<Array<{ address: string; amount: string }>> {
  return new Promise((resolve, reject) => {
    const results: Array<{ address: string; amount: string }> = [];

    fs.createReadStream(filePath)
      .pipe(csv({ headers: ["address", "amount"] }))
      .on("data", (data) => {
        // Normalize address to lowercase first
        data.address = data.address.toLowerCase().trim();

        // Validate address format (basic check)
        if (!data.address.startsWith("0x") || data.address.length !== 42) {
          throw new Error(
            `Invalid address: ${data.address} (length: ${data.address.length})`
          );
        }

        // Validate amount (must be a valid number)
        if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
          throw new Error(`Invalid amount: ${data.amount}`);
        }

        results.push({
          address: data.address,
          amount: data.amount,
        });
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function generateMerkleTree(
  recipients: Array<{ address: string; amount: string }>
): Promise<ClaimsData> {
  console.log(`📊 Processing ${recipients.length} recipients...`);

  // Sort recipients by address for deterministic tree
  const sortedRecipients = recipients.sort((a, b) =>
    a.address.localeCompare(b.address)
  );

  // Calculate total amount
  let totalAmount = BigInt(0);
  const leaves: string[] = [];
  const claims: Record<string, ClaimData> = {};

  // Generate leaves and calculate total
  for (let i = 0; i < sortedRecipients.length; i++) {
    const recipient = sortedRecipients[i];
    const amount = BigInt(recipient.amount);
    totalAmount += amount;

    const leaf = hashLeaf(i, recipient.address, amount);
    leaves.push(leaf);

    // Store claim data
    claims[recipient.address] = {
      index: i,
      address: recipient.address,
      amount: recipient.amount,
      proof: [], // Will be filled after tree generation
    };
  }

  console.log(`💰 Total amount: ${formatEther(totalAmount)} tokens`);

  // Create Merkle tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = tree.getHexRoot();

  console.log(`🌳 Merkle root: ${merkleRoot}`);

  // Generate proofs for each claim
  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    const proof = tree.getHexProof(leaf);

    // Find the claim by index
    const claim = Object.values(claims).find((c) => c.index === i);
    if (claim) {
      claim.proof = proof;
    }
  }

  return {
    merkleRoot,
    totalAmount: totalAmount.toString(),
    claims,
  };
}

async function saveClaimsData(
  claimsData: ClaimsData,
  outputPath: string
): Promise<void> {
  const jsonContent = JSON.stringify(claimsData, null, 2);
  fs.writeFileSync(outputPath, jsonContent);
  console.log(`💾 Saved claims data to: ${outputPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const inputArg = args.find((arg) => arg.startsWith("--input="));
  const inputFile = inputArg ? inputArg.split("=")[1] : "data/test-airdrop.csv";

  const inputPath = path.resolve(inputFile);
  const outputPath = path.join(path.dirname(inputPath), "claims.json");

  console.log(`📁 Reading CSV from: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    console.log("💡 Generate sample CSV first: npm run generate-csv");
    process.exit(1);
  }

  try {
    // Parse CSV file
    const recipients = await parseCSV(inputPath);
    console.log(`✅ Parsed ${recipients.length} recipients from CSV`);

    // Generate Merkle tree and proofs
    const claimsData = await generateMerkleTree(recipients);

    // Save to JSON file
    await saveClaimsData(claimsData, outputPath);

    console.log("\n🎉 Merkle tree generation complete!");
    console.log(`📄 Claims file: ${outputPath}`);
    console.log(`🌳 Merkle root: ${claimsData.merkleRoot}`);
    console.log(
      `💰 Total amount: ${formatEther(claimsData.totalAmount)} tokens`
    );

    // Show sample claim data
    const sampleAddress = Object.keys(claimsData.claims)[0];
    if (sampleAddress) {
      const sampleClaim = claimsData.claims[sampleAddress];
      console.log(`\n📋 Sample claim for ${sampleAddress}:`);
      console.log(`   Index: ${sampleClaim.index}`);
      console.log(`   Amount: ${formatEther(sampleClaim.amount)} tokens`);
      console.log(`   Proof length: ${sampleClaim.proof.length} hashes`);
    }
  } catch (error) {
    console.error("❌ Error generating Merkle tree:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
