"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chain?.id === sepolia.id;

  return (
    <div className="flex items-center gap-3">
      {/* Network Status Indicator */}
      {isConnected && (
        <div className="flex items-center gap-2">
          {isCorrectNetwork ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Sepolia</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Wrong Network</span>
            </div>
          )}
        </div>
      )}

      {/* RainbowKit Connect Button */}
      <ConnectButton
        chainStatus="icon"
        accountStatus={{
          smallScreen: "avatar",
          largeScreen: "full",
        }}
        showBalance={{
          smallScreen: false,
          largeScreen: true,
        }}
      />

      {/* Network Switch Button */}
      {isConnected && !isCorrectNetwork && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => switchChain({ chainId: sepolia.id })}
        >
          Switch to Sepolia
        </Button>
      )}
    </div>
  );
}
