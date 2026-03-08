import { BaseAdapter } from "./base";
import type { ExchangeConfig, Quote } from "./types";

export class CryptoComAdapter extends BaseAdapter {
  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    super("Crypto.com", config, settings);
  }

  protected buildUrl(): string {
    return this.config.url;
  }

  protected buildSubscribeMessage(): unknown {
    return {
      id: 1,
      method: "subscribe",
      params: {
        channels: Object.keys(this.symbolMap).map((raw) => `book.${raw.toUpperCase()}.150`),
      },
    };
  }

  protected parseMessage(data: unknown): Quote | null {
    const msg = data as {
      result?: {
        instrument_name?: string;
        data?: Array<{ bids?: string[][]; asks?: string[][] }>;
      };
    };

    if (!msg.result?.data) return null;

    const rawSymbol = msg.result.instrument_name?.toLowerCase();
    if (!rawSymbol) return null;

    const symbol = this.symbolMap[rawSymbol];
    if (!symbol) return null;

    const bookEntries = msg.result.data;
    if (!Array.isArray(bookEntries) || bookEntries.length === 0) return null;

    const book = bookEntries[0];
    if (!book.bids?.length || !book.asks?.length) return null;

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
