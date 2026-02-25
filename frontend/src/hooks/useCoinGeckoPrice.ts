import { useQuery } from "@tanstack/react-query";

interface CoinGeckoPriceResponse {
    ethereum: {
        usd: number;
    };
}

/**
 * Hook to fetch real-time ETH price from CoinGecko API
 * @returns Current ETH/USD price, loading state, and error
 */
export function useCoinGeckoPrice() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["ethPrice"],
        queryFn: async () => {
            const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
            const url = apiKey
                ? `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`
                : "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch ETH price");
            }

            const data: CoinGeckoPriceResponse = await response.json();
            return data.ethereum.usd;
        },
        // Refetch every 5 minutes
        refetchInterval: 5 * 60 * 1000,
        // Use stale data while revalidating
        staleTime: 4 * 60 * 1000,
    });

    return {
        price: data ?? 0,
        isLoading,
        error,
    };
}
