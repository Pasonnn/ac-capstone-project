import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { useReadContract } from "wagmi";
import { formatEther, decodeEventLog, Address } from "viem";
import FACTORY_ABI from "@/artifacts/contracts/AirdropFactory.sol/AirdropFactory.json";

const AIRDROP_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_AIRDROP_FACTORY_ADDRESS as Address;
const IPFS_GATEWAY_URL =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "https://ipfs.de-id.xyz/ipfs";
const DEPLOYMENT_BLOCK = 9473567n; // Known deployment block from sepolia_deployment.json

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

export function useAirdropData() {
  const publicClient = usePublicClient();
  const [airdrops, setAirdrops] = useState<AirdropEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAirdropEvents = useCallback(async () => {
    if (!publicClient || !AIRDROP_FACTORY_ADDRESS) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching airdrop events from blockchain...");

      // Get current block number to limit the range
      const currentBlock = await publicClient.getBlockNumber();
      let fromBlock = Math.max(
        Number(DEPLOYMENT_BLOCK),
        Number(currentBlock) - 5000
      ); // Use deployment block or last 5,000 blocks

      console.log(`Fetching logs from block ${fromBlock} to ${currentBlock}`);

      let logs;
      try {
        // Try to fetch logs with the initial range
        logs = await publicClient.getLogs({
          address: AIRDROP_FACTORY_ADDRESS,
          event: {
            abi: FACTORY_ABI.abi,
            name: "AirdropCreated",
            type: "event",
            inputs: [
              { indexed: true, name: "creator", type: "address" },
              { indexed: true, name: "token", type: "address" },
              { indexed: true, name: "airdropAddress", type: "address" },
              { indexed: false, name: "merkleRoot", type: "bytes32" },
              { indexed: false, name: "metadataURI", type: "string" },
              { indexed: false, name: "timestamp", type: "uint256" },
              { indexed: false, name: "totalAmount", type: "uint256" },
            ],
          },
          fromBlock: BigInt(fromBlock),
          toBlock: currentBlock,
        });
      } catch (error) {
        console.warn("Initial fetch failed, trying with smaller range:", error);
        // If that fails, try with an even smaller range, but not before deployment
        fromBlock = Math.max(
          Number(DEPLOYMENT_BLOCK),
          Number(currentBlock) - 1000
        );
        console.log(
          `Retrying with smaller range: ${fromBlock} to ${currentBlock}`
        );

        logs = await publicClient.getLogs({
          address: AIRDROP_FACTORY_ADDRESS,
          event: {
            abi: FACTORY_ABI.abi,
            name: "AirdropCreated",
            type: "event",
            inputs: [
              { indexed: true, name: "creator", type: "address" },
              { indexed: true, name: "token", type: "address" },
              { indexed: true, name: "airdropAddress", type: "address" },
              { indexed: false, name: "merkleRoot", type: "bytes32" },
              { indexed: false, name: "metadataURI", type: "string" },
              { indexed: false, name: "timestamp", type: "uint256" },
              { indexed: false, name: "totalAmount", type: "uint256" },
            ],
          },
          fromBlock: BigInt(fromBlock),
          toBlock: currentBlock,
        });
      }

      console.log(`Found ${logs.length} airdrop events`);

      const fetchedAirdrops: AirdropEvent[] = [];

      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: FACTORY_ABI.abi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "AirdropCreated") {
            const args = decoded.args as unknown as Record<string, unknown>;
            const metadataURI = args.metadataURI as string;
            let airdropData: AirdropData | undefined;

            // Fetch IPFS data if available
            if (metadataURI.startsWith("ipfs://")) {
              const cid = metadataURI.replace("ipfs://", "");
              const ipfsHttpUrl = `${IPFS_GATEWAY_URL}/${cid}`;

              try {
                console.log(`Fetching IPFS data from: ${ipfsHttpUrl}`);
                const response = await fetch(ipfsHttpUrl);
                if (response.ok) {
                  airdropData = await response.json();
                } else {
                  console.warn(
                    `Failed to fetch IPFS data for ${metadataURI}: ${response.statusText}`
                  );
                }
              } catch (ipfsError) {
                console.error(
                  `Error fetching IPFS data for ${metadataURI}:`,
                  ipfsError
                );
              }
            }

            fetchedAirdrops.push({
              creator: args.creator as Address,
              token: args.token as Address,
              airdropAddress: args.airdropAddress as Address,
              merkleRoot: args.merkleRoot as string,
              metadataURI: metadataURI,
              timestamp: Number(args.timestamp),
              totalAmount: (args.totalAmount as bigint).toString(),
              transactionHash: log.transactionHash as Address,
              blockNumber: Number(log.blockNumber),
              airdropData: airdropData,
            });
          }
        } catch (decodeError) {
          console.error("Error decoding log:", decodeError);
        }
      }

      // Sort by block number (newest first)
      fetchedAirdrops.sort((a, b) => b.blockNumber - a.blockNumber);

      console.log(`Successfully fetched ${fetchedAirdrops.length} airdrops`);
      setAirdrops(fetchedAirdrops);
    } catch (err) {
      console.error("Error fetching airdrop events:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch airdrop events"
      );
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchAirdropEvents();
  }, [fetchAirdropEvents]);

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
      setTimeout(() => setUserClaim(null), 0);
      return;
    }

    // Find user's claim in the airdrop data
    const claim = airdropData.claims.find(
      (claim) => claim.account.toLowerCase() === userAddress.toLowerCase()
    );

    setTimeout(() => setUserClaim(claim || null), 0);
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
