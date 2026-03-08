import { BaseAdapter } from "./base";
import type { ExchangeConfig, Quote } from "./types";

export class BybitAdapter extends BaseAdapter {
  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    super("Bybit", config, settings);
  }

  protected buildUrl(): string {
    return this.config.url;
  }

  protected buildSubscribeMessage(): unknown {
    return {
      op: "subscribe",
      args: Object.keys(this.symbolMap).map((s) => `orderbook.1.${s}`),
    };
  }

  protected parseMessage(data: unknown): Quote | null {
    const msg = data as {
      topic?: string;
      data?: { b?: string[][]; a?: string[][] };
    };

    if (!msg.topic?.startsWith("orderbook.1.")) return null;

    const raw = msg.topic.split(".")[2];
    const symbol = this.symbolMap[raw];
    if (!symbol) return null;

    const bids = msg.data?.b;
    const asks = msg.data?.a;
    if (!bids?.length || !asks?.length) return null;

    return {
      exchange: this.name,
      symbol,
      bid: parseFloat(bids[0][0]),
      ask: parseFloat(asks[0][0]),
      bidSize: parseFloat(bids[0][1]),
      askSize: parseFloat(asks[0][1]),
      timestamp: Date.now(),
    };
  }
}
