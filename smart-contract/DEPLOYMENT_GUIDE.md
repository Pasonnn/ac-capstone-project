# 🚀 Sepolia Deployment Guide

This guide will help you deploy the Merkle Airdrop System to Sepolia testnet and create your first airdrop.

## 📋 Prerequisites

### 1. **Environment Setup**
```bash
# Install dependencies
npm install

# Compile contracts
npm run compile
```

### 2. **Sepolia Testnet Setup**
- Get Sepolia ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- You need at least 0.01 ETH for deployment
- Set up your private key in environment variables

### 3. **Environment Variables**
Create a `.env` file in the smart-contract directory:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.public.blastapi.io
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🚀 Deployment Steps

### Step 1: Deploy Core Contracts
```bash
npm run deploy:sepolia
```

This will deploy:
- ✅ MockERC20 token
- ✅ MerkleAirdrop implementation
- ✅ AirdropFactory
- ✅ Verify contracts on Etherscan

**Expected Output:**
```
🚀 Deploying Merkle Airdrop System to Sepolia
==================================================
📡 Network: sepolia (11155111)
👤 Deployer: 0x...
💰 Balance: 0.1 ETH

📦 DEPLOYMENT PHASE
------------------------------
1️⃣ Deploying MockERC20...
✅ MockERC20 deployed: 0x...

2️⃣ Deploying MerkleAirdrop implementation...
✅ MerkleAirdrop implementation deployed: 0x...

3️⃣ Deploying AirdropFactory...
✅ AirdropFactory deployed: 0x...

🔍 VERIFICATION PHASE
------------------------------
1️⃣ Verifying contracts on Etherscan...
✅ MockERC20 verified on Etherscan
✅ MerkleAirdrop implementation verified on Etherscan
✅ AirdropFactory verified on Etherscan

🎉 DEPLOYMENT COMPLETE!
==================================================
✅ MockERC20 deployed and verified
✅ MerkleAirdrop implementation deployed and verified
✅ AirdropFactory deployed and verified

📄 Deployment information saved to: deployments/sepolia_deployment.json
```

### Step 2: Create an Airdrop
```bash
npm run create:airdrop
```

This will:
- ✅ Generate sample airdrop data
- ✅ Create Merkle tree and proofs
- ✅ Deploy and fund the airdrop
- ✅ Save airdrop information

**Expected Output:**
```
🎁 Creating Airdrop on Sepolia
========================================
📡 Network: sepolia (11155111)
👤 Deployer: 0x...

🔗 CONNECTING TO DEPLOYED CONTRACTS
----------------------------------------
✅ Connected to MockERC20: 0x...
✅ Connected to AirdropFactory: 0x...

📋 CREATING SAMPLE AIRDROP DATA
----------------------------------------
📋 Sample recipients:
   0: 0x1234... - 100.0 tokens
   1: 0xabcd... - 250.0 tokens
   2: 0x9876... - 150.0 tokens
   3: 0xfedc... - 200.0 tokens
   4: 0x1111... - 300.0 tokens

🌳 Merkle root: 0x...
💰 Total airdrop amount: 1000.0 tokens

🎁 CREATING AIRDROP
----------------------------------------
1️⃣ Approving factory to spend tokens...
✅ Factory approved to spend tokens
2️⃣ Creating airdrop...
✅ Airdrop creation transaction sent
🎯 Airdrop deployed: 0x...

3️⃣ Verifying airdrop state...
   Token: 0x...
   Owner: 0x...
   Merkle root: 0x...
   Balance: 1000.0 tokens

💾 SAVING AIRDROP INFORMATION
----------------------------------------
📄 Airdrop information saved to: deployments/sepolia_airdrop_0x....json

🎉 AIRDROP CREATED SUCCESSFULLY!
==================================================
✅ Airdrop deployed and funded
✅ Merkle tree generated
✅ Claims data saved
✅ Ready for users to claim tokens

🔗 Contract Addresses:
   Airdrop: 0x...
   Token: 0x...
   Factory: 0x...

🌐 Etherscan:
   Airdrop: https://sepolia.etherscan.io/address/0x...
   Token: https://sepolia.etherscan.io/address/0x...
```

### Step 3: Claim Tokens
```bash
npm run claim:airdrop
```

This will:
- ✅ Connect to the airdrop contract
- ✅ Load claim data for the user
- ✅ Submit claim transaction
- ✅ Verify claim was successful

**Expected Output:**
```
🎯 Claiming Airdrop Tokens
========================================
📡 Network: sepolia (11155111)
👤 Claimer: 0x...

📄 Loaded airdrop: 0x...
✅ Claim found for 0x...
   Index: 0
   Amount: 100.0 tokens
   Proof length: 3 hashes
💰 Balance before claim: 0.0 tokens

🎯 CLAIMING TOKENS
----------------------------------------
1️⃣ Submitting claim transaction...
⏳ Waiting for transaction confirmation...
✅ Claim transaction confirmed: 0x...

2️⃣ Verifying claim...
   Claimed: true
   Balance after: 100.0 tokens
   Tokens received: 100.0 tokens
✅ Claim successful!

🎉 CLAIM SUCCESSFUL!
==================================================
✅ Tokens claimed successfully
✅ Merkle proof verified
✅ Claim marked as used

📊 Transaction Details:
   Hash: 0x...
   Gas used: 123456
   Block: 12345678

🌐 Etherscan:
   Transaction: https://sepolia.etherscan.io/tx/0x...
   Airdrop: https://sepolia.etherscan.io/address/0x...
```

## 📁 Generated Files

### Deployment Information
- `deployments/sepolia_deployment.json` - Core contract addresses
- `deployments/sepolia_airdrop_0x....json` - Airdrop details and claims

### Airdrop Data Structure
```json
{
  "timestamp": 1234567890,
  "network": "sepolia",
  "airdropAddress": "0x...",
  "token": "0x...",
  "factory": "0x...",
  "merkleRoot": "0x...",
  "metadataURI": "ipfs://...",
  "totalAmount": "1000000000000000000000",
  "recipients": 5,
  "claims": {
    "0x1234...": {
      "index": 0,
      "amount": "100000000000000000000",
      "proof": ["0x...", "0x...", "0x..."]
    }
  }
}
```

## 🔧 Manual Deployment (Alternative)

If the scripts don't work, you can use Hardhat console:

```bash
npx hardhat console --network sepolia
```

Then in the console:
```javascript
const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();

// Deploy MockERC20
const MockERC20 = await ethers.getContractFactory("MockERC20");
const token = await MockERC20.deploy("Test Token", "TT", 18, ethers.parseEther("1000000"));
await token.waitForDeployment();
console.log("Token:", await token.getAddress());

// Deploy MerkleAirdrop
const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
const airdrop = await MerkleAirdrop.deploy(
  await token.getAddress(),
  deployer.address,
  ethers.keccak256(ethers.toUtf8Bytes("dummy")),
  "https://example.com",
  0
);
await airdrop.waitForDeployment();
console.log("Airdrop:", await airdrop.getAddress());

// Deploy Factory
const AirdropFactory = await ethers.getContractFactory("AirdropFactory");
const factory = await AirdropFactory.deploy(await airdrop.getAddress());
await factory.waitForDeployment();
console.log("Factory:", await factory.getAddress());
```

## 🎯 Next Steps

1. **Customize Airdrop Data**: Replace sample recipients with real addresses
2. **Upload to IPFS**: Store claims data on IPFS for metadata URI
3. **Frontend Integration**: Connect your frontend to the deployed contracts
4. **User Interface**: Create a UI for users to claim tokens
5. **Monitoring**: Set up monitoring for airdrop progress

## 🔗 Useful Links

- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🆘 Troubleshooting

### Common Issues:
1. **Insufficient Balance**: Get more Sepolia ETH from faucet
2. **Network Issues**: Check RPC URL in hardhat.config.ts
3. **Private Key**: Ensure private key is correct in .env
4. **Gas Issues**: Increase gas limit in hardhat.config.ts

### Debug Commands:
```bash
# Check network connection
npx hardhat console --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <contract_address> <constructor_args>

# Check deployment status
ls deployments/
```

---

**🎉 Congratulations!** You've successfully deployed the Merkle Airdrop System to Sepolia testnet!
