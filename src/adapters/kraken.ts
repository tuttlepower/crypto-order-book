import { BaseAdapter } from "./base";
import type { ExchangeConfig, Quote } from "./types";

export class KrakenAdapter extends BaseAdapter {
  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    super("Kraken", config, settings);
  }

  protected buildUrl(): string {
    return this.config.url;
  }

  protected buildSubscribeMessage(): unknown {
    return {
      event: "subscribe",
      pair: Object.keys(this.symbolMap),
      subscription: { name: "ticker" },
    };
  }

  protected parseMessage(data: unknown): Quote | null {
    // Kraken sends array-format messages: [channelID, tickerData, channelName, pair]
    if (!Array.isArray(data) || data.length < 4 || typeof data[1] !== "object") {
      return null;
    }

    const tickerData = data[1] as { b?: [string, ...unknown[]]; a?: [string, ...unknown[]] };
    const rawPair = data[data.length - 1] as string;

    if (!tickerData.a || !tickerData.b) return null;

    const symbol = this.symbolMap[rawPair];
    if (!symbol) return null;

    return {
      exchange: this.name,
      symbol,
      bid: parseFloat(tickerData.b[0]),
      ask: parseFloat(tickerData.a[0]),
      timestamp: Date.now(),
    };
  }
}
