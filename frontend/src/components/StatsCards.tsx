"use client";

import { TrendingUp, DollarSign, Activity, Zap, Fuel, Network } from "lucide-react";
import { useAccount, useBalance, useBlockNumber } from "wagmi";
import { formatEther } from "viem";
import { useCoinGeckoPrice } from "@/hooks/useCoinGeckoPrice";

/**
 * StatsCards Component
 * Displays portfolio statistics and trading metrics with real blockchain data
 */
export function StatsCards() {
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });
    const { data: blockNumber } = useBlockNumber({ watch: true });
    const { price: ethPrice, isLoading: isPriceLoading } = useCoinGeckoPrice();

    // Calculate real portfolio value in USD
    const ethBalance = balance ? Number(formatEther(balance.value)) : 0;
    const portfolioValueUSD = ethBalance * ethPrice;

    const stats = [
        {
            title: "Portfolio Value",
            value: isConnected
                ? isPriceLoading
                    ? "Loading..."
                    : portfolioValueUSD > 0
                        ? `$${portfolioValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "$0.00"
                : "$--,---.--",
            change: isConnected ? `${ethBalance.toFixed(4)} ETH` : "+0.0%",
            positive: true,
            icon: DollarSign,
            color: "from-green-500 to-emerald-600",
        },
        {
            title: "ETH Price",
            value: isPriceLoading
                ? "Loading..."
                : ethPrice > 0
                    ? `$${ethPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "$---.--",
            change: "CoinGecko Live",
            positive: true,
            icon: TrendingUp,
            color: "from-primary-500 to-blue-600",
        },
        {
            title: "Network",
            value: isConnected ? "Localhost" : "Not Connected",
            change: isConnected ? `Block #${blockNumber?.toString() || "..."}` : "--",
            positive: true,
            icon: Network,
            color: "from-purple-500 to-violet-600",
        },
        {
            title: "Wallet Status",
            value: isConnected ? "Connected" : "Disconnected",
            change: isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet",
            positive: isConnected,
            icon: Zap,
            color: isConnected ? "from-yellow-500 to-orange-600" : "from-gray-500 to-gray-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={stat.title}
                    className="glass rounded-xl p-5 animate-fade-in hover:scale-105 transition-transform duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-dark-400 text-sm">{stat.title}</p>
                            <p className="text-2xl font-bold text-white mt-1 truncate">{stat.value}</p>
                            <p
                                className={`text-sm mt-1 truncate ${stat.positive ? "text-accent-green" : "text-dark-400"
                                    }`}
                                title={stat.change}
                            >
                                {stat.change}
                            </p>
                        </div>
                        <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 ml-2`}
                        >
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
