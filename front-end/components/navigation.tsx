"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletConnect } from "./wallet-connect";
import { NetworkStatusBar } from "./network-status-bar";
import { Button } from "./ui/button";
import { Gift, Plus, List, Home } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Create", href: "/create", icon: Plus },
  { name: "Airdrops", href: "/airdrops", icon: List },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <NetworkStatusBar />
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Gift className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  Airdrop Builder
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
