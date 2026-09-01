import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { fetchPrices } from "@/lib/prices";
import { getStripeConfig } from "@/lib/payments";
import { useCadence } from "@/lib/store";
import type { PriceMap } from "@/lib/types";
import type { StripeConfig } from "@/lib/stripe-networks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCadence.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        {children}
        <PriceSync />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function PriceSync() {
  const catchUp = useCadence((s) => s.catchUp);
  const cards = useCadence((s) => s.cards);
  const { data } = useQuery({
    queryKey: ["prices"],
    queryFn: () => fetchPrices(),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    const n = catchUp(data);
    if (n > 0) {
      toast.success(
        n === 1
          ? "A scheduled buy settled to your Tangem"
          : `${n} scheduled buys settled to your Tangem`,
      );
    }
  }, [data, catchUp, cards]);

  return null;
}

export function usePrices(): { prices: PriceMap; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["prices"],
    queryFn: () => fetchPrices(),
    refetchInterval: 60_000,
  });
  return { prices: data ?? {}, isLoading };
}

export function useStripeConfig(): {
  config: StripeConfig | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["stripe-config"],
    queryFn: () => getStripeConfig(),
    staleTime: 60_000,
  });
  return { config: data, isLoading };
}
