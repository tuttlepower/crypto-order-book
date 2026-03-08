"use client";

import { useEffect, useRef, useState } from "react";
import { useQuoteStore } from "@/store/quote-store";

/**
 * Returns a map of exchange -> age in seconds, updated every 100ms.
 * Used to drive stale quote indicators in the UI.
 */
export function useQuoteAge(symbol: string): Record<string, number> {
  const [ages, setAges] = useState<Record<string, number>>({});
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  useEffect(() => {
    const interval = setInterval(() => {
      const quotes = useQuoteStore.getState().quotes[symbolRef.current];
      if (!quotes) return;
      const now = Date.now();
      const newAges: Record<string, number> = {};
      for (const [exchange, quote] of Object.entries(quotes)) {
        newAges[exchange] = (now - quote.timestamp) / 1000;
      }
      setAges(newAges);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return ages;
}
