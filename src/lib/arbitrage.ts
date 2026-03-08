import type { ArbOpportunity, FeeConfig, Quote } from "@/adapters/types";
import { getBestAsk, getBestBid, getFreshQuotes } from "./aggregator";

const EXCHANGE_KEY_MAP: Record<string, string> = {
  Binance: "binance",
  Coinbase: "coinbase",
  Kraken: "kraken",
  OKX: "okx",
  Bybit: "bybit",
  Gemini: "gemini",
  "Crypto.com": "crypto_com",
};

export function detectArbitrage(
  quotesForSymbol: Record<string, Quote>,
  fees: Record<string, FeeConfig>,
  maxAgeSec: number,
  slippageBuffer: number,
  arbThreshold: number
): ArbOpportunity | null {
  const fresh = getFreshQuotes(quotesForSymbol, maxAgeSec);
  if (fresh.length < 2) return null;

  const bestBid = getBestBid(fresh);
  const bestAsk = getBestAsk(fresh);
  if (!bestBid || !bestAsk) return null;

  // Arb only exists if best bid > best ask (cross-exchange)
  if (bestBid.exchange === bestAsk.exchange) return null;

  const rawSpread = bestBid.bid - bestAsk.ask;
  if (rawSpread <= 0) return null;

  const sellFeeKey = EXCHANGE_KEY_MAP[bestBid.exchange] || bestBid.exchange.toLowerCase();
  const buyFeeKey = EXCHANGE_KEY_MAP[bestAsk.exchange] || bestAsk.exchange.toLowerCase();

  const sellFee = fees[sellFeeKey]?.taker || 0;
  const buyFee = fees[buyFeeKey]?.taker || 0;

  const netEdge =
    rawSpread -
    bestAsk.ask * buyFee -
    bestBid.bid * sellFee -
    slippageBuffer * bestAsk.ask;

  if (netEdge <= arbThreshold * bestAsk.ask) return null;

  const midpoint = (bestBid.bid + bestAsk.ask) / 2;
  const netEdgeBps = midpoint > 0 ? (netEdge / midpoint) * 10_000 : 0;

  return {
    symbol: bestBid.symbol,
    buyExchange: bestAsk.exchange,
    sellExchange: bestBid.exchange,
    buyPrice: bestAsk.ask,
    sellPrice: bestBid.bid,
    rawSpread,
    netEdge,
    netEdgeBps,
    timestamp: Date.now(),
  };
}
