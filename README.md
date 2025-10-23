# 🌐 Airdrop Builder
### A Fully Decentralized, Self-Service Merkle Airdrop Platform
*(Next.js 16 + React 19 + Solidity 0.8.28 + IPFS)*

---

## 🧠 Overview

**Airdrop Builder** is a production-ready, decentralized web application that enables anyone to create and participate in token airdrops without requiring a centralized backend. Built with modern web3 technologies, it provides a seamless experience for both airdrop creators and recipients.

### 🎯 **Live Application**
**🌐 [https://ac-capstone-project.vercel.app](https://ac-capstone-project.vercel.app)**

### Key Capabilities

**For Creators:**
- 📊 Upload CSV files with recipient data and automatic token decimal detection
- 🌳 Generate Merkle trees and proofs automatically
- 📦 Store airdrop metadata on IPFS for decentralization
- ⚡ Deploy and fund airdrops in a single transaction
- 🔒 Automatic 7-day withdrawal lock for security

**For Recipients:**
- 🔍 Browse and discover available airdrops
- ✅ Check eligibility automatically
- 🎁 Claim tokens directly from the interface
- 📱 Mobile-friendly responsive design

---

## 🏗️ System Architecture

```
Next.js 16 DApp (App Router + API Routes)
│
├── 📊 CSV Upload → 🔍 Token Decimal Detection → 🌳 Merkle Tree Generation
│
├── 📦 IPFS Upload (claims.json + metadata) → 🔗 Smart Contract Interaction
│
├── 🏭 AirdropFactory.createAirdropAndFund(token, root, ipfsURI, amount)
│       │
│       └── 🪙 Deploy MerkleAirdrop (EIP-1167 minimal proxy)
│              ├── ✅ claim() - users claim with Merkle proof
│              ├── 🔒 7-day withdrawal lock
│              └── 💰 withdrawRemaining() - creator withdraws after lock
│
├── 🔍 Real-time Event Monitoring (AirdropCreated, Claimed)
├── 🎨 Modern UI (TailwindCSS + RainbowKit + Wagmi)
└── 📱 Mobile-responsive design
```

---

## ⚙️ Features

| Feature | Description |
|----------|--------------|
| **🧩 Merkle Proof Verification** | Efficient on-chain eligibility checks using Merkle root verification |
| **💸 Auto Funding** | Creator funds the airdrop in the same transaction |
| **🔒 7-Day Lock** | Creator can only withdraw unclaimed tokens after 7 days |
| **📦 IPFS Integration** | All claim data (proofs) stored on decentralized IPFS |
| **⚡ Minimal Proxy Deployment** | Uses EIP-1167 Clones for low-gas contract creation (~45k gas vs 2M gas) |
| **💻 Frontend-Only** | Entirely built on Next.js 16 (no backend server required) |
| **🔍 Smart Search & Filtering** | Find airdrops with eligibility detection and advanced filtering |
| **📊 Multi-Token Support** | Automatic decimal detection for any ERC20 token (6, 8, 18+ decimals) |
| **⚡ Real-time Updates** | Live blockchain event monitoring and automatic UI updates |
| **🎨 Modern UI/UX** | Beautiful, responsive interface with TailwindCSS and RainbowKit |

---

## 🧱 Smart Contract Overview

### 🪙 `MerkleAirdrop.sol`
Handles individual airdrop logic with Merkle proof verification and time-locked withdrawals.

**Key Functions**
```solidity
function initialize(address token, address owner, bytes32 merkleRoot, string memory metadataURI, uint256 totalAmount) external;
function claim(uint256 index, address account, uint256 amount, bytes32[] calldata proof) external;
function withdrawRemaining() external;
function isClaimed(uint256 index) external view returns (bool);
```

**Security Features**
- ✅ Merkle proof verification via OpenZeppelin `MerkleProof`
- ✅ Bitmap-based claim tracking (gas efficient)
- ✅ 7-day withdrawal lock prevents rug pulls
- ✅ Event emission for indexing and monitoring

---

### 🏭 `AirdropFactory.sol`

Deploys and funds airdrop contracts using EIP-1167 minimal proxy pattern.

**Core Functions**
```solidity
function createAirdropAndFund(address token, bytes32 merkleRoot, string calldata metadataURI, uint256 totalAmount) external returns (address);
function createDeterministicAirdropAndFund(bytes32 salt, address token, bytes32 merkleRoot, string calldata metadataURI, uint256 totalAmount) external returns (address);
```

**Deployment Flow**
1. Creator approves Factory to spend tokens
2. Factory clones `MerkleAirdrop` implementation
3. Initializes clone with airdrop parameters
4. Transfers tokens to the airdrop contract
5. Emits `AirdropCreated` event for frontend indexing

**Gas Optimization**
- 🚀 **~45,000 gas** for airdrop deployment (vs ~2,000,000 gas for full deployment)
- 🚀 **~200,000 gas** for create + fund transaction
- 🚀 **~80,000 gas** for token claiming

---

## 🖥️ Frontend (Next.js 16)

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.0.0 (App Router) |
| **React** | React | 19.2.0 |
| **Blockchain** | Wagmi | 2.12.0 |
| **Blockchain** | Viem | 2.21.0 |
| **Styling** | TailwindCSS | 4.0.0 |
| **Wallet** | RainbowKit | 2.0.0 |
| **IPFS** | Custom API | - |
| **CSV Parsing** | PapaParse | 5.4.1 |
| **Merkle Tree** | merkletreejs | 0.4.0 |

---

### Key Pages & Features

| Route | Description | Features |
|-------|-------------|----------|
| **`/create`** | Multi-step airdrop creation | CSV upload, token decimal detection, Merkle generation, IPFS upload, contract deployment |
| **`/airdrops`** | Browse and discover airdrops | Real-time data fetching, smart search, eligibility filtering, direct claiming |
| **`/claim/[address]`** | Individual airdrop claiming | IPFS data loading, Merkle proof verification, one-click claiming |
| **`/api/ipfs-upload`** | Secure IPFS upload API | Serverless route for decentralized storage |

### 🎨 Modern UI Features
- 📱 **Responsive Design** - Mobile-first approach with TailwindCSS
- 🔍 **Smart Search** - Full-text search across airdrop names and descriptions
- ✅ **Eligibility Detection** - Automatic checking of user eligibility
- 🎁 **Direct Claiming** - Claim tokens without leaving the airdrops page
- 📊 **Token-Specific Formatting** - Correct decimal display for all ERC20 tokens

---

## 🚀 Quick Start

### 🌐 **Live Application**
**👉 [https://ac-capstone-project.vercel.app](https://ac-capstone-project.vercel.app)**

### 📋 Prerequisites
- **Node.js 18+** - Required for Next.js 16
- **MetaMask** - Web3 wallet for blockchain interactions
- **Sepolia ETH** - For testnet transactions ([Get from Sepolia Faucet](https://sepoliafaucet.com/))

### 🛠️ Development Setup

**1. Clone the repository**
```bash
git clone https://github.com/Pasonnn/ac-capstone-project.git
cd ac-capstone-project
```

**2. Frontend Setup**
```bash
cd front-end
npm install
cp env.example .env.local
# Configure your environment variables
npm run dev
```

**3. Smart Contract Setup**
```bash
cd smart-contract
npm install
cp .env.example .env
# Configure your environment variables
npm run compile
npm run test
```

### 🔧 Environment Configuration

**Frontend (`.env.local`)**
```bash
# Contract Addresses
NEXT_PUBLIC_AIRDROP_FACTORY_ADDRESS=0x83c3860EcD9981f582434Ed67036db90D5375032

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia testnet
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.public.blastapi.io

# IPFS Configuration
NEXT_PUBLIC_IPFS_GATEWAY_URL=your_ipfs_gateway_url
NEXT_IPFS_GATEWAY_URL_POST=your_ipfs_upload_url
```

**Smart Contract (`.env`)**
```bash
# Private Keys (NEVER commit these!)
PRIVATE_KEY=your_private_key_here

# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.public.blastapi.io
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Configuration
IPFS_POST_URL=your_ipfs_upload_url
IPFS_GET_URL=your_ipfs_gateway_url
```

### 🏃‍♂️ Running the Application

**Development Mode**
```bash
cd front-end
npm run dev
# Visit http://localhost:3000
```

**Production Build**
```bash
cd front-end
npm run build
npm run start
```

**Smart Contract Deployment**
```bash
cd smart-contract
npm run deploy:sepolia
```

---

## 💰 Airdrop Workflow

### 🎨 **Creator Flow**

1. **Connect Wallet** - Connect MetaMask to Sepolia testnet
2. **Upload CSV** - Upload recipient list with automatic parsing and validation
3. **Configure Token** - Enter token address with automatic decimal detection
4. **Generate Merkle Tree** - Automatic generation of Merkle root and proofs
5. **Upload to IPFS** - Store claims data and metadata on decentralized storage
6. **Deploy & Fund** - Two-step transaction (approve + create) with gas estimation
7. **Monitor Airdrop** - Track claims and manage the airdrop from `/airdrops`

### 🎁 **Recipient Flow**

1. **Browse Airdrops** - Visit `/airdrops` to see all available airdrops
2. **Check Eligibility** - System automatically checks if wallet is eligible
3. **View Details** - Click on airdrop to see full details and claim amount
4. **Claim Tokens** - One-click claiming directly from the interface
5. **Track Status** - Monitor claim status and transaction confirmations

### 🔄 **System Flow**

```
Creator Uploads CSV
        ↓
Token Decimal Detection
        ↓
Merkle Tree Generation
        ↓
IPFS Metadata Upload
        ↓
Smart Contract Deployment
        ↓
Real-time Event Monitoring
        ↓
Recipient Discovery & Claiming
```

---

## 🔒 Security Design

| Risk | Mitigation | Implementation |
|------|------------|----------------|
| **Creator rug-pulls funds** | 7-day withdrawal lock | Time-locked withdrawals prevent immediate fund extraction |
| **Double-claiming** | Bitmap verification | Gas-efficient bitmap tracks claimed indices |
| **Empty contracts** | Auto-funding on creation | Factory transfers tokens during deployment |
| **Invalid proofs** | Merkle proof verification | OpenZeppelin MerkleProof library validation |
| **Expired claims** | Time-based restrictions | 7-day claim deadline enforcement |
| **Unauthorized access** | Owner-only functions | Proper access control on sensitive functions |

### 🛡️ Security Features
- ✅ **OpenZeppelin Integration** - Battle-tested security libraries
- ✅ **Gas Optimization** - Efficient storage patterns prevent DoS attacks
- ✅ **Event Emission** - Transparent on-chain activity logging
- ✅ **Input Validation** - All parameters validated before processing

---

## 📁 Project Structure

```
ac-capstone-project/
├── front-end/                    # Next.js 16 DApp
│   ├── app/                      # App Router pages
│   │   ├── create/page.tsx       # Airdrop creation flow
│   │   ├── airdrops/page.tsx     # Browse airdrops
│   │   ├── claim/[address]/page.tsx # Individual claiming
│   │   └── api/ipfs-upload/route.ts # IPFS upload API
│   ├── components/               # React components
│   ├── hooks/                    # Custom Wagmi hooks
│   ├── lib/                      # Utilities and configurations
│   └── public/                   # Static assets
├── smart-contract/               # Solidity contracts
│   ├── contracts/                # Smart contract source
│   ├── scripts/                  # Deployment and utility scripts
│   ├── test/                     # Comprehensive test suite
│   ├── deployments/              # Deployment artifacts
│   └── test-data/                # Sample data for testing
└── README.md                     # This file
```

---

## 🧪 Testing

### Smart Contract Testing
```bash
cd smart-contract
npm run test           # Run all tests
npm run test:flow      # Run comprehensive flow tests
REPORT_GAS=true npm run test  # Run with gas reporting
```

### Frontend Testing
```bash
cd front-end
npm run build          # Test production build
npm run lint           # Run ESLint
```

### Test Coverage
- ✅ **Unit Tests** - Individual function testing
- ✅ **Integration Tests** - End-to-end airdrop flow
- ✅ **Edge Case Testing** - Error conditions and boundaries
- ✅ **Gas Optimization** - Cost analysis and optimization
- ✅ **Security Testing** - Access control and validation

---

## 🌐 Deployment Information

### Live Application
- **URL:** [https://ac-capstone-project.vercel.app](https://ac-capstone-project.vercel.app)
- **Network:** Ethereum Sepolia Testnet
- **Chain ID:** 11155111
- **Factory Contract:** `0x83c3860EcD9981f582434Ed67036db90D5375032`

### Contract Verification
- **Factory:** [View on Etherscan](https://sepolia.etherscan.io/address/0x83c3860EcD9981f582434Ed67036db90D5375032)
- **Implementation:** Check `smart-contract/deployments/sepolia_deployment.json`

---

## 🧭 Roadmap

### ✅ Completed Features
- [x] Core smart contracts (Merkle Airdrop + Factory)
- [x] Next.js 16 DApp with App Router
- [x] Auto funding + 7-day lock
- [x] Real-time blockchain event monitoring
- [x] Multi-token decimal support
- [x] IPFS integration for decentralized storage
- [x] Smart search and filtering
- [x] Direct claiming functionality

### 🚀 Future Enhancements
- [ ] **Analytics Dashboard** - Claim statistics and analytics
- [ ] **NFT Airdrop Support** - ERC-721 token airdrops
- [ ] **Batch Operations** - Multiple airdrop management
- [ ] **DAO Integration** - Community governance features
- [ ] **Mobile App** - React Native mobile application
- [ ] **Advanced Analytics** - Detailed claim tracking and reporting

---

## 📚 Documentation

### 📖 Detailed READMEs
- **[Frontend Documentation](front-end/README.md)** - Complete Next.js DApp guide
- **[Smart Contract Documentation](smart-contract/README.md)** - Solidity contracts and deployment guide

### 🔗 External Links
- **Live Application:** [https://ac-capstone-project.vercel.app](https://ac-capstone-project.vercel.app)
- **GitHub Repository:** [https://github.com/Pasonnn/ac-capstone-project](https://github.com/Pasonnn/ac-capstone-project)
- **Etherscan Factory:** [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x83c3860EcD9981f582434Ed67036db90D5375032)

---

## 🧑‍💻 Author

**Pason.Dev**
- 📧 **Email:** pason.dev@gmail.com
- 💡 **Mission:** "Building open, decentralized ecosystems for transparent growth."
- 🌐 **Website:** [pason.dev](https://pason.dev)

---

## 📄 License

**MIT License** © 2025 Pason.Dev

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Battle-tested smart contract libraries
- **Viem** - Type-safe Ethereum library
- **Wagmi** - React hooks for Ethereum
- **Next.js** - The React framework for production
- **TailwindCSS** - Utility-first CSS framework
- **RainbowKit** - Beautiful wallet connection UI
- **Ethereum Foundation** - Core protocol development
