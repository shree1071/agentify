import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";

/**
 * Hook to fetch current gas prices from the blockchain
 * @returns Gas price in gwei, loading state, and error
 */
export function useGasPrice() {
    const publicClient = usePublicClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["gasPrice"],
        queryFn: async () => {
            if (!publicClient) return null;

            // Get gas price from blockchain
            const gasPrice = await publicClient.getGasPrice();

            // Convert from wei to gwei
            const gasPriceGwei = Number(gasPrice) / 1e9;

            return {
                gasPrice: gasPriceGwei,
                low: gasPriceGwei * 0.9, // 10% lower for slow transactions
                medium: gasPriceGwei, // Standard
                high: gasPriceGwei * 1.2, // 20% higher for fast transactions
            };
        },
        // Refetch every 15 seconds
        refetchInterval: 15 * 1000,
        enabled: !!publicClient,
    });

    return {
        gasData: data,
        isLoading,
        error,
    };
}
