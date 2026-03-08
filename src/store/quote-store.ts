import { create } from "zustand";
import type { AdapterStatus, Quote } from "@/adapters/types";

export const EMPTY_QUOTES: Record<string, Quote> = {};

interface QuoteStore {
  // quotes[symbol][exchange] -> Quote
  quotes: Record<string, Record<string, Quote>>;
  adapterStatuses: Record<string, AdapterStatus>;

  updateQuote: (quote: Quote) => void;
  updateStatus: (status: AdapterStatus) => void;
  clearQuotes: () => void;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  quotes: {},
  adapterStatuses: {},

  updateQuote: (quote: Quote) =>
    set((state) => ({
      quotes: {
        ...state.quotes,
        [quote.symbol]: {
          ...state.quotes[quote.symbol],
          [quote.exchange]: quote,
        },
      },
    })),

  updateStatus: (status: AdapterStatus) =>
    set((state) => ({
      adapterStatuses: {
        ...state.adapterStatuses,
        [status.exchange]: status,
      },
    })),

  clearQuotes: () => set({ quotes: {} }),
}));
