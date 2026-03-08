import type { AdapterStatus, ExchangeConfig, Quote, QuoteCallback } from "./types";

export abstract class BaseAdapter {
  readonly name: string;
  protected config: ExchangeConfig;
  protected symbolMap: Record<string, string>;
  protected reverseMap: Record<string, string>;
  protected ws: WebSocket | null = null;
  protected onQuote: QuoteCallback | null = null;
  protected connected = false;
  protected lastMessageAt: number | null = null;
  protected reconnectCount = 0;
  protected error: string | null = null;
  protected reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  protected heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  protected destroyed = false;

  private reconnectBaseMs: number;
  private reconnectMaxMs: number;
  private heartbeatIntervalMs: number;

  constructor(
    name: string,
    config: ExchangeConfig,
    settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }
  ) {
    this.name = name;
    this.config = config;
    this.symbolMap = config.symbols;
    this.reverseMap = Object.fromEntries(
      Object.entries(config.symbols).map(([k, v]) => [v, k])
    );
    this.reconnectBaseMs = settings.reconnectBaseMs;
    this.reconnectMaxMs = settings.reconnectMaxMs;
    this.heartbeatIntervalMs = settings.heartbeatIntervalMs;
  }

  connect(onQuote: QuoteCallback): void {
    this.onQuote = onQuote;
    this.destroyed = false;
    this.doConnect();
  }

  disconnect(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
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

  protected doConnect(): void {
    if (this.destroyed) return;

    const url = this.buildUrl();
    try {
      this.ws = new WebSocket(url);
    } catch (e) {
      this.error = `Failed to create WebSocket: ${e}`;
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      this.error = null;
      this.reconnectCount = 0;
      this.startHeartbeat();

      const subMsg = this.buildSubscribeMessage();
      if (subMsg && this.ws) {
        this.ws.send(JSON.stringify(subMsg));
      }
    };

    this.ws.onmessage = (event) => {
      this.lastMessageAt = Date.now();
      try {
        const data = JSON.parse(event.data as string);
        const quotes = this.parseMessage(data);
        if (quotes && this.onQuote) {
          for (const q of Array.isArray(quotes) ? quotes : [quotes]) {
            this.onQuote(q);
          }
        }
      } catch {
        // Ignore parse errors for non-data messages
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      if (!this.destroyed) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.error = `WebSocket error on ${this.name}`;
      this.connected = false;
    };
  }

  private scheduleReconnect(): void {
    if (this.destroyed) return;
    const delay = Math.min(
      this.reconnectBaseMs * Math.pow(2, this.reconnectCount),
      this.reconnectMaxMs
    );
    this.reconnectCount++;
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.lastMessageAt && Date.now() - this.lastMessageAt > this.heartbeatIntervalMs) {
        // No message in too long, reconnect
        if (this.ws) {
          this.ws.close();
        }
      }
    }, this.heartbeatIntervalMs / 2);
  }

  protected abstract buildUrl(): string;
  protected abstract buildSubscribeMessage(): unknown | null;
  protected abstract parseMessage(data: unknown): Quote | Quote[] | null;
}
