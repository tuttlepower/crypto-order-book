import type { AdapterStatus, ExchangeConfig, Quote, QuoteCallback } from "./types";

/**
 * Gemini requires a separate WebSocket connection per symbol.
 * Unlike other adapters that extend BaseAdapter, this manages multiple connections.
 */
export class GeminiAdapter {
  readonly name = "Gemini";
  private config: ExchangeConfig;
  private symbolMap: Record<string, string>;
  private connections: Map<string, WebSocket> = new Map();
  private orderBooks: Map<string, { bid: Map<number, number>; ask: Map<number, number> }> = new Map();
  private onQuote: QuoteCallback | null = null;
  private connected = false;
  private lastMessageAt: number | null = null;
  private reconnectCount = 0;
  private error: string | null = null;
  private destroyed = false;
  private settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number };
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(config: ExchangeConfig, settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }) {
    this.config = config;
    this.symbolMap = config.symbols;
    this.settings = settings;
  }

  connect(onQuote: QuoteCallback): void {
    this.onQuote = onQuote;
    this.destroyed = false;
    for (const [raw, symbol] of Object.entries(this.symbolMap)) {
      this.connectSymbol(raw, symbol);
    }
  }

  disconnect(): void {
    this.destroyed = true;
    for (const timer of this.reconnectTimers.values()) clearTimeout(timer);
    this.reconnectTimers.clear();
    for (const ws of this.connections.values()) {
      ws.onclose = null;
      ws.close();
    }
    this.connections.clear();
    this.orderBooks.clear();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getStatus(): AdapterStatus {
    return {
      exchange: this.name,
      connected: this.connected,
      lastMessageAt: this.lastMessageAt,
      reconnectCount: this.reconnectCount,
      error: this.error,
    };
  }

  private connectSymbol(raw: string, symbol: string): void {
    if (this.destroyed) return;

    const url = `${this.config.url}/${raw}`;
    const ws = new WebSocket(url);
    this.connections.set(raw, ws);
    this.orderBooks.set(symbol, { bid: new Map(), ask: new Map() });

    ws.onopen = () => {
      this.connected = true;
      this.error = null;
    };

    ws.onmessage = (event) => {
      this.lastMessageAt = Date.now();
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string;
          events?: Array<{ side?: string; price?: string; remaining?: string }>;
        };

        if (data.type !== "update" || !data.events) return;

        const book = this.orderBooks.get(symbol);
        if (!book) return;

        for (const evt of data.events) {
          if (!evt.side || !evt.price) continue;
          const side = evt.side as "bid" | "ask";
          const price = parseFloat(evt.price);
          const remaining = parseFloat(evt.remaining || "0");

          if (side in book) {
            if (remaining === 0) {
              book[side].delete(price);
            } else {
              book[side].set(price, remaining);
            }
          }
        }

        if (book.bid.size > 0 && book.ask.size > 0) {
          const bestBid = Math.max(...book.bid.keys());
          const bestAsk = Math.min(...book.ask.keys());

          if (bestBid < bestAsk && this.onQuote) {
            this.onQuote({
              exchange: this.name,
              symbol,
              bid: bestBid,
              ask: bestAsk,
              timestamp: Date.now(),
            });
          }
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      this.connections.delete(raw);
      if (this.connections.size === 0) this.connected = false;
      if (!this.destroyed) {
        const delay = Math.min(
          this.settings.reconnectBaseMs * Math.pow(2, this.reconnectCount),
          this.settings.reconnectMaxMs
        );
        this.reconnectCount++;
        const timer = setTimeout(() => this.connectSymbol(raw, symbol), delay);
        this.reconnectTimers.set(raw, timer);
      }
    };

    ws.onerror = () => {
      this.error = `WebSocket error on Gemini/${raw}`;
    };
  }
}
