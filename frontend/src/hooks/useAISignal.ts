"use client";

import { useState, useCallback } from "react";
import { AISignal, RiskLevel } from "@/types";

interface UseAISignalOptions {
    symbol: string;
    riskLevel: RiskLevel;
    userAddress?: string;
}

/**
 * Custom hook for fetching AI trading signals
 */
export function useAISignal({ symbol, riskLevel, userAddress }: UseAISignalOptions) {
    const [signal, setSignal] = useState<AISignal | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSignal = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            // Force fix for port 3001 issue
            if (apiUrl.includes("3001")) {
                console.warn("Detected incorrect API URL (port 3001), forcing to http://localhost:8000");
                apiUrl = "http://localhost:8000";
            }

            const response = await fetch(
                `${apiUrl}/ai/signal`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        symbol,
                        risk_level: riskLevel,
                        user_address: userAddress || null,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch signal");
            }

            const data = await response.json();
            setSignal(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            // Return mock data for demo
            setSignal({
                action: "HOLD",
                confidence: 0.65,
                amount_pct: 0,
                reasoning: "Market conditions are uncertain. Waiting for clearer signals.",
                timestamp: new Date().toISOString(),
                symbol,
                risk_level: riskLevel,
            });
        } finally {
            setLoading(false);
        }
    }, [symbol, riskLevel, userAddress]);

    return {
        signal,
        loading,
        error,
        fetchSignal,
    };
}
