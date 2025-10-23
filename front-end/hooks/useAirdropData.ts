import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { formatEther } from "viem";

interface AirdropMetadata {
  name: string;
  description: string;
  token: string;
  merkleRoot: string;
  totalAmount: string;
  claimDeadline: number;
  unlockTimestamp: number;
  createdAt: number;
  version: string;
}

interface ClaimData {
  index: number;
  account: string;
  amount: string;
  proof: string[];
}

interface AirdropData {
  metadata: AirdropMetadata;
  claims: ClaimData[];
}

interface AirdropEvent {
  creator: string;
  token: string;
  airdropAddress: string;
  merkleRoot: string;
  metadataURI: string;
  timestamp: number;
  totalAmount: string;
  transactionHash: string;
  blockNumber: number;
  // Fetched data
  airdropData?: AirdropData;
  tokenName?: string;
  tokenSymbol?: string;
}

// Mock airdrop events - in a real app, you'd fetch these from an indexer or subgraph
const MOCK_AIRDROP_EVENTS: AirdropEvent[] = [
  {
    creator: "0x09e23052d4a07D38C85C35Af34c9e1d0555243EE",
    token: "0x6f98Ef7D194718164eFcf625b27cd3b02C3881db",
    airdropAddress: "0x75677a6e847DCAA66B85814058F9cF437b784b4A",
    merkleRoot:
      "0xf5169277c2daa30761c2b257066ee1085ed80354624268b1d59f661fe7af49be",
    metadataURI: "ipfs://QmWJYh5QzSjm3JEA6ghzKXt8cPz8rK4WNM9vA7qn9rehp6",
    timestamp: 1761233628,
    totalAmount: "600000000000000000000",
    transactionHash:
      "0xb5f50c507194ecc75b30f54c3142463f522884963d3f796cab46d3dab412154b",
    blockNumber: 9473860,
  },
];

export function useAirdropData() {
  const [airdrops, setAirdrops] = useState<AirdropEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAirdrops = async () => {
      try {
        setLoading(true);
        setError(null);

        // Start with mock data
        let airdropEvents = [...MOCK_AIRDROP_EVENTS];

        // Fetch IPFS data for each airdrop
        const airdropsWithData = await Promise.all(
          airdropEvents.map(async (airdrop) => {
            try {
              // Extract IPFS hash from URI
              const ipfsHash = airdrop.metadataURI.replace("ipfs://", "");
              const ipfsUrl = `https://ipfs.de-id.xyz/ipfs/${ipfsHash}`;

              console.log(`Fetching airdrop data from: ${ipfsUrl}`);

              const response = await fetch(ipfsUrl);
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch IPFS data: ${response.status}`
                );
              }

              const airdropData: AirdropData = await response.json();

              return {
                ...airdrop,
                airdropData,
              };
            } catch (error) {
              console.error(
                `Error fetching airdrop data for ${airdrop.airdropAddress}:`,
                error
              );
              return airdrop;
            }
          })
        );

        setAirdrops(airdropsWithData);
      } catch (error) {
        console.error("Error fetching airdrops:", error);
        setError("Failed to fetch airdrops");
      } finally {
        setLoading(false);
      }
    };

    fetchAirdrops();
  }, []);

  return {
    airdrops,
    loading,
    error,
  };
}

export function useTokenInfo(tokenAddress: string) {
  const { data: name } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "name",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "symbol",
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "symbol",
  });

  return {
    name: name as string,
    symbol: symbol as string,
  };
}

export function useUserClaim(
  userAddress: string | undefined,
  airdropData?: AirdropData
) {
  const [userClaim, setUserClaim] = useState<ClaimData | null>(null);

  useEffect(() => {
    if (!userAddress || !airdropData) {
      setUserClaim(null);
      return;
    }

    // Find user's claim in the airdrop data
    const claim = airdropData.claims.find(
      (claim) => claim.account.toLowerCase() === userAddress.toLowerCase()
    );

    setUserClaim(claim || null);
  }, [userAddress, airdropData]);

  return userClaim;
}

export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatAmount(amount: string) {
  const tokens = parseFloat(formatEther(BigInt(amount)));
  return tokens.toLocaleString();
}

export function isClaimDeadlinePassed(deadline: number) {
  return Date.now() / 1000 > deadline;
}

export function getDaysUntilDeadline(deadline: number) {
  const now = Date.now() / 1000;
  const diff = deadline - now;
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60)));
}
