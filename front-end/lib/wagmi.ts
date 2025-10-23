import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, hardhat } from "wagmi/chains";

// Contract addresses (update these after deployment)
export const AIRDROP_FACTORY_ADDRESS =
  "0x83c3860EcD9981f582434Ed67036db90D5375032"; // Sepolia deployment
export const MOCK_ERC20_ADDRESS = "0x0000000000000000000000000000000000000000"; // Update after deployment

// Web3.Storage API key (set in environment variables)
export const WEB3_STORAGE_TOKEN =
  process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || "";

export const config = getDefaultConfig({
  appName: "Airdrop Builder DApp",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "placeholder_project_id",
  chains: [sepolia, hardhat],
  ssr: true,
});
