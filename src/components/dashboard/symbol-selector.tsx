"use client";

import { useConfigStore, getSymbols } from "@/store/config-store";

export function SymbolSelector() {
  const config = useConfigStore((s) => s.config);
  const selectedSymbol = useConfigStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useConfigStore((s) => s.setSelectedSymbol);
  const symbols = getSymbols(config);

  return (
    <div className="flex gap-1">
      {symbols.map((symbol) => (
        <button
          key={symbol}
          onClick={() => setSelectedSymbol(symbol)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            selectedSymbol === symbol
              ? "bg-white text-black"
              : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
