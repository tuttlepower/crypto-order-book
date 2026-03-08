import type { FeeConfig, Quote, SpreadInfo } from "@/adapters/types";

export function getFreshQuotes(
  quotes: Record<string, Quote>,
  maxAgeSec: number
): Quote[] {
  const now = Date.now();
  return Object.values(quotes).filter(
    (q) => (now - q.timestamp) / 1000 < maxAgeSec
  );
}

export function getBestBid(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((best, q) => (q.bid > best.bid ? q : best));
}

export function getBestAsk(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((best, q) => (q.ask < best.ask ? q : best));
}

export function computeSpread(
  bestBid: Quote,
  bestAsk: Quote,
  symbol: string
): SpreadInfo {
  const midpoint = (bestBid.bid + bestAsk.ask) / 2;
  const notionalSpread = bestAsk.ask - bestBid.bid;
  const spreadBps = midpoint > 0 ? (notionalSpread / midpoint) * 10_000 : 0;

  return {
    symbol,
    bestBid: { price: bestBid.bid, exchange: bestBid.exchange },
    bestAsk: { price: bestAsk.ask, exchange: bestAsk.exchange },
    midpoint,
    notionalSpread,
    spreadBps,
  };
}

export function enrichQuote(
  quote: Quote,
  takerFee: number
): {
  effectiveBid: number;
  effectiveAsk: number;
  midpoint: number;
  notionalSpread: number;
  spreadBps: number;
} {
  const effectiveBid = quote.bid * (1 - takerFee);
  const effectiveAsk = quote.ask * (1 + takerFee);
  const midpoint = (quote.bid + quote.ask) / 2;
  const notionalSpread = quote.ask - quote.bid;
  const spreadBps = midpoint > 0 ? (notionalSpread / midpoint) * 10_000 : 0;

  return { effectiveBid, effectiveAsk, midpoint, notionalSpread, spreadBps };
}

export function getSpreadForSymbol(
  quotesForSymbol: Record<string, Quote>,
  maxAgeSec: number
): SpreadInfo | null {
  const fresh = getFreshQuotes(quotesForSymbol, maxAgeSec);
  const bestBid = getBestBid(fresh);
  const bestAsk = getBestAsk(fresh);
  if (!bestBid || !bestAsk) return null;
  return computeSpread(bestBid, bestAsk, bestBid.symbol);
}

export function getAllExchangeQuotes(
  quotesForSymbol: Record<string, Quote>,
  fees: Record<string, FeeConfig>,
  maxAgeSec: number
): Array<Quote & { effectiveBid: number; effectiveAsk: number; spreadBps: number; stale: boolean }> {
  const now = Date.now();
  return Object.values(quotesForSymbol).map((q) => {
    const exchangeKey = Object.entries({
      Binance: "binance",
      Coinbase: "coinbase",
      Kraken: "kraken",
      OKX: "okx",
      Bybit: "bybit",
      Gemini: "gemini",
      "Crypto.com": "crypto_com",
    }).find(([k]) => k === q.exchange)?.[1] || q.exchange.toLowerCase();

    const fee = fees[exchangeKey]?.taker || 0;
    const midpoint = (q.bid + q.ask) / 2;
    const spreadBps = midpoint > 0 ? ((q.ask - q.bid) / midpoint) * 10_000 : 0;

    return {
      ...q,
      effectiveBid: q.bid * (1 - fee),
      effectiveAsk: q.ask * (1 + fee),
      spreadBps,
      stale: (now - q.timestamp) / 1000 >= maxAgeSec,
    };
  });
}
