import { ethers } from "hardhat";

/**
 * View transaction logs for a specific transaction hash
 *
 * This script:
 * 1. Fetches transaction details from the blockchain
 * 2. Displays transaction information
 * 3. Shows all logs/events emitted
 * 4. Decodes logs using contract ABIs
 */

async function main() {
  console.log("🔍 Viewing Transaction Logs");
  console.log("=".repeat(50));

  const transactionHash =
    "0xdace556cdb3c53e50f0fbea79680dc5b22c31da1c9ba436d2073948b854e59f5";

  try {
    // Get network info
    const networkInfo = await ethers.provider.getNetwork();
    console.log(`📡 Network: ${networkInfo.name} (${networkInfo.chainId})`);
    console.log(`🔗 Transaction: ${transactionHash}`);
    console.log();

    // Fetch transaction details
    console.log("1️⃣ Fetching transaction details...");
    const tx = await ethers.provider.getTransaction(transactionHash);

    if (!tx) {
      console.log("❌ Transaction not found");
      return;
    }

    console.log("✅ Transaction found");
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Value: ${ethers.formatEther(tx.value)} ETH`);
    console.log(`   Gas Limit: ${tx.gasLimit?.toString()}`);
    console.log(
      `   Gas Price: ${ethers.formatUnits(tx.gasPrice || 0, "gwei")} gwei`
    );
    console.log(`   Nonce: ${tx.nonce}`);
    console.log();

    // Fetch transaction receipt
    console.log("2️⃣ Fetching transaction receipt...");
    const receipt = await ethers.provider.getTransactionReceipt(
      transactionHash
    );

    if (!receipt) {
      console.log(
        "❌ Transaction receipt not found (transaction may be pending)"
      );
      return;
    }

    console.log("✅ Transaction receipt found");
    console.log(
      `   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`
    );
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(
      `   Effective Gas Price: ${ethers.formatUnits(
        receipt.gasPrice || 0,
        "gwei"
      )} gwei`
    );
    console.log(`   Logs Count: ${receipt.logs.length}`);
    console.log();

    // Display all logs
    console.log("3️⃣ Transaction Logs:");
    console.log("-".repeat(50));

    if (receipt.logs.length === 0) {
      console.log("📝 No logs/events emitted");
    } else {
      receipt.logs.forEach((log, index) => {
        console.log(`\n📋 Log ${index + 1}:`);
        console.log(`   Address: ${log.address}`);
        console.log(`   Topics: ${log.topics.length}`);
        log.topics.forEach((topic, topicIndex) => {
          console.log(`     [${topicIndex}]: ${topic}`);
        });
        console.log(`   Data: ${log.data}`);
        console.log(`   Data Length: ${log.data.length} characters`);
      });
    }

    // Try to decode logs using known contract ABIs
    console.log("\n4️⃣ Attempting to decode logs...");
    console.log("-".repeat(50));

    // Load contract ABIs
    const AirdropFactoryABI = require("../artifacts/contracts/AirdropFactory.sol/AirdropFactory.json");
    const MerkleAirdropABI = require("../artifacts/contracts/MerkleAirdrop.sol/MerkleAirdrop.json");
    const ERC20ABI = require("../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json");

    const contractABIs = [
      { name: "AirdropFactory", abi: AirdropFactoryABI.abi },
      { name: "MerkleAirdrop", abi: MerkleAirdropABI.abi },
      { name: "ERC20", abi: ERC20ABI.abi },
    ];

    receipt.logs.forEach((log, index) => {
      console.log(`\n🔍 Decoding Log ${index + 1}:`);

      let decoded = false;
      for (const contract of contractABIs) {
        try {
          const iface = new ethers.Interface(contract.abi);
          const parsed = iface.parseLog({
            topics: log.topics,
            data: log.data,
          });

          if (parsed) {
            console.log(`   ✅ Decoded as ${contract.name}.${parsed.name}`);
            console.log(`   📝 Event: ${parsed.name}`);
            console.log(`   📊 Args:`);
            Object.entries(parsed.args).forEach(([key, value]) => {
              console.log(`      ${key}: ${value}`);
            });
            decoded = true;
            break;
          }
        } catch (error) {
          // Continue to next ABI
        }
      }

      if (!decoded) {
        console.log(`   ❓ Could not decode with known ABIs`);
        console.log(`   🔍 Raw topics: ${log.topics.join(", ")}`);
        console.log(`   🔍 Raw data: ${log.data}`);
      }
    });

    // Show Etherscan links
    console.log("\n5️⃣ Blockchain Explorer Links:");
    console.log("-".repeat(50));

    const baseUrl =
      networkInfo.chainId === 11155111n
        ? "https://sepolia.etherscan.io"
        : networkInfo.chainId === 1n
        ? "https://etherscan.io"
        : `https://${networkInfo.name}.etherscan.io`;

    console.log(`🌐 Transaction: ${baseUrl}/tx/${transactionHash}`);
    if (tx.to) {
      console.log(`🌐 Contract: ${baseUrl}/address/${tx.to}`);
    }

    console.log("\n✅ Transaction logs analysis complete!");
  } catch (error) {
    console.error("❌ Error fetching transaction logs:", error);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exitCode = 1;
});
