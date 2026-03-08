"use client";

import { useWebSocketFeeds } from "@/hooks/use-websocket-feeds";
import { useConfigStore, getSymbols } from "@/store/config-store";
import { ExchangeStatus } from "@/components/dashboard/exchange-status";
import { BestQuoteCard } from "@/components/dashboard/best-quote-card";
import { QuoteTable } from "@/components/dashboard/quote-table";
import { ArbAlert } from "@/components/dashboard/arb-alert";
import { SpreadChart } from "@/components/dashboard/spread-chart";
import { SymbolSelector } from "@/components/dashboard/symbol-selector";

export default function Dashboard() {
  useWebSocketFeeds();

  const config = useConfigStore((s) => s.config);
  const symbols = getSymbols(config);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Crypto Order Book</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Real-time cross-exchange price aggregation
          </p>
        </div>
        <ExchangeStatus />
      </div>

      {/* Symbol Selector */}
      <div className="mb-4">
        <SymbolSelector />
      </div>

      {/* Best Quotes + Arb Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {symbols.map((symbol) => (
            <BestQuoteCard key={symbol} symbol={symbol} />
          ))}
        </div>
        <div>
          <ArbAlert />
        </div>
      </div>

      {/* Quote Table */}
      <div className="mb-4">
        <QuoteTable />
      </div>

      {/* Spread Chart */}
      <SpreadChart />
    </div>
  );
}
