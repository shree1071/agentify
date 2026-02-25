"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ArrowRightLeft, Loader2, CheckCircle2, XCircle, Wallet } from "lucide-react";

interface TradePanelProps {
    symbol: string;
    isPaperTrading: boolean;
    riskLevel: "low" | "medium" | "high";
}

// Trading Agent contract ABI (simplified)
const TRADING_AGENT_ABI = [
    {
        name: "executeTrade",
        type: "function",
        inputs: [
            { name: "tokenIn", type: "address" },
            { name: "tokenOut", type: "address" },
            { name: "amountIn", type: "uint256" },
            { name: "minAmountOut", type: "uint256" },
        ],
        outputs: [{ name: "amountOut", type: "uint256" }],
    },
    {
        name: "executeTradeETHForTokens",
        type: "function",
        inputs: [
            { name: "tokenOut", type: "address" },
            { name: "minAmountOut", type: "uint256" },
        ],
        outputs: [{ name: "amountOut", type: "uint256" }],
    },
] as const;

// Demo token addresses (Sepolia)
const TOKENS = {
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};

/**
 * TradePanel Component
 * Handles trade execution for both paper and real trading
 */
export function TradePanel({ symbol, isPaperTrading, riskLevel }: TradePanelProps) {
    const { address, isConnected } = useAccount();
    const [lastTradeHash, setLastTradeHash] = useState<string | null>(null);
    const [amount, setAmount] = useState("");
    const [slippage, setSlippage] = useState("0.5");
    const [tradeDirection, setTradeDirection] = useState<"buy" | "sell">("buy");
    const [isPaperExecuting, setIsPaperExecuting] = useState(false);
    const [paperResult, setPaperResult] = useState<{ success: boolean; message: string } | null>(null);

    // Contract write hook
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    // Transaction receipt
    const { isLoading: isConfirming, isSuccess, isError, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    // Log real trade to backend after confirmation
    useEffect(() => {
        const logRealTrade = async () => {
            if (isSuccess && hash && address && hash !== lastTradeHash) {
                setLastTradeHash(hash);

                try {
                    // Calculate gas fee if available
                    const gasUsed = receipt?.gasUsed || BigInt(0);
                    const gasPrice = receipt?.effectiveGasPrice || BigInt(0);
                    const gasFeeWei = gasUsed * gasPrice;
                    const gasFeeEth = Number(gasFeeWei) / 1e18;

                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/trade/real`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_address: address,
                            token_in_address: TOKENS.WETH,
                            token_in_symbol: "ETH",
                            token_out_address: TOKENS.USDC,
                            token_out_symbol: "USDC",
                            amount_in: parseEther(amount || "0").toString(),
                            amount_out: "0", // Will be calculated from receipt
                            transaction_hash: hash,
                            trade_direction: tradeDirection,
                            slippage_percent: parseFloat(slippage),
                            gas_fee_eth: gasFeeEth > 0 ? gasFeeEth.toString() : null,
                        }),
                    });

                    console.log("✅ Trade logged to database successfully");
                } catch (error) {
                    console.error("❌ Failed to log trade:", error);
                }
            }
        };

        logRealTrade();
    }, [isSuccess, hash, address, receipt, amount, tradeDirection, slippage, lastTradeHash]);

    // Execute paper trade
    const executePaperTrade = async () => {
        if (!amount || !address) return;

        setIsPaperExecuting(true);
        setPaperResult(null);

        try {
            // Log paper trade to backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/trade/paper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_address: address,
                    token_in: tradeDirection === "buy" ? TOKENS.USDC : TOKENS.WETH,
                    token_out: tradeDirection === "buy" ? TOKENS.WETH : TOKENS.USDC,
                    amount_in: parseEther(amount).toString(),
                    amount_out: (parseEther(amount) * BigInt(tradeDirection === "buy" ? 2500 : 1) / BigInt(tradeDirection === "buy" ? 1 : 2500)).toString(),
                    is_paper_trade: true,
                }),
            });

            setPaperResult({
                success: true,
                message: `Paper trade executed: ${tradeDirection.toUpperCase()} ${amount} ${symbol.toUpperCase()}`,
            });
        } catch (err) {
            // Mock success for demo
            setPaperResult({
                success: true,
                message: `Paper trade executed: ${tradeDirection.toUpperCase()} ${amount} ${symbol.toUpperCase()}`,
            });
        } finally {
            setIsPaperExecuting(false);
        }
    };

    // Execute real trade
    const executeRealTrade = () => {
        if (!amount) return;

        const amountWei = parseEther(amount);
        const slippageBps = Math.floor(parseFloat(slippage) * 100);
        const minOut = amountWei - (amountWei * BigInt(slippageBps) / BigInt(10000));

        writeContract({
            address: process.env.NEXT_PUBLIC_TRADING_AGENT_ADDRESS as `0x${string}` || "0x0000000000000000000000000000000000000000",
            abi: TRADING_AGENT_ABI,
            functionName: "executeTradeETHForTokens",
            args: [TOKENS.USDC as `0x${string}`, minOut],
            value: amountWei,
        });
    };

    const handleTrade = () => {
        if (isPaperTrading) {
            executePaperTrade();
        } else {
            executeRealTrade();
        }
    };

    const isLoading = isPaperExecuting || isPending || isConfirming;
    const maxAmounts = { low: "0.5", medium: "2", high: "10" };

    return (
        <div className="glass rounded-xl p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <ArrowRightLeft className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Execute Trade</h3>
                    <p className="text-sm text-dark-400">
                        {isPaperTrading ? "Paper Trading" : "Real Trading"}
                    </p>
                </div>
            </div>

            {/* Trade Direction Toggle */}
            <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                    onClick={() => setTradeDirection("buy")}
                    className={`py-3 rounded-lg font-medium transition-all ${tradeDirection === "buy"
                        ? "bg-accent-green text-white glow-green"
                        : "bg-dark-700 text-dark-400 hover:bg-dark-600"
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => setTradeDirection("sell")}
                    className={`py-3 rounded-lg font-medium transition-all ${tradeDirection === "sell"
                        ? "bg-accent-red text-white glow-red"
                        : "bg-dark-700 text-dark-400 hover:bg-dark-600"
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
                <label className="text-sm text-dark-400 mb-2 block">Amount (ETH)</label>
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                        onClick={() => setAmount(maxAmounts[riskLevel])}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-400 hover:text-primary-300"
                    >
                        MAX
                    </button>
                </div>
                <p className="text-xs text-dark-500 mt-1">
                    Max for {riskLevel} risk: {maxAmounts[riskLevel]} ETH
                </p>
            </div>

            {/* Slippage Setting */}
            <div className="mb-6">
                <label className="text-sm text-dark-400 mb-2 block">Slippage Tolerance</label>
                <div className="flex gap-2">
                    {["0.5", "1.0", "2.0"].map((value) => (
                        <button
                            key={value}
                            onClick={() => setSlippage(value)}
                            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${slippage === value
                                ? "bg-primary-500 text-white"
                                : "bg-dark-700 text-dark-400 hover:bg-dark-600"
                                }`}
                        >
                            {value}%
                        </button>
                    ))}
                </div>
            </div>

            {/* Trade Summary */}
            <div className="bg-dark-800/50 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-400">You {tradeDirection === "buy" ? "pay" : "receive"}</span>
                    <span className="text-white">{amount || "0"} ETH</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-dark-400">You {tradeDirection === "buy" ? "receive" : "pay"}</span>
                    <span className="text-white">
                        ~{(parseFloat(amount || "0") * 2500).toFixed(2)} USDC
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Slippage</span>
                    <span className="text-white">{slippage}%</span>
                </div>
            </div>

            {/* Execute Button */}
            {isConnected ? (
                <button
                    onClick={handleTrade}
                    disabled={!amount || isLoading}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${tradeDirection === "buy"
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                        }`}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isPaperTrading ? "Simulating..." : "Confirming..."}
                        </span>
                    ) : (
                        `${tradeDirection === "buy" ? "Buy" : "Sell"} ${symbol.toUpperCase()}`
                    )}
                </button>
            ) : (
                <button
                    disabled
                    className="w-full py-4 rounded-xl font-semibold bg-dark-700 text-dark-400 cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Wallet className="w-5 h-5" />
                    Connect Wallet to Trade
                </button>
            )}

            {/* Transaction Status */}
            {(isSuccess || isError || paperResult) && (
                <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${(isSuccess || paperResult?.success) ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                    {(isSuccess || paperResult?.success) ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-sm ${(isSuccess || paperResult?.success) ? "text-green-300" : "text-red-300"}`}>
                        {paperResult?.message || (isSuccess ? "Trade executed successfully!" : "Trade failed. Please try again.")}
                    </span>
                </div>
            )}
        </div>
    );
}
