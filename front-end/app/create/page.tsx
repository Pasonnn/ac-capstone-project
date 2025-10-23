"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { useCreateAirdrop } from "@/hooks/useAirdropFactory";
import { createClaimsData, AirdropData } from "@/lib/merkle";
import { parseEther, formatEther } from "viem";
import Papa from "papaparse";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function CreateAirdrop() {
  const { address, isConnected } = useAccount();
  const { createAirdrop, hash, error, isPending } = useCreateAirdrop();

  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState<AirdropData[]>([]);
  const [airdropName, setAirdropName] = useState("");
  const [airdropDescription, setAirdropDescription] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        const airdropData: AirdropData[] = data
          .filter((row) => row.address && row.amount)
          .map((row, index) => ({
            index,
            account: row.address,
            amount: parseEther(row.amount.toString()).toString(),
          }));

        setCsvData(airdropData);
        setStep(2);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        alert("Error parsing CSV file. Please check the format.");
      },
    });
  };

  const handleGenerateMerkleTree = async () => {
    if (!tokenAddress) {
      alert("Please enter a token address");
      return;
    }

    try {
      setIsUploading(true);

      // Create claims data
      const claimsData = createClaimsData(
        csvData,
        tokenAddress,
        airdropName || "Airdrop Campaign",
        airdropDescription || "A decentralized airdrop campaign"
      );

      // Calculate total amount
      const total = csvData.reduce(
        (sum, data) => sum + BigInt(data.amount),
        BigInt(0)
      );
      setTotalAmount(formatEther(total));

      // Upload to IPFS
      const response = await fetch("/api/ipfs-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimsData }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload to IPFS");
      }

      const { url, cid } = await response.json();
      setIpfsUrl(url);
      setMerkleRoot(claimsData.metadata.merkleRoot);
      setStep(3);
    } catch (error) {
      console.error("Error generating Merkle tree:", error);
      alert("Error generating Merkle tree. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeployAirdrop = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      await createAirdrop(tokenAddress, merkleRoot, ipfsUrl, totalAmount);
      setStep(4);
    } catch (error) {
      console.error("Error deploying airdrop:", error);
      alert("Error deploying airdrop. Please try again.");
    }
  };

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
              Please connect your wallet to create an airdrop.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Create Airdrop
          </h1>

          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= stepNumber
                      ? "bg-blue-300 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNumber ? "bg-blue-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Upload CSV */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 1: Upload Recipient List
              </h2>
              <p className="text-gray-600">
                Upload a CSV file with recipient addresses and amounts. The CSV
                should have columns: address, amount
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-200 text-white rounded-lg hover:bg-blue-300"
                >
                  <FileText className="w-4 h-4" />
                  Choose CSV File
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  CSV should have columns: address, amount
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Configure Airdrop */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Step 2: Configure Airdrop
              </h2>
              <p className="text-gray-600">
                Found {csvData.length} recipients. Configure your airdrop
                details.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Airdrop Name
                  </label>
                  <input
                    type="text"
                    value={airdropName}
                    onChange={(e) => setAirdropName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Airdrop Campaign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Address
                  </label>
                  <input
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0x..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={airdropDescription}
                  onChange={(e) => setAirdropDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your airdrop campaign..."
                />
              </div>

              <Button
                onClick={handleGenerateMerkleTree}
                disabled={!tokenAddress || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Merkle Tree...
                  </>
                ) : (
                  "Generate Merkle Tree & Upload to IPFS"
                )}
              </Button>
            </div>
          )}

          {/* Step 3: Deploy Airdrop */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Step 3: Deploy Airdrop</h2>
              <p className="text-gray-600">
                Your Merkle tree has been generated and uploaded to IPFS. Ready
                to deploy!
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Recipients:</span>
                  <span className="text-sm">{csvData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-sm">{totalAmount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Merkle Root:</span>
                  <span className="text-sm font-mono text-xs">
                    {merkleRoot}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">IPFS URL:</span>
                  <a
                    href={ipfsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View on IPFS
                  </a>
                </div>
              </div>

              <Button
                onClick={handleDeployAirdrop}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying Airdrop...
                  </>
                ) : (
                  "Deploy & Fund Airdrop"
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">
                Airdrop Created Successfully!
              </h2>
              <p className="text-gray-600">
                Your airdrop has been deployed and funded. Recipients can now
                claim their tokens.
              </p>

              {hash && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Transaction Hash:</p>
                  <p className="text-sm font-mono break-all">{hash}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <a href="/airdrops">View All Airdrops</a>
                </Button>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Create Another Airdrop
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
