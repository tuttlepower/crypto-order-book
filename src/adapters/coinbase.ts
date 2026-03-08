import { BaseAdapter } from "./base";
import type { ExchangeConfig, Quote } from "./types";

export class CoinbaseAdapter extends BaseAdapter {
  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    super("Coinbase", config, settings);
  }

  protected buildUrl(): string {
    return this.config.url;
  }

  protected buildSubscribeMessage(): unknown {
    return {
      type: "subscribe",
      channel: "ticker",
      product_ids: Object.values(this.symbolMap),
    };
  }

  protected parseMessage(data: unknown): Quote[] | null {
    const msg = data as {
      events?: Array<{
        tickers?: Array<{
          type?: string;
          product_id?: string;
          best_bid?: string;
          best_ask?: string;
          best_bid_quantity?: string;
          best_ask_quantity?: string;
        }>;
      }>;
    };

    if (!msg.events) return null;
    const quotes: Quote[] = [];

    for (const event of msg.events) {
      if (!event.tickers) continue;
      for (const ticker of event.tickers) {
        if (ticker.type !== "ticker" || !ticker.product_id) continue;

        const normalizedValues = Object.values(this.symbolMap);
        if (!normalizedValues.includes(ticker.product_id)) continue;

        quotes.push({
          exchange: this.name,
          symbol: ticker.product_id,
          bid: parseFloat(ticker.best_bid!),
          ask: parseFloat(ticker.best_ask!),
          bidSize: ticker.best_bid_quantity ? parseFloat(ticker.best_bid_quantity) : undefined,
          askSize: ticker.best_ask_quantity ? parseFloat(ticker.best_ask_quantity) : undefined,
          timestamp: Date.now(),
        });
      }
    }

    return quotes.length > 0 ? quotes : null;
  }
}
