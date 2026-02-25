"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData } from "lightweight-charts";

interface PriceChartProps {
    symbol: string;
}

// Map symbol names to CoinGecko IDs
const symbolToGeckoId: Record<string, string> = {
    ethereum: "ethereum",
    bitcoin: "bitcoin",
    solana: "solana",
    polygon: "matic-network",
};

/**
 * PriceChart Component
 * Displays live candlestick chart using lightweight-charts with CoinGecko data
 */
export function PriceChart({ symbol }: PriceChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [priceChange, setPriceChange] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch OHLC data from Backend
    const fetchOHLCData = useCallback(async () => {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Force fix for port 3001 issue
        if (apiUrl.includes("3001")) {
            console.warn("Detected incorrect API URL (port 3001), forcing to http://localhost:8000");
            apiUrl = "http://localhost:8000";
        }

        try {
            // Fetch OHLC data via backend proxy (handles mock fallback)
            const response = await fetch(`${apiUrl}/market-data/${symbol}?days=30`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Transform backend OHLC data to chart format
            // Backend returns: { ohlcv: [{ timestamp, open, high, low, close }, ...] }
            if (data.ohlcv && Array.isArray(data.ohlcv)) {
                const chartData: CandlestickData[] = data.ohlcv.map((candle: any) => ({
                    time: Math.floor(new Date(candle.timestamp).getTime() / 1000) as any, // Convert ISO to seconds
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                }));
                // Sort by time just in case
                return chartData.sort((a: any, b: any) => a.time - b.time);
            }
            return [];
        } catch (err) {
            console.error("Failed to fetch OHLC data:", err);
            throw err;
        }
    }, [symbol]);

    // Fetch current price for display
    const fetchCurrentPrice = useCallback(async () => {
        let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Force fix for port 3001 issue
        if (apiUrl.includes("3001")) {
            console.warn("Detected incorrect API URL (port 3001), forcing to http://localhost:8000");
            apiUrl = "http://localhost:8000";
        }

        try {
            const response = await fetch(`${apiUrl}/market-data/${symbol}/price`);

            if (!response.ok) throw new Error("Failed to fetch price");

            const data = await response.json();

            if (data) {
                setCurrentPrice(data.price);
                setPriceChange(data.change_24h || 0);
            }
        } catch (err) {
            console.error("Failed to fetch current price:", err);
        }
    }, [symbol]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        setLoading(true);
        setError(null);

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#94a3b8",
            },
            grid: {
                vertLines: { color: "rgba(51, 65, 85, 0.5)" },
                horzLines: { color: "rgba(51, 65, 85, 0.5)" },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                borderColor: "#334155",
                timeVisible: true,
            },
            rightPriceScale: {
                borderColor: "#334155",
            },
            crosshair: {
                vertLine: {
                    color: "#0ea5e9",
                    labelBackgroundColor: "#0ea5e9",
                },
                horzLine: {
                    color: "#0ea5e9",
                    labelBackgroundColor: "#0ea5e9",
                },
            },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addCandlestickSeries({
            upColor: "#10b981",
            downColor: "#ef4444",
            borderDownColor: "#ef4444",
            borderUpColor: "#10b981",
            wickDownColor: "#ef4444",
            wickUpColor: "#10b981",
        });

        seriesRef.current = candlestickSeries;

        // Fetch and set data
        const loadData = async () => {
            try {
                const data = await fetchOHLCData();
                candlestickSeries.setData(data);
                chart.timeScale().fitContent();
                setLoading(false);
            } catch (err) {
                setError("Failed to load chart data");
                setLoading(false);
            }
        };

        loadData();
        fetchCurrentPrice();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener("resize", handleResize);

        // Refresh price every 30 seconds
        const priceInterval = setInterval(fetchCurrentPrice, 30000);

        return () => {
            window.removeEventListener("resize", handleResize);
            clearInterval(priceInterval);
            chart.remove();
        };
    }, [symbol, fetchOHLCData, fetchCurrentPrice]);

    return (
        <div className="chart-container">
            {/* Price header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex items-center gap-3">
                        {loading ? (
                            <span className="text-3xl font-bold text-dark-400 animate-pulse">Loading...</span>
                        ) : (
                            <>
                                <span className="text-3xl font-bold text-white">
                                    ${(currentPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className={`text-lg font-medium ${(priceChange ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                    {(priceChange ?? 0) >= 0 ? '+' : ''}{(priceChange ?? 0).toFixed(2)}%
                                </span>
                            </>
                        )}
                    </div>
                    <p className="text-dark-400 text-sm mt-1">
                        {(symbol ?? 'ETH').toUpperCase()} / USD • {loading ? 'Fetching...' : 'Live from CoinGecko'}
                    </p>
                </div>

                {/* Time range buttons */}
                <div className="flex gap-2">
                    {['1H', '4H', '1D', '1W'].map((range) => (
                        <button
                            key={range}
                            className="px-3 py-1 text-sm rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white transition-colors"
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error} - Using fallback data
                </div>
            )}

            {/* Chart container */}
            <div ref={chartContainerRef} className="w-full" />
        </div>
    );
}
