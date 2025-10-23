import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { MERKLE_AIRDROP_ABI } from "@/lib/contracts";
import { useState, useEffect } from "react";

export function useMerkleAirdrop(airdropAddress: string | null) {
  const { data: token } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "token",
  });

  const { data: merkleRoot } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "merkleRoot",
  });

  const { data: totalAmount } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "totalAmount",
  });

  const { data: balance } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "getBalance",
  });

  const { data: claimDeadline } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "claimDeadline",
  });

  const { data: unlockTimestamp } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "unlockTimestamp",
  });

  const { data: metadataURI } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "metadataURI",
  });

  const { data: daysUntilExpiry } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "getDaysUntilExpiry",
  });

  const { data: daysUntilWithdrawal } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "getDaysUntilWithdrawal",
  });

  return {
    token,
    merkleRoot,
    metadataURI,
    totalAmount,
    balance,
    claimDeadline,
    unlockTimestamp,
    daysUntilExpiry,
    daysUntilWithdrawal,
  };
}

export function useClaimTokens(airdropAddress: string | null) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] =
    useState(false);

  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash,
    });

  const claimTokens = async (
    index: number,
    account: string,
    amount: string,
    proof: string[]
  ) => {
    try {
      setIsWaitingForConfirmation(true);

      await writeContract({
        address: airdropAddress as `0x${string}`,
        abi: MERKLE_AIRDROP_ABI,
        functionName: "claim",
        args: [
          BigInt(index),
          account as `0x${string}`,
          BigInt(amount),
          proof as `0x${string}`[],
        ],
      });
    } catch (err) {
      console.error("Error claiming tokens:", err);
      setIsWaitingForConfirmation(false);
      throw err;
    }
  };

  useEffect(() => {
    if (receipt) {
      setTimeout(() => {
        setIsWaitingForConfirmation(false);
      }, 0);
    }
  }, [receipt]);

  return {
    claimTokens,
    hash,
    error,
    isPending: isPending || isWaitingForConfirmation,
    isConfirming,
    receipt,
  };
}

export function useIsClaimed(
  airdropAddress: string | null,
  index: number | null
) {
  const { data: isClaimed } = useReadContract({
    address: airdropAddress as `0x${string}`,
    abi: MERKLE_AIRDROP_ABI,
    functionName: "isClaimed",
    args: index !== null ? [BigInt(index)] : undefined,
  });

  return isClaimed;
}
