"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { PriceChart } from "@/components/PriceChart";
import { AISignalCard } from "@/components/AISignalCard";
import { TradePanel } from "@/components/TradePanel";
import { TradeHistory } from "@/components/TradeHistory";
import { StatsCards } from "@/components/StatsCards";
import { GasTracker } from "@/components/GasTracker";
import { BlockchainTransactionHistory } from "@/components/BlockchainTransactionHistory";

/**
 * Main Dashboard Page
 * Displays price charts, AI signals, and trading controls
 */
export default function Dashboard() {
    const [isPaperTrading, setIsPaperTrading] = useState(true);
    const [selectedToken, setSelectedToken] = useState("ethereum");
    const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");

    return (
        <main className="min-h-screen bg-dark-950">
            {/* Header with wallet connection */}
            <Header
                isPaperTrading={isPaperTrading}
                onTogglePaperTrading={() => setIsPaperTrading(!isPaperTrading)}
            />

            {/* Main content */}
            <div className="container mx-auto px-4 py-6">
                {/* Stats overview */}
                <StatsCards />

                {/* Main grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Left column - Chart and AI Signal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Price Chart */}
                        <div className="glass rounded-xl p-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    Price Chart
                                </h2>
                                {/* Token selector */}
                                <select
                                    value={selectedToken}
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                    className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="ethereum">Ethereum (ETH)</option>
                                    <option value="bitcoin">Bitcoin (BTC)</option>
                                    <option value="solana">Solana (SOL)</option>
                                    <option value="polygon">Polygon (MATIC)</option>
                                </select>
                            </div>
                            <PriceChart symbol={selectedToken} />
                        </div>

                        {/* AI Signal Card */}
                        <AISignalCard
                            symbol={selectedToken}
                            riskLevel={riskLevel}
                            onRiskLevelChange={setRiskLevel}
                        />

                        {/* Blockchain Transaction History */}
                        <BlockchainTransactionHistory />
                    </div>

                    {/* Right column - Trade Panel, Gas Tracker, and History */}
                    <div className="space-y-6">
                        {/* Trade Panel */}
                        <TradePanel
                            symbol={selectedToken}
                            isPaperTrading={isPaperTrading}
                            riskLevel={riskLevel}
                        />

                        {/* Gas Tracker */}
                        <GasTracker />

                        {/* Trade History */}
                        <TradeHistory isPaperTrading={isPaperTrading} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-dark-700 mt-12 py-6">
                <div className="container mx-auto px-4 text-center text-dark-400">
                    <p className="text-sm">
                        ⚠️ AI signals are for informational purposes only.
                        Always do your own research before trading.
                    </p>
                    <p className="text-xs mt-2">
                        Built for demonstration purposes • Not financial advice
                    </p>
                </div>
            </footer>
        </main>
    );
}
