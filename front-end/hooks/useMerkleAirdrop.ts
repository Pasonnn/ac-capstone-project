import { useWriteContract, useReadContract, useAccount } from "wagmi";
import { MERKLE_AIRDROP_ABI } from "@/lib/contracts";
import { parseEther } from "viem";

export function useMerkleAirdrop(contractAddress: string) {
  const { address } = useAccount();

  // Read contract data
  const { data: token } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "token",
  });

  const { data: merkleRoot } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "merkleRoot",
  });

  const { data: metadataURI } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "metadataURI",
  });

  const { data: totalAmount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "totalAmount",
  });

  const { data: claimDeadline } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "claimDeadline",
  });

  const { data: unlockTimestamp } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "unlockTimestamp",
  });

  const { data: balance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "getBalance",
  });

  const { data: daysUntilExpiry } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "getDaysUntilExpiry",
  });

  const { data: daysUntilWithdrawal } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "getDaysUntilWithdrawal",
  });

  return {
    token,
    merkleRoot,
    metadataURI,
    totalAmount,
    claimDeadline,
    unlockTimestamp,
    balance,
    daysUntilExpiry,
    daysUntilWithdrawal,
  };
}

export function useClaimTokens(contractAddress: string) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const claimTokens = async (
    index: number,
    account: string,
    amount: string,
    merkleProof: string[]
  ) => {
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: MERKLE_AIRDROP_ABI,
        functionName: "claim",
        args: [
          BigInt(index),
          account as `0x${string}`,
          parseEther(amount),
          merkleProof as readonly `0x${string}`[],
        ],
      });
    } catch (err) {
      console.error("Error claiming tokens:", err);
      throw err;
    }
  };

  return {
    claimTokens,
    hash,
    error,
    isPending,
  };
}

export function useWithdrawRemaining(contractAddress: string) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const withdrawRemaining = async () => {
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: MERKLE_AIRDROP_ABI,
        functionName: "withdrawRemaining",
      });
    } catch (err) {
      console.error("Error withdrawing remaining tokens:", err);
      throw err;
    }
  };

  return {
    withdrawRemaining,
    hash,
    error,
    isPending,
  };
}

export function useIsClaimed(contractAddress: string, index: number) {
  const { data: isClaimed } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "isClaimed",
    args: [BigInt(index)],
  });

  return isClaimed;
}
