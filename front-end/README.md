# Airdrop Builder DApp

A decentralized airdrop creation and claiming platform built with Next.js, wagmi, and smart contracts.

## Features

- 🚀 **One-Click Airdrop Creation**: Upload CSV, generate Merkle tree, deploy and fund in one transaction
- 🔒 **Trustless Design**: 7-day lock ensures creators can't withdraw early
- 🌐 **Decentralized Storage**: All data stored on IPFS and blockchain
- 💰 **Easy Claiming**: Users can claim tokens with simple Merkle proofs
- 📱 **Responsive UI**: Modern, mobile-friendly interface

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Web3**: wagmi, viem, ethers.js
- **Styling**: TailwindCSS
- **Storage**: IPFS (Web3.Storage)
- **Merkle Trees**: merkletreejs
- **File Processing**: papaparse, react-dropzone

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Web3.Storage account (for IPFS uploads)
- WalletConnect project (optional)

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd front-end
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Update the environment variables in `.env.local`:
   - `WEB3_STORAGE_TOKEN`: Your Web3.Storage API token
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID (optional)
   - Contract addresses after deployment

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WEB3_STORAGE_TOKEN` | Web3.Storage API token for IPFS uploads | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | No |
| `NEXT_PUBLIC_AIRDROP_FACTORY_ADDRESS` | Deployed AirdropFactory contract address | Yes |
| `NEXT_PUBLIC_MOCK_ERC20_ADDRESS` | Deployed MockERC20 contract address | Yes |

## Project Structure

```
front-end/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── ipfs-upload/   # IPFS upload endpoint
│   ├── create/            # Create airdrop page
│   ├── airdrops/          # List all airdrops
│   ├── claim/[address]/   # Claim tokens page
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── navigation.tsx    # Navigation component
│   └── wallet-connect.tsx # Wallet connection
├── hooks/                # Custom React hooks
│   ├── useAirdropFactory.ts
│   └── useMerkleAirdrop.ts
├── lib/                  # Utility libraries
│   ├── contracts.ts     # Contract ABIs and addresses
│   ├── merkle.ts        # Merkle tree utilities
│   ├── utils.ts         # General utilities
│   └── wagmi.ts         # Wagmi configuration
└── providers/           # React providers
    └── wagmi-provider.tsx
```

## Usage

### Creating an Airdrop

1. **Connect Wallet**: Connect your wallet to the DApp
2. **Upload CSV**: Upload a CSV file with recipient addresses and amounts
3. **Configure**: Set airdrop name, description, and token address
4. **Generate Merkle Tree**: The system generates a Merkle tree and uploads data to IPFS
5. **Deploy & Fund**: Deploy the airdrop contract and fund it in one transaction

### Claiming Tokens

1. **Find Airdrop**: Browse available airdrops or use a direct link
2. **Connect Wallet**: Connect the wallet that's eligible for the airdrop
3. **Claim**: Click the claim button to receive your tokens

## Smart Contract Integration

The frontend integrates with two main smart contracts:

### AirdropFactory
- Deploys new airdrop contracts
- Handles funding in a single transaction
- Emits events for airdrop discovery

### MerkleAirdrop
- Manages token claims with Merkle proofs
- Enforces 7-day lock period
- Tracks claimed status with bitmap

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Structure

- **Pages**: Next.js app router pages in `app/` directory
- **Components**: Reusable React components in `components/`
- **Hooks**: Custom hooks for contract interactions in `hooks/`
- **Utils**: Utility functions and configurations in `lib/`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `out` directory to your hosting provider
3. Set environment variables on your hosting platform

## Security Considerations

- Always verify contract addresses before deployment
- Use environment variables for sensitive data
- Validate user inputs on both client and server
- Implement proper error handling for failed transactions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the smart contract code in the `smart-contract/` directory
