"use client";

import { useQuoteStore, EMPTY_QUOTES } from "@/store/quote-store";
import { useConfigStore } from "@/store/config-store";
import { getSpreadForSymbol } from "@/lib/aggregator";
import { formatPrice, formatBps } from "@/lib/utils";

export function BestQuoteCard({ symbol }: { symbol: string }) {
  const quotesForSymbol = useQuoteStore((s) => s.quotes[symbol] ?? EMPTY_QUOTES);
  const maxAgeSec = useConfigStore((s) => s.config.settings.maxQuoteAgeSec);

  const spread = getSpreadForSymbol(quotesForSymbol, maxAgeSec);

  if (!spread) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">{symbol}</h3>
        <p className="text-xs text-[var(--muted-foreground)]">Waiting for data...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3">{symbol}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Best Bid</div>
          <div className="text-lg font-mono font-bold text-[var(--green)]">
            {formatPrice(spread.bestBid.price)}
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">{spread.bestBid.exchange}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--muted-foreground)] mb-1">Best Ask</div>
          <div className="text-lg font-mono font-bold text-[var(--red)]">
            {formatPrice(spread.bestAsk.price)}
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">{spread.bestAsk.exchange}</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-[var(--muted-foreground)]">Midpoint</span>
          <div className="font-mono">{formatPrice(spread.midpoint)}</div>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">Spread</span>
          <div className="font-mono">${spread.notionalSpread.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">Spread BPS</span>
          <div className="font-mono">{formatBps(spread.spreadBps)}</div>
        </div>
      </div>
    </div>
  );
}
