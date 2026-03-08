import { BaseAdapter } from "./base";
import type { ExchangeConfig, Quote } from "./types";

export class BinanceAdapter extends BaseAdapter {
  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    super("Binance", config, settings);
  }

  protected buildUrl(): string {
    const streams = Object.keys(this.symbolMap)
      .map((raw) => `${raw}@bookTicker`)
      .join("/");
    return `${this.config.url}?streams=${streams}`;
  }

  protected buildSubscribeMessage(): unknown | null {
    return null; // Binance uses URL-based subscription
  }

  protected parseMessage(data: unknown): Quote | null {
    const msg = data as { data?: { s?: string; b?: string; a?: string; B?: string; A?: string } };
    const payload = msg.data;
    if (!payload?.s) return null;

    const raw = payload.s.toLowerCase();
    const symbol = this.symbolMap[raw];
    if (!symbol) return null;

    return {
      exchange: this.name,
      symbol,
      bid: parseFloat(payload.b!),
      ask: parseFloat(payload.a!),
      bidSize: payload.B ? parseFloat(payload.B) : undefined,
      askSize: payload.A ? parseFloat(payload.A) : undefined,
      timestamp: Date.now(),
    };
  }
}
