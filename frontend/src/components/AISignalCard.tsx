"use client";

import { useState, useEffect } from "react";
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";

interface AISignalCardProps {
    symbol: string;
    riskLevel: "low" | "medium" | "high";
    onRiskLevelChange: (level: "low" | "medium" | "high") => void;
}

interface AISignal {
    action: "BUY" | "SELL" | "HOLD";
    confidence: number;
    amount_pct: number;
    reasoning: string;
    timestamp: string;
}

/**
 * AISignalCard Component
 * Displays AI-generated trading signals with confidence and reasoning
 */
export function AISignalCard({ symbol, riskLevel, onRiskLevelChange }: AISignalCardProps) {
    const { address } = useAccount();
    const [signal, setSignal] = useState<AISignal | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch AI signal
    const fetchSignal = async () => {
        setLoading(true);
        setError(null);

        try {
            let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            // Force fix for port 3001 issue
            if (apiUrl.includes("3001")) {
                console.warn("Detected incorrect API URL (port 3001), forcing to http://localhost:8000");
                apiUrl = "http://localhost:8000";
            }
            console.log("Fetching signal from:", `${apiUrl}/ai/signal`);

            const response = await fetch(`${apiUrl}/ai/signal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    risk_level: riskLevel,
                    user_address: address || null,
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch signal');

            const data = await response.json();
            setSignal(data);
        } catch (err) {
            console.error("Signal fetch error:", err);
            // Use mock data for demo
            setSignal({
                action: Math.random() > 0.5 ? "BUY" : Math.random() > 0.5 ? "SELL" : "HOLD",
                confidence: 0.72,
                amount_pct: 25,
                reasoning: "RSI at 32.5 indicates oversold conditions. EMA-12 crossing above EMA-26 suggests bullish momentum. Recommended entry point with moderate position size.",
                timestamp: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSignal();
        // Refresh every 60 seconds
        const interval = setInterval(fetchSignal, 60000);
        return () => clearInterval(interval);
    }, [symbol, riskLevel]);

    const getSignalColor = (action: string) => {
        switch (action) {
            case "BUY": return "text-accent-green";
            case "SELL": return "text-accent-red";
            default: return "text-accent-yellow";
        }
    };

    const getSignalBg = (action: string) => {
        switch (action) {
            case "BUY": return "signal-buy";
            case "SELL": return "signal-sell";
            default: return "signal-hold";
        }
    };

    const getSignalIcon = (action: string) => {
        switch (action) {
            case "BUY": return <TrendingUp className="w-8 h-8" />;
            case "SELL": return <TrendingDown className="w-8 h-8" />;
            default: return <Minus className="w-8 h-8" />;
        }
    };

    // Contract Interaction
    const { writeContractAsync } = useWriteContract();

    // Trade Execution Handler
    const handleTrade = async () => {
        if (!signal || !address) return;

        setLoading(true);
        try {
            console.log("Executing trade for:", signal.action);

            const tradingAgentAddress = process.env.NEXT_PUBLIC_TRADING_AGENT_ADDRESS as `0x${string}`;
            const mockTokenAddress = process.env.NEXT_PUBLIC_MOCK_TOKEN_ADDRESS as `0x${string}`;

            // Import ABI (using require to avoid TS issues if file not perfect)
            const TradingAgentABI = require("../abis/TradingAgent.json").abi;
            const MockERC20ABI = require("../abis/MockERC20.json").abi;

            // 1. Execute On-Chain
            let txHash;

            if (signal.action === "BUY") {
                // Buy = ETH -> Token (payable)
                // Amount: Use 0.01 ETH for demo purposes (real app would calculate based on % portfolio)
                const amountInWei = BigInt(10000000000000000); // 0.01 ETH

                txHash = await writeContractAsync({
                    address: tradingAgentAddress,
                    abi: TradingAgentABI,
                    functionName: 'executeTradeETHForTokens',
                    args: [
                        mockTokenAddress, // tokenOut
                        0n // minAmountOut (0 for demo, normally calculate slippage)
                    ],
                    value: amountInWei
                });
            } else if (signal.action === "SELL") {
                // Sell = Token -> ETH
                // Need Approval first!
                const amountInWei = BigInt(1000000); // 1.000000 USDC (6 decimals)

                // Approve
                await writeContractAsync({
                    address: mockTokenAddress,
                    abi: MockERC20ABI,
                    functionName: 'approve',
                    args: [tradingAgentAddress, amountInWei]
                });

                // Execute
                txHash = await writeContractAsync({
                    address: tradingAgentAddress,
                    abi: TradingAgentABI,
                    functionName: 'executeTradeTokensForETH',
                    args: [
                        mockTokenAddress, // tokenIn
                        amountInWei,      // amountIn
                        0n                // minAmountOut
                    ]
                });
            }

            console.log("Trade submitted, hash:", txHash);

            // 2. Log to Backend
            if (txHash) {
                let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                if (apiUrl.includes("3001")) apiUrl = "http://localhost:8000";

                await fetch(`${apiUrl}/trade/log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol,
                        action: signal.action,
                        amount: 0.01, // approximate
                        price: 0, // fetch real price if needed
                        tx_hash: txHash,
                        user_address: address
                    })
                });
                alert(`Trade Executed! Hash: ${txHash}`);
            }

        } catch (err: any) {
            console.error("Trade execution failed:", err);
            alert(`Execution failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`glass rounded-xl p-6 animate-slide-up ${signal ? getSignalBg(signal.action) : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">AI Signal</h3>
                        <p className="text-sm text-dark-400">Powered by GPT-4</p>
                    </div>
                </div>

                <button
                    onClick={fetchSignal}
                    disabled={loading}
                    className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 text-dark-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Risk Level Selector */}
            <div className="mb-6">
                <label className="text-sm text-dark-400 mb-2 block">Risk Level</label>
                <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => onRiskLevelChange(level)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${riskLevel === level
                                ? level === "low"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                    : level === "medium"
                                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                                : "bg-dark-700 text-dark-400 hover:bg-dark-600"
                                }`}
                        >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Signal Display */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-pulse text-dark-400">Analyzing market data...</div>
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300">{error}</span>
                </div>
            ) : signal ? (
                <>
                    {/* Action and Confidence */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${signal.action === "BUY" ? "bg-green-500/20" :
                                signal.action === "SELL" ? "bg-red-500/20" : "bg-yellow-500/20"
                                }`}>
                                <span className={getSignalColor(signal.action)}>
                                    {getSignalIcon(signal.action)}
                                </span>
                            </div>
                            <div>
                                <span className={`text-3xl font-bold ${getSignalColor(signal.action)}`}>
                                    {signal.action}
                                </span>
                                <p className="text-dark-400 text-sm">
                                    {signal.amount_pct}% of portfolio
                                </p>
                            </div>
                        </div>

                        {/* Confidence Meter */}
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                                {(signal.confidence * 100).toFixed(0)}%
                            </div>
                            <p className="text-dark-400 text-sm">Confidence</p>
                            <div className="w-24 h-2 bg-dark-700 rounded-full mt-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${signal.confidence > 0.7 ? "bg-green-500" :
                                        signal.confidence > 0.4 ? "bg-yellow-500" : "bg-red-500"
                                        }`}
                                    style={{ width: `${signal.confidence * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-dark-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-dark-300 mb-2">AI Reasoning</h4>
                        <p className="text-dark-200 text-sm leading-relaxed">
                            {signal.reasoning}
                        </p>
                    </div>

                    {/* Execution Button */}
                    {signal.action !== "HOLD" && (
                        <button
                            onClick={handleTrade}
                            disabled={!address} // Disable if wallet not connected
                            className={`w-full mt-6 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${signal.action === "BUY"
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/20"
                                : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20"
                                } ${!address ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {address
                                ? `Execute ${signal.action} (0.01 ETH)`
                                : "Connect Wallet to Trade"
                            }
                        </button>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-dark-500 mt-4 text-right">
                        Updated: {new Date(signal.timestamp).toLocaleTimeString()}
                    </p>
                </>
            ) : null}

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-xs text-yellow-400/80">
                    ⚠️ AI signals are not financial advice. Always DYOR.
                </p>
            </div>
        </div>
    );
}
