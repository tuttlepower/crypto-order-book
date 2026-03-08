"use client";

import { useQuoteStore, EMPTY_QUOTES } from "@/store/quote-store";
import { useConfigStore } from "@/store/config-store";
import { useQuoteAge } from "@/hooks/use-quote-age";
import { getAllExchangeQuotes, getBestAsk, getBestBid, getFreshQuotes } from "@/lib/aggregator";
import { formatPrice, formatBps, formatAge } from "@/lib/utils";

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group cursor-help inline-flex items-center gap-1 justify-end">
      {children}
      <svg className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2.5a1 1 0 110 2 1 1 0 010-2zM6.5 7h2v4.5h-2V7z" />
      </svg>
      <span className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 text-[10px] font-normal text-[var(--foreground)] bg-[var(--muted)] border border-[var(--border)] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {text}
      </span>
    </span>
  );
}

export function QuoteTable() {
  const selectedSymbol = useConfigStore((s) => s.selectedSymbol);
  const quotesForSymbol = useQuoteStore((s) => s.quotes[selectedSymbol] ?? EMPTY_QUOTES);
  const fees = useConfigStore((s) => s.config.fees);
  const maxAgeSec = useConfigStore((s) => s.config.settings.maxQuoteAgeSec);
  const ages = useQuoteAge(selectedSymbol);

  const enriched = getAllExchangeQuotes(quotesForSymbol, fees, maxAgeSec);
  const fresh = getFreshQuotes(quotesForSymbol, maxAgeSec);
  const bestBid = getBestBid(fresh);
  const bestAsk = getBestAsk(fresh);

  if (enriched.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
        Connecting to exchanges...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] text-xs">
            <th className="text-left p-3 font-medium">Exchange</th>
            <th className="text-right p-3 font-medium">Bid</th>
            <th className="text-right p-3 font-medium">Ask</th>
            <th className="text-right p-3 font-medium">Spread (bps)</th>
            <th className="text-right p-3 font-medium">
              <Tooltip text="Bid after taker fee: bid × (1 - fee)">Eff. Bid</Tooltip>
            </th>
            <th className="text-right p-3 font-medium">
              <Tooltip text="Ask after taker fee: ask × (1 + fee)">Eff. Ask</Tooltip>
            </th>
            <th className="text-right p-3 font-medium">Age</th>
          </tr>
        </thead>
        <tbody>
          {enriched
            .sort((a, b) => b.bid - a.bid)
            .map((q) => {
              const isBestBid = bestBid?.exchange === q.exchange;
              const isBestAsk = bestAsk?.exchange === q.exchange;
              const age = ages[q.exchange] || 0;
              const isStale = age >= maxAgeSec;

              return (
                <tr
                  key={q.exchange}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    isStale ? "opacity-40" : ""
                  }`}
                >
                  <td className="p-3 font-medium">{q.exchange}</td>
                  <td
                    className={`p-3 text-right font-mono ${
                      isBestBid ? "text-[var(--green)] font-bold" : ""
                    }`}
                  >
                    {formatPrice(q.bid)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono ${
                      isBestAsk ? "text-[var(--red)] font-bold" : ""
                    }`}
                  >
                    {formatPrice(q.ask)}
                  </td>
                  <td className="p-3 text-right font-mono">{formatBps(q.spreadBps)}</td>
                  <td className="p-3 text-right font-mono text-[var(--muted-foreground)]">
                    {formatPrice(q.effectiveBid)}
                  </td>
                  <td className="p-3 text-right font-mono text-[var(--muted-foreground)]">
                    {formatPrice(q.effectiveAsk)}
                  </td>
                  <td
                    className={`p-3 text-right font-mono text-xs ${
                      isStale
                        ? "text-[var(--red)]"
                        : age > maxAgeSec / 2
                        ? "text-[var(--yellow)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {formatAge(age)}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
