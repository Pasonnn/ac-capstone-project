# 🌐 Airdrop Builder Frontend

### A Decentralized Merkle Airdrop Platform Frontend
*(Next.js 16 + React 19 + Wagmi 2.12 + Viem 2.21)*

---

## 🧠 Overview

The **Airdrop Builder Frontend** is a modern, decentralized web application that enables anyone to create and participate in token airdrops without requiring a centralized backend. Built with Next.js 16 and React 19, it provides a seamless user experience for both airdrop creators and recipients.

### Key Features

- **📊 CSV Upload & Parsing** - Upload recipient lists with automatic token decimal detection
- **🌳 Merkle Tree Generation** - Automatic generation of Merkle trees and proofs
- **📦 IPFS Integration** - Decentralized storage of airdrop metadata and claim data
- **🔗 Direct Claiming** - Users can claim tokens directly from the interface
- **🔍 Smart Search & Filtering** - Find and filter airdrops with eligibility detection
- **⚡ Real-time Updates** - Live blockchain event monitoring and updates
- **🎨 Modern UI** - Beautiful, responsive interface built with TailwindCSS

---

## 🏗️ Project Structure

```
front-end/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── create/page.tsx          # Airdrop creation flow
│   ├── airdrops/page.tsx        # Browse all airdrops
│   ├── claim/[address]/page.tsx # Claim tokens page
│   └── api/ipfs-upload/route.ts # IPFS upload API
├── components/
│   ├── navigation.tsx           # Main navigation component
│   ├── wallet-connect.tsx       # Wallet connection component
│   ├── network-status-bar.tsx   # Network status indicator
│   └── ui/button.tsx            # Reusable button component
├── hooks/
│   ├── useAirdropFactory.ts     # Factory contract interactions
│   ├── useMerkleAirdrop.ts      # Airdrop contract interactions
│   └── useAirdropData.ts        # Blockchain event fetching
├── lib/
│   ├── contracts.ts             # Contract ABIs and configurations
│   ├── merkle.ts                # Merkle tree utilities
│   ├── utils.ts                 # General utilities
│   └── wagmi.ts                 # Wagmi configuration
├── providers/
│   └── wagmi-provider.tsx       # Wagmi provider setup
└── public/
    └── sample-airdrop.csv       # Sample CSV for testing
```

---

## 🚀 Prerequisites

- **Node.js 18+** - Required for Next.js 16
- **npm or yarn** - Package manager
- **MetaMask or compatible Web3 wallet** - For blockchain interactions
- **Sepolia ETH** - For testnet transactions (get from [Sepolia Faucet](https://sepoliafaucet.com/))

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pasonnn/ac-capstone-project.git
   cd ac-capstone-project/front-end
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```

4. **Configure environment variables**
   ```bash
   # Contract Addresses
   NEXT_PUBLIC_AIRDROP_FACTORY_ADDRESS=0x83c3860EcD9981f582434Ed67036db90D5375032

   # Network Configuration
   NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia testnet
   NEXT_PUBLIC_RPC_URL=https://eth-sepolia.public.blastapi.io

   # IPFS Configuration
   NEXT_PUBLIC_IPFS_GATEWAY_URL
   NEXT_IPFS_GATEWAY_URL_POST
   ```

---

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm run start
```

### Code Linting
```bash
npm run lint
```

---

## 🎯 Key Features & Pages

### 🎨 Create Airdrop (`/create`)

**Multi-step airdrop creation process:**

1. **CSV Upload** - Upload recipient list with automatic parsing
2. **Token Configuration** - Enter token address with automatic decimal detection
3. **Merkle Tree Generation** - Automatic generation and IPFS upload
4. **Deploy & Fund** - Two-step transaction (approve + create) with gas estimation

**Features:**
- ✅ CSV parsing with automatic validation
- ✅ Token decimals auto-detection (supports 6, 8, 18+ decimals)
- ✅ Real-time token information display
- ✅ Gas estimation and transaction status
- ✅ IPFS metadata upload
- ✅ Two-step transaction process for security

### 📋 Browse Airdrops (`/airdrops`)

**Comprehensive airdrop discovery:**

- **Live Data Fetching** - Real-time blockchain event monitoring
- **Smart Search** - Search by name, description, or contract address
- **Eligibility Filter** - Show only airdrops you're eligible for
- **Direct Claiming** - Claim tokens directly from the listing page
- **Token-Specific Formatting** - Correct decimal display for all token types

**Features:**
- ✅ Real-time blockchain data fetching
- ✅ Advanced search and filtering
- ✅ Eligibility detection and highlighting
- ✅ Direct claim functionality
- ✅ Token-specific decimal formatting
- ✅ Responsive card-based layout

### 🎁 Claim Page (`/claim/[address]`)

**Individual airdrop claiming interface:**

- **IPFS Data Loading** - Fetch claim data from decentralized storage
- **Merkle Proof Verification** - Automatic proof generation and validation
- **Direct Token Claiming** - One-click token claiming
- **Status Tracking** - Real-time claim status updates

---

## 🏛️ Architecture Highlights

### 🔗 Smart Contract Integration

**Wagmi Hooks for Blockchain Interactions:**
- `useAirdropFactory` - Factory contract interactions
- `useMerkleAirdrop` - Individual airdrop contract interactions
- `useAirdropData` - Blockchain event fetching and parsing

**Multi-Token Support:**
- Automatic decimal detection for any ERC20 token
- Support for 6 decimals (USDC/USDT), 8 decimals, 18 decimals (ETH), and more
- Dynamic amount formatting based on token decimals

### 🌳 Merkle Tree Implementation

**Efficient Proof Generation:**
- Uses `viem` for keccak256 hashing
- Generates proofs for each recipient
- Uploads complete claim data to IPFS
- Supports large recipient lists efficiently

### 📦 IPFS Integration

**Decentralized Storage:**
- Custom API route (`/api/ipfs-upload`) for secure uploads
- Gateway URL for fetching metadata
- Stores complete airdrop data including proofs
- Fallback handling for IPFS failures

### 🎨 Modern UI/UX

**Built with Latest Technologies:**
- Next.js 16 with App Router
- React 19 with latest features
- TailwindCSS for styling
- RainbowKit for wallet connection
- Lucide React for icons

---

## 🌐 Deployed Application

**Live Application:** [https://ac-capstone-project.vercel.app](https://ac-capstone-project.vercel.app)

**Network Information:**
- **Network:** Ethereum Sepolia Testnet
- **Chain ID:** 11155111
- **Factory Contract:** `0x83c3860EcD9981f582434Ed67036db90D5375032`
- **RPC URL:** https://eth-sepolia.public.blastapi.io

---

## 🛠️ Development

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.0.0 |
| **React** | React | 19.2.0 |
| **Blockchain** | Wagmi | 2.12.0 |
| **Blockchain** | Viem | 2.21.0 |
| **Styling** | TailwindCSS | 4.0.0 |
| **Wallet** | RainbowKit | 2.0.0 |
| **IPFS** | Custom API | - |
| **CSV Parsing** | PapaParse | 5.4.1 |
| **Merkle Tree** | merkletreejs | 0.4.0 |

### Key Dependencies

```json
{
  "wagmi": "^2.12.0",
  "viem": "^2.21.0",
  "@tanstack/react-query": "^5.59.0",
  "merkletreejs": "^0.4.0",
  "papaparse": "^5.4.1",
  "@rainbow-me/rainbowkit": "^2.0.0",
  "lucide-react": "^0.454.0"
}
```

---

## 🔧 Troubleshooting

### Common Issues

**1. Wallet Connection Issues**
- Ensure MetaMask is installed and unlocked
- Check that you're connected to Sepolia testnet
- Try refreshing the page and reconnecting

**2. Transaction Failures**
- Ensure you have sufficient Sepolia ETH for gas
- Check that you have sufficient token balance for airdrop creation
- Verify token approval has been completed

**3. IPFS Upload Issues**
- Check network connection
- Verify IPFS server is accessible
- Try uploading a smaller CSV file

**4. Token Decimal Issues**
- Ensure token address is correct and contract exists
- Check that token implements ERC20 standard
- Verify token is deployed on Sepolia testnet

### Getting Help

- **GitHub Issues:** [Create an issue](https://github.com/Pasonnn/ac-capstone-project/issues)
- **Email:** pason.dev@gmail.com
- **Documentation:** Check the main project README

---

## 📄 License

MIT © 2025 Pason.Dev

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Battle-tested smart contract libraries
- **Viem** - Type-safe Ethereum library
- **Wagmi** - React hooks for Ethereum
- **Next.js** - The React framework for production
- **TailwindCSS** - Utility-first CSS framework
