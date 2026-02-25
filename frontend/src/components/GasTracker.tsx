"use client";

import { Fuel, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { useGasPrice } from "@/hooks/useGasPrice";

/**
 * GasTracker Component
 * Displays real-time gas prices from the blockchain
 */
export function GasTracker() {
    const { gasData, isLoading } = useGasPrice();

    const gasPrices = [
        {
            label: "Slow",
            price: gasData?.low?.toFixed(2) || "--",
            icon: TrendingDown,
            color: "text-green-400",
            bgColor: "bg-green-500/10",
        },
        {
            label: "Standard",
            price: gasData?.medium?.toFixed(2) || "--",
            icon: Zap,
            color: "text-yellow-400",
            bgColor: "bg-yellow-500/10",
        },
        {
            label: "Fast",
            price: gasData?.high?.toFixed(2) || "--",
            icon: TrendingUp,
            color: "text-red-400",
            bgColor: "bg-red-500/10",
        },
    ];

    return (
        <div className="glass rounded-xl p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Gas Tracker</h3>
                    <p className="text-xs text-dark-400">Real-time network fees</p>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-4 text-dark-400">Loading gas prices...</div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {gasPrices.map((item) => (
                        <div
                            key={item.label}
                            className={`${item.bgColor} rounded-lg p-3 text-center hover:scale-105 transition-transform`}
                        >
                            <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
                            <p className="text-xs text-dark-400 mb-1">{item.label}</p>
                            <p className={`text-lg font-bold ${item.color}`}>{item.price}</p>
                            <p className="text-xs text-dark-500">Gwei</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-4 p-3 bg-dark-800/50 rounded-lg">
                <p className="text-xs text-dark-400 text-center">
                    💡 Lower gas = cheaper transactions. Use "Slow" for non-urgent trades.
                </p>
            </div>
        </div>
    );
}
