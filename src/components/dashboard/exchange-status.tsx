"use client";

import { useQuoteStore } from "@/store/quote-store";

export function ExchangeStatus() {
  const statuses = useQuoteStore((s) => s.adapterStatuses);

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(statuses).map((status) => (
        <div
          key={status.exchange}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
          style={{
            borderColor: status.connected ? "#22c55e40" : "#ef444440",
            backgroundColor: status.connected ? "#22c55e10" : "#ef444410",
            color: status.connected ? "#22c55e" : "#ef4444",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: status.connected ? "#22c55e" : "#ef4444" }}
          />
          {status.exchange}
          {status.reconnectCount > 0 && !status.connected && (
            <span className="text-[10px] opacity-70">
              (retry {status.reconnectCount})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
