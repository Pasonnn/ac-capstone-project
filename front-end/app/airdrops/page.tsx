"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Gift,
  ExternalLink,
  Clock,
  Users,
  Coins,
  AlertCircle,
  CheckCircle,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  useAirdropData,
  useTokenInfo,
  useUserClaim,
  formatAddress,
  formatTimestamp,
  formatAmount,
  isClaimDeadlinePassed,
  getDaysUntilDeadline,
} from "@/hooks/useAirdropData";
import { useClaimTokens, useIsClaimed } from "@/hooks/useMerkleAirdrop";
import { formatEther } from "viem";

interface ClaimData {
  index: number;
  account: string;
  amount: string;
  proof: string[];
}

interface AirdropCardProps {
  airdrop: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  index: number;
  onViewDetails: (airdrop: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function AirdropCard({ airdrop, index, onViewDetails }: AirdropCardProps) {
  const { address } = useAccount();
  const { symbol } = useTokenInfo(airdrop.token);
  const userClaim = useUserClaim(address, airdrop.airdropData);
  const isExpired = isClaimDeadlinePassed(
    airdrop.airdropData?.metadata.claimDeadline || 0
  );
  const daysLeft = getDaysUntilDeadline(
    airdrop.airdropData?.metadata.claimDeadline || 0
  );

  // Claim functionality
  const { claimTokens, isPending: isClaiming } = useClaimTokens(
    airdrop.airdropAddress
  );
  const isClaimed = useIsClaimed(
    airdrop.airdropAddress,
    userClaim?.index || null
  );

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

  const canClaim = userClaim && !isClaimed && !isExpired && address;

  const highlightCard = !!userClaim;

  return (
    <div
      className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow
        ${
          highlightCard
            ? "bg-gradient-to-tr from-green-50 to-white border-green-300 ring-2 ring-green-400/70"
            : "bg-white"
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              highlightCard ? "bg-green-100" : "bg-blue-100"
            }`}
          >
            {highlightCard ? (
              <Sparkles className="w-6 h-6 text-green-500 animate-pulse" />
            ) : (
              <Gift className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3
              className={`font-semibold ${
                highlightCard ? "text-green-800" : "text-gray-900"
              }`}
            >
              {airdrop.airdropData?.metadata.name || `Airdrop #${index + 1}`}
            </h3>
            <p
              className={`text-sm ${
                highlightCard ? "text-green-600" : "text-gray-500"
              }`}
            >
              by {formatAddress(airdrop.creator)}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            isExpired
              ? "bg-red-100 text-red-800"
              : highlightCard
              ? "bg-green-200 text-green-900 border border-green-300 shadow"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isExpired
            ? "Expired"
            : highlightCard
            ? "You're Eligible!"
            : "Active"}
        </span>
      </div>

      {airdrop.airdropData?.metadata.description && (
        <p
          className={`text-sm mb-4 line-clamp-2 ${
            highlightCard ? "text-green-800 font-medium" : "text-gray-600"
          }`}
        >
          {airdrop.airdropData.metadata.description}
        </p>
      )}

      <div className="space-y-3 mb-6">
        <div
          className={`flex items-center gap-2 text-sm ${
            highlightCard ? "text-green-800" : "text-gray-600"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>
            {formatAmount(airdrop.totalAmount)} {symbol || "tokens"}
          </span>
        </div>

        <div
          className={`flex items-center gap-2 text-sm ${
            highlightCard ? "text-green-800" : "text-gray-600"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{airdrop.airdropData?.claims.length || 0} recipients</span>
        </div>

        <div
          className={`flex items-center gap-2 text-sm ${
            highlightCard ? "text-green-800" : "text-gray-600"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {isExpired
              ? `Expired ${formatTimestamp(
                  airdrop.airdropData?.metadata.claimDeadline || 0
                )}`
              : `${daysLeft} days left`}
          </span>
        </div>

        {userClaim && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>
              You&apos;re eligible for {formatAmount(userClaim.amount)} tokens
            </span>
          </div>
        )}

        {isClaimed && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <CheckCircle className="w-4 h-4" />
            <span>Already claimed!</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {canClaim && (
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="flex-1"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              `Claim ${formatEther(BigInt(userClaim.amount))}`
            )}
          </Button>
        )}

        {isClaimed && (
          <Button disabled className="flex-1">
            ✓ Claimed
          </Button>
        )}

        {isExpired && userClaim && (
          <Button disabled className="flex-1">
            Expired
          </Button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Contract: {formatAddress(airdrop.airdropAddress)}
        </p>
      </div>
    </div>
  );
}

export default function AirdropsPage() {
  const { address } = useAccount();
  const { airdrops, loading, error } = useAirdropData();
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyEligible, setShowOnlyEligible] = useState(false);
  const [selectedAirdrop, setSelectedAirdrop] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Filter airdrops based on search term and eligibility
  const filteredAirdrops = airdrops.filter((airdrop) => {
    // Check if user is eligible for this airdrop
    const userClaim = airdrop.airdropData?.claims?.find(
      (claim: any) => claim.account.toLowerCase() === address?.toLowerCase()
    );
    const isEligible = !!userClaim;

    // Apply eligibility filter
    if (showOnlyEligible && !isEligible) return false;

    // Apply search filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      airdrop.airdropData?.metadata.name.toLowerCase().includes(searchLower) ||
      airdrop.airdropData?.metadata.description
        .toLowerCase()
        .includes(searchLower) ||
      airdrop.airdropAddress.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading airdrops...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Airdrops
            </h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            All Airdrops
          </h1>
          <p className="text-gray-600 mb-6">
            Discover and participate in token airdrops created by the community.
          </p>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search Bar - Full Width */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search airdrops by name, description, or contract address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyEligible}
                  onChange={(e) => setShowOnlyEligible(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Show only eligible
                </span>
              </label>

              {/* Results Counter */}
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredAirdrops.length} airdrop
                {filteredAirdrops.length !== 1 ? "s" : ""}
                {showOnlyEligible && ""}
              </div>
            </div>
          </div>
        </div>

        {filteredAirdrops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || showOnlyEligible
                ? "No Airdrops Found"
                : "No Airdrops Yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm && showOnlyEligible
                ? "No eligible airdrops match your search. Try adjusting your search terms or turning off the eligibility filter."
                : searchTerm
                ? "No airdrops match your search. Try adjusting your search terms."
                : showOnlyEligible
                ? "You're not eligible for any airdrops yet. Check back later or create your own airdrop!"
                : "Be the first to create an airdrop and start distributing tokens to your community."}
            </p>
            {!searchTerm && !showOnlyEligible && (
              <Link href="/create">
                <Button>Create Airdrop</Button>
              </Link>
            )}
            {(searchTerm || showOnlyEligible) && (
              <div className="flex gap-2 justify-center">
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
                {showOnlyEligible && (
                  <Button
                    variant="outline"
                    onClick={() => setShowOnlyEligible(false)}
                  >
                    Show All Airdrops
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAirdrops.map((airdrop, index) => (
              <AirdropCard
                key={index}
                airdrop={airdrop}
                index={index}
                onViewDetails={setSelectedAirdrop}
              />
            ))}
          </div>
        )}

        {/* Airdrop Details Modal */}
        {selectedAirdrop && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedAirdrop.airdropData?.metadata.name ||
                      "Airdrop Details"}
                  </h2>
                  <button
                    onClick={() => setSelectedAirdrop(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Airdrop Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="text-gray-600">
                          {selectedAirdrop.airdropData?.metadata.description}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span>
                        <p className="text-gray-600">
                          {formatAmount(selectedAirdrop.totalAmount)} tokens
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Recipients:</span>
                        <p className="text-gray-600">
                          {selectedAirdrop.airdropData?.claims.length || 0}{" "}
                          addresses
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Claim Deadline:</span>
                        <p className="text-gray-600">
                          {formatTimestamp(
                            selectedAirdrop.airdropData?.metadata
                              .claimDeadline || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Claims</h3>
                    <div className="max-h-64 overflow-y-auto">
                      {selectedAirdrop.airdropData?.claims.map(
                        (claim: ClaimData, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-2 border-b border-gray-100"
                          >
                            <div>
                              <p className="font-mono text-sm">
                                {formatAddress(claim.account)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Index: {claim.index}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatAmount(claim.amount)}
                              </p>
                              {address &&
                                claim.account.toLowerCase() ===
                                  address.toLowerCase() && (
                                  <span className="text-xs text-green-600">
                                    Your claim
                                  </span>
                                )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAirdrop(null)}
                  >
                    Close
                  </Button>
                  {!isClaimDeadlinePassed(
                    selectedAirdrop.airdropData?.metadata.claimDeadline || 0
                  ) && (
                    <Link href={`/claim/${selectedAirdrop.airdropAddress}`}>
                      <Button>Claim Tokens</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
