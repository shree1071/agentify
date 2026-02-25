"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { sepolia, mainnet, hardhat } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";

// Configure chains and providers
const config = getDefaultConfig({
    appName: "AI Trading Agent",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
    chains: [hardhat, sepolia, mainnet],
    transports: {
        [hardhat.id]: http("http://127.0.0.1:8545"),
        [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
        [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    },
    ssr: false, // Disable SSR for wallet config
});

interface WalletProvidersProps {
    children: React.ReactNode;
}

/**
 * Wallet Providers Component
 * Contains RainbowKit and Wagmi providers
 * This file is dynamically imported with ssr: false to prevent server-side execution
 */
export function WalletProviders({ children }: WalletProvidersProps) {
    return (
        <WagmiProvider config={config}>
            <RainbowKitProvider>
                {children}
            </RainbowKitProvider>
        </WagmiProvider>
    );
}
