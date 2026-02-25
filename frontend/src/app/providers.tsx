"use client";

import dynamic from "next/dynamic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create React Query client outside component to prevent recreation
const queryClient = new QueryClient();

interface ProvidersProps {
    children: React.ReactNode;
}

// Dynamically import wallet providers with SSR disabled
// This prevents WalletConnect/RainbowKit from initializing during server-side rendering
const WalletProviders = dynamic(
    () => import("./wallet-providers").then((mod) => mod.WalletProviders),
    { ssr: false }
);

/**
 * App Providers Component
 * Wraps the app with wallet connection and data fetching providers
 * Uses dynamic import to prevent SSR issues with wallet libraries
 */
export function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <WalletProviders>{children}</WalletProviders>
        </QueryClientProvider>
    );
}
