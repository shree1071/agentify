import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ArrowUpRight, ArrowDownLeft, Clock, Loader2 } from "lucide-react";
import { formatEther } from "viem";

interface TradeHistoryProps {
    isPaperTrading: boolean;
}

interface Trade {
    id: string;
    token_in_symbol: string;
    token_out_symbol: string;
    amount_in: string;
    amount_out: string;
    trade_direction: "buy" | "sell";
    executed_at: string;
    status: string;
    is_paper_trade: boolean;
}

export function TradeHistory({ isPaperTrading }: TradeHistoryProps) {
    const { address } = useAccount();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchTrades = async () => {
            if (!address) return;

            setIsLoading(true);
            try {
                // Fetch recent trades
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/trade/history/${address}?is_paper=${isPaperTrading}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.trades)) {
                        setTrades(data.trades);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch trade history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrades();

        // Poll for updates every 10 seconds
        const interval = setInterval(fetchTrades, 10000);
        return () => clearInterval(interval);
    }, [address, isPaperTrading]);

    // Helper for "time ago" format
    const timeAgo = (dateString: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
    };

    if (isLoading && trades.length === 0) {
        return (
            <div className="glass rounded-xl p-6 min-h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Trades</h2>
                <div className="flex items-center gap-2 text-sm text-dark-400">
                    <Clock className="w-4 h-4" />
                    <span>Auto-updating</span>
                </div>
            </div>

            {trades.length === 0 ? (
                <div className="text-center py-12 text-dark-400">
                    <p className="mb-2">No trade history found</p>
                    <p className="text-xs">Execute a trade to see it appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trades.map((trade) => (
                        <div
                            key={trade.id}
                            className="bg-dark-800/50 rounded-lg p-4 flex items-center justify-between hover:bg-dark-800 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`p-2 rounded-lg ${trade.trade_direction === "buy"
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-red-500/20 text-red-400"
                                        }`}
                                >
                                    {trade.trade_direction === "buy" ? (
                                        <ArrowUpRight className="w-5 h-5" />
                                    ) : (
                                        <ArrowDownLeft className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">
                                            {trade.token_out_symbol}/{trade.token_in_symbol}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${trade.trade_direction === "buy"
                                                ? "bg-green-500/10 text-green-400"
                                                : "bg-red-500/10 text-red-400"
                                                }`}
                                        >
                                            {trade.trade_direction.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-dark-400 mt-1">
                                        {trade.trade_direction === "buy"
                                            ? `${formatEther(BigInt(trade.amount_in))} ${trade.token_in_symbol}`
                                            : `${formatEther(BigInt(trade.amount_in))} ${trade.token_in_symbol}`
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className={`font-medium ${trade.status === "confirmed" ? "text-green-400" : "text-yellow-400"}`}>
                                    {trade.status === "confirmed" ? "Completed" : trade.status}
                                </p>
                                <p className="text-xs text-dark-500 mt-1">
                                    {timeAgo(trade.executed_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
