import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

/**
 * Hook to check if OpenAI integration is available
 * This can be used to conditionally show/hide OpenAI-dependent features
 * or display appropriate messaging to users
 */
export function useOpenAIStatus() {
  const { 
    data: status, 
    isLoading,
    error,
    isError,
    refetch
  } = useQuery<{ available: boolean; timestamp: string }>({
    queryKey: ["/api/openai-status"],
    queryFn: getQueryFn(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    isAvailable: status?.available ?? false,
    isLoading,
    lastChecked: status?.timestamp ? new Date(status.timestamp) : null,
    isError,
    error,
    refetch
  };
}