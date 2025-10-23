Perfect, Bông Bông 🌸 — now that you’ve decided:
✅ **Frontend: Next.js DApp only (no backend)**
✅ **Smart Contracts: Factory + MerkleAirdrop with funding + 7-day lock**

Let’s rewrite the **full professional-grade development plan**, with technical clarity and execution detail — the kind of plan a senior Web3 engineer would present to a CTO or capstone jury.

---

# 🚀 Project Plan — “Decode Airdrop Builder”

### (Next.js + Smart Contracts with Auto-Funding & 7-Day Lock)

---

## 🎯 1. Project Summary

You are building a **fully decentralized airdrop creation and claiming DApp**.
Creators can upload a CSV of wallet addresses and token amounts, and the DApp will:

1. **Generate a Merkle tree** and calculate the root on the frontend.
2. **Upload claim data (`claims.json`) to IPFS.**
3. **Deploy and fund** an on-chain **Merkle Airdrop contract** via a **Factory Facet** — all in one transaction.
4. Automatically **lock the creator’s withdrawal rights for 7 days** to ensure fairness.
5. Allow eligible users to **claim their tokens** using Merkle proofs directly from the deployed contract.

No centralized backend, no database — just **Next.js + Solidity + IPFS + Wallet**.

---

## 🧩 2. System Architecture

```
 ┌────────────────────────────────────────────────────┐
 │                     NEXT.JS DAPP                   │
 │                                                    │
 │  Upload CSV → Build Merkle Root → Upload to IPFS   │
 │           │                           │            │
 │           ▼                           ▼            │
 │   FactoryFacet.createAirdropAndFund(token, root, uri, amount)
 │           │
 │   ┌───────┴──────────────────────────────────────┐
 │   │      Smart Contracts (on-chain)              │
 │   │  • Factory Facet (creates + funds airdrop)   │
 │   │  • MerkleAirdrop (claim + lock + withdraw)   │
 │   └──────────────────────────────────────────────┘
 │           │
 │           ▼
 │       IPFS (Pinata/Web3.Storage) → claims.json
 │
 │   Users → Claim tokens with Merkle Proof
 └────────────────────────────────────────────────────┘
```

---

## ⚙️ 3. Smart Contract Layer

### A. **MerkleAirdrop.sol**

Handles claiming, locking, and withdrawal logic.

**Core Functions**

* `initialize(token, owner, merkleRoot, metadataURI, totalAmount)`
* `claim(index, account, amount, proof)` → verifies Merkle proof and transfers tokens.
* `withdrawRemaining()` → available **only after 7 days**.
* `claimDeadline = block.timestamp + 7 days` (claim window).
* `unlockTimestamp = block.timestamp + 7 days` (owner lock).

**Events**

```solidity
event Claimed(uint256 indexed index, address indexed account, uint256 amount);
event Withdrawn(address indexed to, uint256 amount);
```

---

### B. **AirdropFactoryFacet.sol**

Deploys and funds the Airdrop contract in a single call.

**Flow**

1. User approves the Factory to spend tokens.
2. User calls:

   ```solidity
   createAirdropAndFund(token, merkleRoot, metadataURI, totalAmount)
   ```
3. Factory:

   * Clones the `MerkleAirdrop` implementation.
   * Initializes it with parameters.
   * Transfers tokens into it (`transferFrom(msg.sender, airdropAddress, totalAmount)`).
   * Emits event:

     ```solidity
     event AirdropCreated(
         address indexed creator,
         address indexed token,
         address indexed airdropAddress,
         bytes32 merkleRoot,
         string metadataURI,
         uint256 timestamp,
         uint256 totalAmount
     );
     ```

✅ Ensures airdrop is fully funded and locked in one transaction.
✅ Provides transparency and discoverability via events.

---

## 🖥️ 4. Frontend Layer (Next.js DApp)

### Stack

* **Framework:** Next.js 14 (App Router)
* **Wallet Integration:** wagmi + viem
* **Styling:** TailwindCSS
* **Merkle Generation:** merkletreejs + ethers
* **File Upload:** react-dropzone + papaparse
* **IPFS Upload:** Web3.Storage or Pinata SDK (via `/api/ipfs-upload` route)

---

### Pages / Features

| Page               | Purpose                       | Core Features                                                                      |
| ------------------ | ----------------------------- | ---------------------------------------------------------------------------------- |
| `/create`          | Build and deploy new airdrop  | Upload CSV → build Merkle → upload to IPFS → approve token → call factory          |
| `/airdrops`        | List all created airdrops     | Read `AirdropCreated` events → display details (creator, token, CID, total amount) |
| `/claim/[address]` | Claim UI for airdrop contract | Load IPFS `claims.json`, check connected wallet, call `claim()` if eligible        |
| `/`                | Landing Page                  | Intro + buttons for Create / Claim                                                 |

---

### API Routes (Serverless)

| Route              | Purpose                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| `/api/ipfs-upload` | Securely upload `claims.json` to IPFS using project’s secret API key (server-side only) |

---

## 🪜 5. Development Roadmap

### **Phase 1 – Smart Contracts (Week 1–2)**

**Goal:** Implement and test the full on-chain logic.

**Tasks**

* [ ] Write `MerkleAirdrop.sol` with initialize, claim, lock, withdraw.
* [ ] Write `AirdropFactoryFacet.sol` with `createAirdropAndFund()`.
* [ ] Add Hardhat unit tests:

  * ✅ Proof verification
  * ✅ Claim window enforcement
  * ✅ Withdraw lock (revert before 7 days)
  * ✅ Event emission
* [ ] Deploy both to Sepolia testnet.
* [ ] Verify contracts on Etherscan.

✅ Deliverable: Working, testnet-deployed smart contracts.

---

### **Phase 2 – Next.js DApp Setup (Week 2–3)**

**Goal:** Build user interface and contract interactions.

**Tasks**

* [ ] Setup Next.js + wagmi + Tailwind.
* [ ] Create “Connect Wallet” and `useContract` hooks.
* [ ] Create `/create` page:

  * Upload CSV (`papaparse`)
  * Build Merkle tree (`merkletreejs`)
  * Generate `claims.json`
  * Upload to IPFS via API route
  * Approve token → create airdrop (wagmi transaction)
* [ ] Display transaction hash + new airdrop address.

✅ Deliverable: “Create Airdrop” flow fully functional.

---

### **Phase 3 – Claim UI (Week 4)**

**Goal:** Let users claim their tokens.

**Tasks**

* [ ] `/claim/[address]` page:

  * Load metadata URI from event or URL
  * Fetch `claims.json` from IPFS
  * Match connected wallet → extract index, amount, proof
  * Call `claim()` → show success animation
* [ ] Display time left (based on claim deadline).
* [ ] Handle errors (already claimed, expired, etc.).

✅ Deliverable: full claim experience.

---

### **Phase 4 – Airdrop Listing (Week 5)**

**Goal:** Allow anyone to discover all airdrops.

**Tasks**

* [ ] Listen for `AirdropCreated` events from factory.
* [ ] Query logs with viem or ethers.js.
* [ ] Display cards with:

  * Token address
  * Creator
  * Total Amount
  * IPFS link
  * Countdown (time left)

✅ Deliverable: dashboard for all campaigns.

---

### **Phase 5 – Polish & Deployment (Week 6)**

* Optimize gas (bitmap, minimal proxy)
* UI/UX polish (progress steps, timer)
* Deploy DApp to **Vercel**
* Final test on **Sepolia**
* Write README + technical report.

✅ Deliverable: Production-ready DApp + final documentation.

---

## 🛡️ 6. Security Logic

| Concern                     | Mitigation                                      |
| --------------------------- | ----------------------------------------------- |
| **Creator withdraws early** | Lock withdraw for 7 days (`unlockTimestamp`)    |
| **User claims twice**       | Claimed bitmap check                            |
| **Wrong proof**             | Merkle verification with `MerkleProof.verify()` |
| **Empty contract**          | Tokens transferred from factory upon creation   |
| **Expired claim**           | Enforce `claimDeadline`                         |
| **Unauthorized withdraw**   | Only owner + after lock                         |

---

## 🧮 7. Tech Stack Summary

| Category           | Tool                                             |
| ------------------ | ------------------------------------------------ |
| Smart Contract Dev | Solidity, Hardhat, OpenZeppelin, EIP-1167 Clones |
| Frontend           | Next.js 14, TailwindCSS, wagmi, viem             |
| Storage            | IPFS (Pinata / Web3.Storage)                     |
| Merkle Generation  | merkletreejs + ethers.js                         |
| Network            | Sepolia / Monad testnet                          |
| Hosting            | Vercel                                           |

---

## 📅 8. Timeline Overview

| Week | Focus                  | Deliverable                 |
| :--: | :--------------------- | :-------------------------- |
|  1–2 | Contract dev + testing | Factory + Airdrop ready     |
|   3  | Next.js DApp setup     | Wallet connect + CSV upload |
|   4  | Claim UI               | Claim flow complete         |
|   5  | Listing + polish       | Campaign dashboard          |
|   6  | Deploy + report        | Vercel + Sepolia live demo  |

---

## 💎 9. Expected Outcomes

✅ **Trustless Airdrop Creation:** users fund contracts in one transaction.
✅ **User Protection:** 7-day lock ensures no early withdrawal.
✅ **Decentralized Storage:** proof data permanently on IPFS.
✅ **Low Gas:** EIP-1167 clones + Merkle proof verification under 100k gas.
✅ **Frontend Only:** deployable DApp with no backend servers.

---

Would you like me to generate a **system design diagram (architecture + sequence flow)** next — showing how each step connects (CSV upload → IPFS → Factory → Claim)? It’ll make this plan presentation-ready.
