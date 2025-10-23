import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { parseEther, decodeEventLog, type Address } from "viem";
import { useState, useEffect } from "react";

import FACTORY_ABI from "@/artifacts/contracts/AirdropFactory.sol/AirdropFactory.json";
import ERC20_ABI from "@/artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

const AIRDROP_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_AIRDROP_FACTORY_ADDRESS as Address;

export function useCreateAirdrop() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const [airdropAddress, setAirdropAddress] = useState<string | null>(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] =
    useState(false);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [currentStep, setCurrentStep] = useState<"approve" | "create" | null>(
    null
  );

  // Wait for transaction receipt
  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Gas estimation hook - this needs to be called at the component level
  // We'll use a reasonable gas estimate for now
  const getGasEstimate = (): bigint => {
    // Contract creation + token transfer + initialization typically needs 12-15M gas
    // We'll use 15M gas as a safe estimate
    return 15000000n;
  };

  const createAirdrop = async (
    tokenAddress: Address,
    merkleRoot: string,
    metadataURI: string,
    totalAmount: string // Keep as string for easier handling
  ) => {
    try {
      setIsWaitingForConfirmation(true);
      setAirdropAddress(null);
      setCurrentStep("approve");

      // Get gas estimate
      const gasLimit = getGasEstimate();
      setGasEstimate(gasLimit);

      console.log("Creating airdrop with gas limit:", gasLimit.toString());

      // Convert totalAmount to BigInt
      const totalAmountBigInt = parseEther(totalAmount);

      // Step 1: Approve the factory to spend tokens (like in deployAndTest.ts line 124)
      console.log("Step 1: Approving factory to spend tokens...");
      await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI.abi,
        functionName: "approve",
        args: [AIRDROP_FACTORY_ADDRESS, totalAmountBigInt],
      });

      // Note: The user will need to approve this transaction first
      // After approval is confirmed, they can proceed to create the airdrop
      // This is a two-step process that requires user interaction
    } catch (err) {
      console.error("Error creating airdrop:", err);
      setIsWaitingForConfirmation(false);
      setCurrentStep(null);
      throw err;
    }
  };

  // Separate function to create the airdrop after approval
  const createAirdropAfterApproval = async (
    tokenAddress: Address,
    merkleRoot: string,
    metadataURI: string,
    totalAmount: string
  ) => {
    try {
      setCurrentStep("create");
      const gasLimit = getGasEstimate();
      const totalAmountBigInt = parseEther(totalAmount);

      console.log("Step 2: Creating airdrop...");
      await writeContract({
        address: AIRDROP_FACTORY_ADDRESS,
        abi: FACTORY_ABI.abi,
        functionName: "createAirdropAndFund",
        args: [tokenAddress, merkleRoot, metadataURI, totalAmountBigInt],
        gas: gasLimit,
      });
    } catch (err) {
      console.error("Error creating airdrop:", err);
      setCurrentStep(null);
      throw err;
    }
  };

  // Extract airdrop address from transaction receipt
  useEffect(() => {
    if (receipt) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setIsWaitingForConfirmation(false);
      }, 0);

      // Find the AirdropCreated event in the logs
      const airdropCreatedEvent = receipt.logs.find((log) => {
        try {
          // Try to decode the log using the factory ABI
          const decoded = decodeEventLog({
            abi: FACTORY_ABI.abi,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "AirdropCreated";
        } catch {
          return false;
        }
      });

      if (airdropCreatedEvent) {
        try {
          // Decode the event to get the airdrop address
          const decoded = decodeEventLog({
            abi: FACTORY_ABI.abi,
            data: airdropCreatedEvent.data,
            topics: airdropCreatedEvent.topics,
          });

          if (decoded.eventName === "AirdropCreated" && decoded.args) {
            // The AirdropCreated event has these parameters:
            // creator (indexed), token (indexed), airdropAddress (indexed), merkleRoot, metadataURI, timestamp, totalAmount
            const airdropAddr = (
              decoded.args as unknown as Record<string, unknown>
            ).airdropAddress as Address;
            setTimeout(() => {
              setAirdropAddress(airdropAddr);
              console.log("Airdrop deployed at:", airdropAddr);
            }, 0);
          }
        } catch (error) {
          console.error("Error decoding airdrop event:", error);
        }
      }
    }
  }, [receipt]);

  return {
    createAirdrop,
    createAirdropAfterApproval,
    hash,
    error,
    isPending: isPending || isWaitingForConfirmation,
    isConfirming,
    receipt,
    airdropAddress,
    isWaitingForConfirmation,
    gasEstimate,
    currentStep,
  };
}

// Hook for gas estimation - can be used at component level
export function useAirdropGasEstimate(
  _tokenAddress: Address | undefined,
  _merkleRoot: string | undefined,
  _metadataURI: string | undefined,
  _totalAmount: string | undefined
) {
  // For now, return a reasonable gas estimate
  // In a real implementation, you would use useEstimateGas hook
  const gasEstimate = 15000000n; // 15M gas should be sufficient
  const isLoading = false;
  const error = null;

  return {
    gasEstimate,
    error,
    isLoading,
  };
}

export function useAirdropFactoryInfo() {
  const { data: implementation } = useReadContract({
    address: AIRDROP_FACTORY_ADDRESS,
    abi: FACTORY_ABI.abi,
    functionName: "getImplementation",
  });

  return {
    implementation,
  };
}

// Hook to get token information by address (like getting token contract in deployAndTest.ts)
export function useTokenInfo(tokenAddress: Address | undefined) {
  const { address: userAddress } = useAccount();

  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI.abi,
    functionName: "name",
  });

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI.abi,
    functionName: "symbol",
  });

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI.abi,
    functionName: "decimals",
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI.abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
  });

  return {
    name,
    symbol,
    decimals,
    balance,
  };
}
