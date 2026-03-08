import { create } from "zustand";
import type { AppConfig } from "@/adapters/types";
import { config as defaultConfig } from "@/lib/config";

interface ConfigStore {
  config: AppConfig;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  toggleExchange: (name: string) => void;
}

// Derive available symbols from config
function getSymbols(config: AppConfig): string[] {
  const symbols = new Set<string>();
  for (const exchange of Object.values(config.exchanges)) {
    for (const normalized of Object.values(exchange.symbols)) {
      symbols.add(normalized);
    }
  }
  return Array.from(symbols).sort();
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: defaultConfig,
  selectedSymbol: getSymbols(defaultConfig)[0] || "BTC-USD",

  setSelectedSymbol: (symbol: string) => set({ selectedSymbol: symbol }),

  toggleExchange: (name: string) =>
    set((state) => ({
      config: {
        ...state.config,
        exchanges: {
          ...state.config.exchanges,
          [name]: {
            ...state.config.exchanges[name],
            enabled: !state.config.exchanges[name].enabled,
          },
        },
      },
    })),
}));

export { getSymbols };
