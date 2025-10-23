# 🌐 Airdrop Builder
### A Fully Decentralized, Self-Service Merkle Airdrop Platform
*(Next.js + Solidity + IPFS)*

---

## 🧠 Overview

**Airdrop Builder** is a decentralized web application that allows anyone to create and manage airdrops without a centralized backend.

Creators can:
1. Upload a CSV of wallet addresses and token amounts.
2. Automatically generate a **Merkle tree** and store the `claims.json` on **IPFS**.
3. Deploy and fund a **Merkle Airdrop contract** via a **Factory contract** in one transaction.
4. Automatically lock their ability to withdraw tokens for **7 days** to ensure fairness.

Claimers can:
- Connect their wallet, verify eligibility using Merkle proofs, and **claim tokens** directly from the contract.

Everything runs on-chain and in-browser — **no backend, no database, no trust**.

---

## 🏗️ System Architecture

```
Next.js DApp (frontend + API route)
│
├── Upload CSV → Generate Merkle Root → Upload to IPFS
│
├── Call FactoryFacet.createAirdropAndFund(token, root, ipfsCID, totalAmount)
│       │
│       └── Deploy & fund new MerkleAirdrop contract (via EIP-1167 clone)
│              ├── claim() - users claim with proof
│              └── withdrawRemaining() - creator withdraws after 7 days
│
└── Read Events: AirdropCreated(), Claimed()
```

---

## ⚙️ Features

| Feature | Description |
|----------|--------------|
| **🧩 Merkle Proof Verification** | Efficient on-chain eligibility checks using Merkle root verification |
| **💸 Auto Funding** | Creator funds the airdrop in the same transaction |
| **🔒 7-Day Lock** | Creator can only withdraw unclaimed tokens after 7 days |
| **📦 IPFS Integration** | All claim data (proofs) stored on decentralized IPFS |
| **⚡ Minimal Proxy Deployment** | Uses EIP-1167 Clones for low-gas contract creation |
| **💻 Frontend-Only** | Entirely built on Next.js (no backend server required) |

---

## 🧱 Smart Contract Overview

### 🪙 `MerkleAirdrop.sol`
Handles claiming, withdrawal locking, and verification.

**Key Functions**
```solidity
function initialize(address token, address owner, bytes32 merkleRoot, string memory metadataURI, uint256 totalAmount) external;
function claim(uint256 index, address account, uint256 amount, bytes32[] calldata proof) external;
function withdrawRemaining(address to) external;
```

**Key Features**

* Merkle proof verification via OpenZeppelin `MerkleProof`.
* Claim and withdrawal events.
* 7-day lock period enforced via `unlockTimestamp`.

---

### 🏭 `AirdropFactoryFacet.sol`

Deploys and funds airdrop contracts in one transaction.

**Flow**

1. Creator approves Factory to spend tokens.
2. Calls:

   ```solidity
   createAirdropAndFund(address token, bytes32 merkleRoot, string calldata metadataURI, uint256 totalAmount)
   ```
3. Factory clones `MerkleAirdrop` → initializes → transfers tokens into it → emits:

   ```solidity
   event AirdropCreated(address indexed creator, address indexed token, address indexed airdrop, bytes32 merkleRoot, string metadataURI, uint256 timestamp, uint256 totalAmount);
   ```

---

## 🖥️ Frontend (Next.js)

### Tech Stack

| Layer       | Technology                 |
| ----------- | -------------------------- |
| Framework   | Next.js 14 (App Router)    |
| Blockchain  | wagmi + viem               |
| Styling     | TailwindCSS                |
| IPFS        | Web3.Storage or Pinata SDK |
| CSV Parsing | Papaparse                  |
| Merkle Tree | merkletreejs + ethers.js   |

---

### Key Pages

| Route              | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `/create`          | Upload CSV → Generate Merkle → Upload to IPFS → Deploy Airdrop |
| `/airdrops`        | Display all created airdrops (from `AirdropCreated` events)    |
| `/claim/[address]` | Claim UI for each deployed airdrop                             |
| `/api/ipfs-upload` | Serverless route for secure IPFS upload (hides API key)        |

---

## 🪜 Development Setup

### 1️⃣ Prerequisites

* Node.js v18+
* npm / yarn
* MetaMask (connected to Sepolia or testnet)
* Pinata / Web3.Storage API key

---

### 2️⃣ Clone & Install

```bash
git clone https://github.com/Pasonnn/ac-capstone-project.git
cd ac-capstone-project
cd smart-contract
npm install
cd ../front-end
npm install
```

---

### 3️⃣ Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddress
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/<your-key>
NEXT_PUBLIC_IPFS_GATEWAY_URL_GET=https://your-ipfs-node/ipfs
NEXT_PUBLIC_IPFS_GATEWAY_URL_POST=http://your-ipfs-node/api/v0/add
```

---

### 4️⃣ Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

### 5️⃣ Deploy Smart Contracts

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

---

## 💰 Airdrop Workflow

### **Creator Flow**

1. Approve Factory to spend tokens.
2. Upload CSV → DApp generates Merkle root & uploads to IPFS.
3. Call `createAirdropAndFund()` via wallet → deploys and funds contract.
4. Airdrop visible in `/airdrops` list (from event).

### **Claimer Flow**

1. Open `/claim/[airdropAddress]`.
2. DApp loads `claims.json` from IPFS.
3. If connected wallet is eligible → shows “Claim” button.
4. User claims tokens → contract emits `Claimed()` event.
5. Creator can withdraw unclaimed tokens **after 7 days**.

---

## 🔒 Security Design

| Risk                    | Mitigation                         |
| ----------------------- | ---------------------------------- |
| Creator rug-pulls funds | Lock withdrawal for 7 days         |
| Double-claim            | Bitmap verification per index      |
| Empty contract          | Auto-funded on creation            |
| Wrong proof             | Merkle proof verification enforced |
| Expired claim           | Claim deadline enforced (7 days)   |

---

## 📦 Folder Structure

```
.
├── contracts/               # Solidity contracts
│   ├── MerkleAirdrop.sol
│   └── AirdropFactoryFacet.sol
├── pages/
│   ├── create.tsx
│   ├── claim/[address].tsx
│   ├── airdrops.tsx
│   └── api/ipfs-upload.ts
├── lib/
│   ├── merkle.ts            # Merkle tree generation helpers
│   ├── ipfs.ts              # Upload/fetch from IPFS
│   ├── contracts.ts         # ABI + contract instances
├── styles/                  # Tailwind styles
└── README.md
```

---

## 🧪 Testing

Run Hardhat tests:

```bash
npx hardhat test
```

Expected tests:

* ✅ Valid claim proof
* ✅ Double-claim rejection
* ✅ Withdraw blocked before 7 days
* ✅ AirdropCreated emits correct parameters

---

## 🧭 Roadmap

* [ ] Core smart contracts (Merkle Airdrop + Factory)
* [ ] Next.js DApp integration
* [ ] Auto funding + 7-day lock
* [ ] Claim analytics dashboard
* [ ] NFT airdrop support
* [ ] DAO-verified campaign registry

---

## 🧑‍💻 Author

**Decode Labs (Pason)**
📧 pason.dev@gmail.com
💡 “Building open, decentralized ecosystems for transparent growth.”

---

## 🪙 License

MIT © 2025 Pason.Dev
