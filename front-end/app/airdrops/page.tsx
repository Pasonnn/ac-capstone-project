"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Gift, ExternalLink, Clock, Users, Coins } from "lucide-react";
import Link from "next/link";

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
}

export default function AirdropsPage() {
  const [airdrops, setAirdrops] = useState<AirdropEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch from your backend or indexer
    // For now, we'll show a placeholder
    setLoading(false);
  }, []);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatAmount = (amount: string) => {
    // Convert from wei to tokens (assuming 18 decimals)
    const tokens = parseFloat(amount) / 1e18;
    return tokens.toLocaleString();
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            All Airdrops
          </h1>
          <p className="text-gray-600">
            Discover and participate in token airdrops created by the community.
          </p>
        </div>

        {airdrops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Airdrops Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create an airdrop and start distributing tokens to
              your community.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {airdrops.map((airdrop, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Gift className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Airdrop #{index + 1}
                      </h3>
                      <p className="text-sm text-gray-500">
                        by {formatAddress(airdrop.creator)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Coins className="w-4 h-4" />
                    <span>{formatAmount(airdrop.totalAmount)} tokens</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Multiple recipients</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Created {formatTimestamp(airdrop.timestamp)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/claim/${airdrop.airdropAddress}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Claim Tokens
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Contract: {formatAddress(airdrop.airdropAddress)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
