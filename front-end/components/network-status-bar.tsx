"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export function NetworkStatusBar() {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isDismissed, setIsDismissed] = useState(false);

  const isCorrectNetwork = chain?.id === sepolia.id;
  const shouldShow = isConnected && !isCorrectNetwork && !isDismissed;

  if (!shouldShow) return null;

  return (
    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Wrong Network Detected
            </h3>
            <p className="text-sm text-red-700">
              Please switch to Sepolia testnet to use this application.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="bg-white hover:bg-red-50 border-red-300 text-red-800"
          >
            Switch to Sepolia
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
