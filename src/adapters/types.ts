export interface Quote {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  bidSize?: number;
  askSize?: number;
  timestamp: number;
}

export interface ExchangeConfig {
  enabled: boolean;
  url: string;
  symbols: Record<string, string>;
}

export interface FeeConfig {
  maker: number;
  taker: number;
}

export type QuoteCallback = (quote: Quote) => void;

export interface ExchangeAdapter {
  readonly name: string;
  connect(onQuote: QuoteCallback): void;
  disconnect(): void;
  isConnected(): boolean;
  getStatus(): AdapterStatus;
}

export interface AdapterStatus {
  exchange: string;
  connected: boolean;
  lastMessageAt: number | null;
  reconnectCount: number;
  error: string | null;
}

export interface SpreadInfo {
  symbol: string;
  bestBid: { price: number; exchange: string };
  bestAsk: { price: number; exchange: string };
  midpoint: number;
  notionalSpread: number;
  spreadBps: number;
}

export interface ArbOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  rawSpread: number;
  netEdge: number;
  netEdgeBps: number;
  timestamp: number;
}

export interface AppConfig {
  exchanges: Record<string, ExchangeConfig>;
  fees: Record<string, FeeConfig>;
  settings: {
    maxQuoteAgeSec: number;
    slippageBuffer: number;
    arbThreshold: number;
    reconnectBaseMs: number;
    reconnectMaxMs: number;
    heartbeatIntervalMs: number;
  };
}
