import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,   // 30s
      gcTime: 1000 * 60 * 10, // 10m
      refetchOnWindowFocus: false,
    },
  },
});