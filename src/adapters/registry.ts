import type { AppConfig, ExchangeAdapter } from "./types";
import { BinanceAdapter } from "./binance";
import { CoinbaseAdapter } from "./coinbase";
import { KrakenAdapter } from "./kraken";
import { OKXAdapter } from "./okx";
import { BybitAdapter } from "./bybit";
import { GeminiAdapter } from "./gemini";
import { CryptoComAdapter } from "./crypto-com";

type AdapterConstructor = new (
  config: { enabled: boolean; url: string; symbols: Record<string, string> },
  settings: { reconnectBaseMs: number; reconnectMaxMs: number; heartbeatIntervalMs: number }
) => ExchangeAdapter;

const ADAPTER_MAP: Record<string, AdapterConstructor> = {
  binance: BinanceAdapter as unknown as AdapterConstructor,
  coinbase: CoinbaseAdapter as unknown as AdapterConstructor,
  kraken: KrakenAdapter as unknown as AdapterConstructor,
  okx: OKXAdapter as unknown as AdapterConstructor,
  bybit: BybitAdapter as unknown as AdapterConstructor,
  gemini: GeminiAdapter as unknown as AdapterConstructor,
  crypto_com: CryptoComAdapter as unknown as AdapterConstructor,
};

export function createAdapters(config: AppConfig): Map<string, ExchangeAdapter> {
  const adapters = new Map<string, ExchangeAdapter>();
  const settings = {
    reconnectBaseMs: config.settings.reconnectBaseMs,
    reconnectMaxMs: config.settings.reconnectMaxMs,
    heartbeatIntervalMs: config.settings.heartbeatIntervalMs,
  };

  for (const [name, exchangeConfig] of Object.entries(config.exchanges)) {
    if (!exchangeConfig.enabled) continue;
    const Ctor = ADAPTER_MAP[name];
    if (!Ctor) continue;
    adapters.set(name, new Ctor(exchangeConfig, settings));
  }

  return adapters;
}
