import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { Gift, Plus, List, Shield, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            DeAirdrop
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create, fund, and manage your airdrop easily with Airdrop Builder by
            Decode
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Airdrop
              </Button>
            </Link>
            <Link href="/airdrops">
              <Button
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <List className="w-5 h-5" />
                View Airdrops
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Trustless</h3>
            </div>
            <p className="text-gray-600">
              Tokens are locked for 7 days, ensuring creators can't withdraw
              early. Complete transparency through smart contracts.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">One-Click Deploy</h3>
            </div>
            <p className="text-gray-600">
              Upload CSV, generate Merkle tree, and deploy airdrop in a single
              transaction. No complex setup required.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Decentralized</h3>
            </div>
            <p className="text-gray-600">
              No servers, no databases. Everything stored on IPFS and
              blockchain. Truly decentralized airdrop platform.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Upload CSV</h3>
              <p className="text-sm text-gray-600">
                Upload your recipient list with addresses and amounts
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Generate Merkle Tree</h3>
              <p className="text-sm text-gray-600">
                We create a Merkle tree and upload proof data to IPFS
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Deploy & Fund</h3>
              <p className="text-sm text-gray-600">
                Deploy airdrop contract and fund it in one transaction
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Users Claim</h3>
              <p className="text-sm text-gray-600">
                Recipients claim their tokens using Merkle proofs
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
