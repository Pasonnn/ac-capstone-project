import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { AIRDROP_FACTORY_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { parseEther } from "viem";

export function useCreateAirdrop() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const createAirdrop = async (
    tokenAddress: string,
    merkleRoot: string,
    metadataURI: string,
    totalAmount: string
  ) => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.AIRDROP_FACTORY as `0x${string}`,
        abi: AIRDROP_FACTORY_ABI,
        functionName: "createAirdropAndFund",
        args: [
          tokenAddress as `0x${string}`,
          merkleRoot as `0x${string}`,
          metadataURI,
          parseEther(totalAmount),
        ],
      });
    } catch (err) {
      console.error("Error creating airdrop:", err);
      throw err;
    }
  };

  return {
    createAirdrop,
    hash,
    error,
    isPending,
  };
}

export function useAirdropFactoryInfo() {
  const { data: implementation } = useReadContract({
    address: CONTRACT_ADDRESSES.AIRDROP_FACTORY as `0x${string}`,
    abi: AIRDROP_FACTORY_ABI,
    functionName: "getImplementation",
  });

  return {
    implementation,
  };
}
