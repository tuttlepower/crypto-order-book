import { BaseAdapter } from "./base";
import type { ExchangeConfig, Quote } from "./types";

export class OKXAdapter extends BaseAdapter {
  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    super("OKX", config, settings);
  }

  protected buildUrl(): string {
    return this.config.url;
  }

  protected buildSubscribeMessage(): unknown {
    return {
      op: "subscribe",
      args: Object.keys(this.symbolMap).map((instId) => ({
        channel: "books5",
        instId,
      })),
    };
  }

  protected parseMessage(data: unknown): Quote | null {
    const msg = data as {
      arg?: { instId?: string };
      data?: Array<{ bids?: string[][]; asks?: string[][] }>;
    };

    if (!msg.data || !msg.arg?.instId) return null;

    const raw = msg.arg.instId;
    const symbol = this.symbolMap[raw];
    if (!symbol) return null;

    const book = msg.data[0];
    if (!book?.bids?.length || !book?.asks?.length) return null;

    return {
      exchange: this.name,
      symbol,
      bid: parseFloat(book.bids[0][0]),
      ask: parseFloat(book.asks[0][0]),
      bidSize: parseFloat(book.bids[0][1]),
      askSize: parseFloat(book.asks[0][1]),
      timestamp: Date.now(),
    };
  }
}
