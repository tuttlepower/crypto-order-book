"use client";

import { useEffect, useRef } from "react";
import { createAdapters } from "@/adapters/registry";
import type { ExchangeAdapter } from "@/adapters/types";
import { useQuoteStore } from "@/store/quote-store";
import { useConfigStore } from "@/store/config-store";

export function useWebSocketFeeds() {
  const adaptersRef = useRef<Map<string, ExchangeAdapter> | null>(null);
  const statusInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const config = useConfigStore.getState().config;
    const { updateQuote, updateStatus } = useQuoteStore.getState();

    const adapters = createAdapters(config);
    adaptersRef.current = adapters;

    // Use store.getState() in the callback to avoid stale closures
    const onQuote = (quote: Parameters<typeof updateQuote>[0]) => {
      useQuoteStore.getState().updateQuote(quote);
    };

    for (const adapter of adapters.values()) {
      adapter.connect(onQuote);
    }

    // Poll adapter statuses
    statusInterval.current = setInterval(() => {
      for (const adapter of adapters.values()) {
        useQuoteStore.getState().updateStatus(adapter.getStatus());
      }
    }, 1000);

    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
      for (const adapter of adapters.values()) {
        adapter.disconnect();
      }
      adaptersRef.current = null;
    };
  }, []);

  return adaptersRef;
}
