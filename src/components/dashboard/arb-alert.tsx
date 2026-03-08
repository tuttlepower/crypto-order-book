"use client";

import { useQuoteStore } from "@/store/quote-store";
import { useConfigStore } from "@/store/config-store";
import { detectArbitrage } from "@/lib/arbitrage";
import { formatPrice, formatBps } from "@/lib/utils";
import { getSymbols } from "@/store/config-store";

export function ArbAlert() {
  const quotes = useQuoteStore((s) => s.quotes);
  const config = useConfigStore((s) => s.config);
  const symbols = getSymbols(config);

  const opportunities = symbols
    .map((symbol) => {
      const quotesForSymbol = quotes[symbol];
      if (!quotesForSymbol) return null;
      return detectArbitrage(
        quotesForSymbol,
        config.fees,
        config.settings.maxQuoteAgeSec,
        config.settings.slippageBuffer,
        config.settings.arbThreshold
      );
    })
    .filter((arb): arb is NonNullable<typeof arb> => arb !== null);

  if (opportunities.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
          Arbitrage Scanner
        </h3>
        <p className="text-xs text-[var(--muted-foreground)]">No opportunities detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {opportunities.map((arb) => (
        <div
          key={`${arb.symbol}-${arb.buyExchange}-${arb.sellExchange}`}
          className="rounded-lg border border-[var(--green)] bg-[#22c55e10] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[var(--green)] uppercase tracking-wider">
              Arb Opportunity
            </span>
            <span className="text-xs font-medium">{arb.symbol}</span>
          </div>
          <div className="text-sm mb-1">
            <span className="text-[var(--green)]">Buy</span> on{" "}
            <span className="font-medium">{arb.buyExchange}</span> at{" "}
            <span className="font-mono">{formatPrice(arb.buyPrice)}</span>
          </div>
          <div className="text-sm mb-2">
            <span className="text-[var(--red)]">Sell</span> on{" "}
            <span className="font-medium">{arb.sellExchange}</span> at{" "}
            <span className="font-mono">{formatPrice(arb.sellPrice)}</span>
          </div>
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            <span>
              Raw: <span className="font-mono">${arb.rawSpread.toFixed(2)}</span>
            </span>
            <span>
              Net: <span className="font-mono text-[var(--green)]">${arb.netEdge.toFixed(2)}</span>
            </span>
            <span>
              Net BPS: <span className="font-mono">{formatBps(arb.netEdgeBps)}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
