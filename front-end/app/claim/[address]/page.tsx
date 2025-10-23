"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  useMerkleAirdrop,
  useClaimTokens,
  useIsClaimed,
} from "@/hooks/useMerkleAirdrop";
import { findClaimForAddress, ClaimsData } from "@/lib/merkle";
import { formatEther, parseEther } from "viem";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Coins,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function ClaimPage() {
  const params = useParams();
  const { address, isConnected } = useAccount();
  const contractAddress = params.address as string;

  const [claimsData, setClaimsData] = useState<ClaimsData | null>(null);
  const [userClaim, setUserClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contract data
  const {
    token,
    merkleRoot,
    metadataURI,
    totalAmount,
    claimDeadline,
    unlockTimestamp,
    balance,
    daysUntilExpiry,
    daysUntilWithdrawal,
  } = useMerkleAirdrop(contractAddress);

  const {
    claimTokens,
    hash,
    error: claimError,
    isPending,
  } = useClaimTokens(contractAddress);
  const isClaimed = useIsClaimed(contractAddress, userClaim?.index || 0);

  useEffect(() => {
    if (!contractAddress) return;

    const fetchClaimsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real app, you would fetch from the metadataURI
        // For now, we'll simulate fetching from IPFS
        const response = await fetch("/api/ipfs-upload"); // This would be the actual IPFS URL
        if (!response.ok) {
          throw new Error("Failed to fetch claims data");
        }

        // Simulate claims data (in real app, this would come from IPFS)
        const mockClaimsData: ClaimsData = {
          metadata: {
            name: "Test Airdrop",
            description: "A test airdrop campaign",
            token: token || "",
            merkleRoot: merkleRoot || "",
            totalAmount: totalAmount?.toString() || "0",
            claimDeadline: claimDeadline ? Number(claimDeadline) : 0,
            unlockTimestamp: unlockTimestamp ? Number(unlockTimestamp) : 0,
            createdAt: Math.floor(Date.now() / 1000),
            version: "1.0.0",
          },
          claims: [
            {
              index: 0,
              account: address || "0x0000000000000000000000000000000000000000",
              amount: "1000000000000000000", // 1 token in wei
              proof: [
                "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
              ],
            },
          ],
        };

        setClaimsData(mockClaimsData);

        // Find user's claim
        if (address) {
          const claim = findClaimForAddress(mockClaimsData.claims, address);
          setUserClaim(claim);
        }
      } catch (err) {
        console.error("Error fetching claims data:", err);
        setError("Failed to load airdrop data");
      } finally {
        setLoading(false);
      }
    };

    fetchClaimsData();
  }, [
    contractAddress,
    address,
    token,
    merkleRoot,
    totalAmount,
    claimDeadline,
    unlockTimestamp,
  ]);

  const handleClaim = async () => {
    if (!userClaim || !address) return;

    try {
      await claimTokens(
        userClaim.index,
        address,
        userClaim.amount,
        userClaim.proof
      );
    } catch (err) {
      console.error("Error claiming tokens:", err);
    }
  };

  const isExpired = claimDeadline
    ? Date.now() / 1000 > Number(claimDeadline)
    : false;
  const canClaim = userClaim && !isClaimed && !isExpired && isConnected;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading airdrop data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error Loading Airdrop
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Wallet Not Connected
            </h2>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to check if you're eligible for this
              airdrop.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!userClaim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Not Eligible
            </h2>
            <p className="text-gray-600 mb-6">
              Your wallet address is not included in this airdrop.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {claimsData?.metadata.name || "Airdrop Campaign"}
            </h1>
            <p className="text-gray-600">
              {claimsData?.metadata.description ||
                "Claim your tokens from this airdrop campaign."}
            </p>
          </div>

          {/* Airdrop Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">
              Airdrop Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Your Allocation:</span>
                <span className="text-sm font-medium">
                  {formatEther(userClaim.amount)} tokens
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Airdrop:</span>
                <span className="text-sm font-medium">
                  {totalAmount ? formatEther(totalAmount) : "0"} tokens
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Remaining Balance:
                </span>
                <span className="text-sm font-medium">
                  {balance ? formatEther(balance) : "0"} tokens
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Claim Deadline:</span>
                <span className="text-sm font-medium">
                  {claimDeadline
                    ? new Date(
                        Number(claimDeadline) * 1000
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>

              {daysUntilExpiry !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days Remaining:</span>
                  <span className="text-sm font-medium">
                    {daysUntilExpiry} days
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Claim Status */}
          <div className="mb-8">
            {isClaimed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Already Claimed
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  You have successfully claimed your tokens from this airdrop.
                </p>
              </div>
            ) : isExpired ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    Claim Period Expired
                  </span>
                </div>
                <p className="text-red-700 text-sm mt-2">
                  The claim period for this airdrop has ended.
                </p>
              </div>
            ) : canClaim ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Ready to Claim
                  </span>
                </div>
                <p className="text-blue-700 text-sm mt-2">
                  You can claim {formatEther(userClaim.amount)} tokens from this
                  airdrop.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800 font-medium">
                    Cannot Claim
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-2">
                  You are not eligible to claim from this airdrop.
                </p>
              </div>
            )}
          </div>

          {/* Claim Button */}
          {canClaim && (
            <Button
              onClick={handleClaim}
              disabled={isPending}
              className="w-full mb-4"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming Tokens...
                </>
              ) : (
                `Claim ${formatEther(userClaim.amount)} Tokens`
              )}
            </Button>
          )}

          {/* Transaction Hash */}
          {hash && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Transaction Hash:
              </p>
              <p className="text-sm font-mono text-gray-600 break-all">
                {hash}
              </p>
            </div>
          )}

          {/* Contract Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">
              Contract Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Address:</span>
                <span className="font-mono">{contractAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Address:</span>
                <span className="font-mono">{token || "N/A"}</span>
              </div>
              {metadataURI && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Metadata:</span>
                  <a
                    href={metadataURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View on IPFS
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {claimError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{claimError.message}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
