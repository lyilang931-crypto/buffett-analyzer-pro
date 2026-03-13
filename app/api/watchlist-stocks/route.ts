import { NextRequest } from "next/server";
import { getQuote, getFinancials, getROEHistory } from "@/lib/yahoo-finance";
import { evaluateBuffett7Principles, Buffett7PrinciplesResult } from "@/lib/buffett-7-principles";

function calcIntrinsicValue(price: number, pe?: number, eg?: number) {
  const safepe = pe || 15;
  const eps = price / safepe;
  const g = Math.min((eg ?? 5) / 100, 0.25);
  const graham = eps * (8.5 + 2 * g * 100) * (4.4 / 5);
  let dcf = 0;
  for (let i = 1; i <= 10; i++) dcf += (eps * Math.pow(1+g,i)) / Math.pow(1.1,i);
  dcf += (eps * Math.pow(1+g,10) * 12) / Math.pow(1.1,10);
  return (graham + dcf) / 2;
}

function calcTarget1yr(price: number, pe?: number, eg?: number) {
  if (!price) return null;
  const safepe = pe || 15;
  const eps = price / safepe;
  const base = Math.min(Math.max((eg ?? 5)/100, -0.1), 0.3);
  const conservative = Math.max(base * 0.5, 0.02);
  const optimistic = Math.min(base * 1.5, 0.4);
  const futurePE = (r: number) => Math.max(12, safepe * Math.pow(0.95, r * 3));
  const project = (r: number) => Math.round(eps * (1+r) * futurePE(r));
  return { conservative: project(conservative), base: project(base), optimistic: project(optimistic) };
}

interface WatchlistStockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  exchange: string;
  sector?: string;
  pe?: number;
  buffettAnalysis: Buffett7PrinciplesResult;
  priceTarget1yr: { conservative: number; base: number; optimistic: number } | null;
}

export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols") ?? "AAPL,NVDA,MSFT,GOOGL,V";
  const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 10);

  const results = await Promise.allSettled(symbols.map(async (symbol): Promise<WatchlistStockData | null> => {
    const [quote, financials, roeHistory] = await Promise.all([
      getQuote(symbol), getFinancials(symbol), getROEHistory(symbol),
    ]);
    if (!quote) return null;
    const price = quote.regularMarketPrice ?? 0;
    const fin = financials || { symbol };
    const iv = calcIntrinsicValue(price, quote.trailingPE, fin.earningsGrowth);
    const analysis = evaluateBuffett7Principles(quote, fin, roeHistory, iv);
    return {
      symbol, name: quote.longName || quote.shortName || symbol,
      price, change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      marketCap: quote.marketCap ?? 0,
      exchange: quote.exchange ?? "", sector: quote.sector, pe: quote.trailingPE,
      buffettAnalysis: analysis,
      priceTarget1yr: calcTarget1yr(price, quote.trailingPE, fin.earningsGrowth),
    };
  }));

  const data: WatchlistStockData[] = results
    .filter((r): r is PromiseFulfilledResult<WatchlistStockData> =>
      r.status === "fulfilled" && r.value !== null
    )
    .map(r => r.value)
    .sort((a, b) => b.buffettAnalysis.totalScore - a.buffettAnalysis.totalScore);

  return Response.json({ success: true, data });
}
