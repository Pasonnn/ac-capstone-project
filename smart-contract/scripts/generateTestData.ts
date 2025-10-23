import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethers";
import * as fs from "fs";
import * as path from "path";

interface ClaimData {
  index: number;
  account: string;
  amount: string;
  proof: string[];
}

interface AirdropData {
  index: number;
  account: string;
  amount: string;
}

async function main() {
  console.log("📊 Generating Test Airdrop Data...\n");

  // Generate test addresses (simulating CSV upload)
  const testAddresses = [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901",
    "0x3456789012345678901234567890123456789012",
    "0x4567890123456789012345678901234567890123",
    "0x5678901234567890123456789012345678901234",
    "0x6789012345678901234567890123456789012345",
    "0x7890123456789012345678901234567890123456",
    "0x8901234567890123456789012345678901234567",
    "0x9012345678901234567890123456789012345678",
    "0x0123456789012345678901234567890123456789",
  ];

  // Generate random amounts (simulating different claim amounts)
  const amounts = [
    ethers.parseEther("100"),
    ethers.parseEther("200"),
    ethers.parseEther("300"),
    ethers.parseEther("150"),
    ethers.parseEther("250"),
    ethers.parseEther("175"),
    ethers.parseEther("125"),
    ethers.parseEther("225"),
    ethers.parseEther("275"),
    ethers.parseEther("325"),
  ];

  // Create airdrop data
  const airdropData: AirdropData[] = testAddresses.map((address, index) => ({
    index,
    account: address,
    amount: amounts[index].toString(),
  }));

  // Generate Merkle Tree
  const leaves = airdropData.map((data) =>
    keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256"],
        [data.index, data.account, data.amount]
      )
    )
  );
  const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const merkleRoot = merkleTree.getHexRoot();

  // Generate proofs for each claim
  const claimsData: ClaimData[] = airdropData.map((data) => {
    const leaf = keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256"],
        [data.index, data.account, data.amount]
      )
    );
    const proof = merkleTree.getHexProof(leaf);

    return {
      index: data.index,
      account: data.account,
      amount: data.amount,
      proof: proof,
    };
  });

  // Calculate total amount
  const totalAmount = airdropData.reduce(
    (sum, data) => sum + BigInt(data.amount),
    0n
  );

  // Create metadata
  const metadata = {
    name: "Test Airdrop Campaign",
    description: "A test airdrop campaign for demonstration purposes",
    token: "0x0000000000000000000000000000000000000000", // Will be filled in during deployment
    merkleRoot: merkleRoot,
    totalAmount: totalAmount.toString(),
    claimDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    unlockTimestamp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
    createdAt: Math.floor(Date.now() / 1000),
    version: "1.0.0",
  };

  // Create claims.json (what would be uploaded to IPFS)
  const claimsJson = {
    metadata,
    claims: claimsData,
  };

  // Create CSV data (simulating the original upload)
  const csvData = airdropData.map((data, index) => ({
    address: data.account,
    amount: ethers.formatEther(data.amount),
    index: data.index,
  }));

  // Write files
  const outputDir = path.join(__dirname, "../test-data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write claims.json (for IPFS upload simulation)
  fs.writeFileSync(
    path.join(outputDir, "claims.json"),
    JSON.stringify(claimsJson, null, 2)
  );

  // Write CSV data (simulating original upload)
  const csvContent = [
    "address,amount,index",
    ...csvData.map((row) => `${row.address},${row.amount},${row.index}`),
  ].join("\n");

  fs.writeFileSync(path.join(outputDir, "airdrop.csv"), csvContent);

  // Write Merkle tree data
  fs.writeFileSync(
    path.join(outputDir, "merkle-data.json"),
    JSON.stringify(
      {
        merkleRoot,
        totalAmount: totalAmount.toString(),
        totalRecipients: airdropData.length,
        leaves: leaves,
      },
      null,
      2
    )
  );

  // Write individual claim data for testing
  fs.writeFileSync(
    path.join(outputDir, "individual-claims.json"),
    JSON.stringify(claimsData, null, 2)
  );

  console.log("✅ Test data generated successfully!");
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`📄 Files created:`);
  console.log(`   - claims.json (for IPFS upload)`);
  console.log(`   - airdrop.csv (original upload format)`);
  console.log(`   - merkle-data.json (Merkle tree data)`);
  console.log(`   - individual-claims.json (individual claim data)`);
  console.log();
  console.log("📊 Summary:");
  console.log(`   🌳 Merkle root: ${merkleRoot}`);
  console.log(`   👥 Total recipients: ${airdropData.length}`);
  console.log(`   💰 Total amount: ${ethers.formatEther(totalAmount)} tokens`);
  console.log(
    `   📅 Claim deadline: ${new Date(
      metadata.claimDeadline * 1000
    ).toISOString()}`
  );
  console.log(
    `   🔒 Unlock timestamp: ${new Date(
      metadata.unlockTimestamp * 1000
    ).toISOString()}`
  );
  console.log();
  console.log("🎯 Next steps:");
  console.log("   1. Upload claims.json to IPFS");
  console.log("   2. Use the Merkle root in your smart contract");
  console.log("   3. Users can claim using their individual proof data");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
