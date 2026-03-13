import { NextRequest } from "next/server";
import { getQuote, getFinancials, getROEHistory } from "@/lib/yahoo-finance";
import { evaluateBuffett7Principles } from "@/lib/buffett-7-principles";

// 分析対象の主要銘柄リスト（グローバル）
const SCREENER_UNIVERSE = [
  // 米国テクノロジー
  "AAPL", "NVDA", "MSFT", "GOOGL", "META", "AMZN", "TSLA", "CRM", "ADBE",
  // 米国金融・決済
  "V", "MA", "BRK-B", "JPM", "BAC",
  // 米国ヘルスケア・消費
  "JNJ", "UNH", "WMT", "COST", "HD",
  // 欧州
  "ASML", "LVMH.PA", "NVO",
  // 日本
  "7203.T", "9984.T", "6758.T", "7974.T",
  // 半導体・台湾韓国
  "TSM", "005930.KS",
];

function calcIntrinsicValue(price: number, trailingPE?: number, earningsGrowth?: number): number {
  const pe = trailingPE || 15;
  const eps = price / pe;
  const g = Math.min((earningsGrowth ?? 5) / 100, 0.25);
  const graham = eps * (8.5 + 2 * g * 100) * (4.4 / 5);
  let dcf = 0;
  for (let i = 1; i <= 10; i++) dcf += (eps * Math.pow(1 + g, i)) / Math.pow(1.1, i);
  dcf += (eps * Math.pow(1 + g, 10) * 12) / Math.pow(1.1, 10);
  return (graham + dcf) / 2;
}

interface ScreenerStockResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  sector?: string;
  pe?: number;
  intrinsicValue: number;
  buffettAnalysis: ReturnType<typeof evaluateBuffett7Principles>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const minScore = Number(searchParams.get("minScore") ?? "0");
  const signalFilter = searchParams.get("signal") ?? "ALL"; // BUY|HOLD|PASS|ALL
  const minTenBagger = Number(searchParams.get("minTenBagger") ?? "0");

  try {
    const results = await Promise.allSettled(
      SCREENER_UNIVERSE.map(async (symbol): Promise<ScreenerStockResult | null> => {
        const [quote, financials, roeHistory] = await Promise.all([
          getQuote(symbol),
          getFinancials(symbol),
          getROEHistory(symbol),
        ]);
        if (!quote) return null;

        const price = quote.regularMarketPrice ?? 0;
        const safeFinancials = financials || { symbol };
        const intrinsicValue = calcIntrinsicValue(price, quote.trailingPE, safeFinancials.earningsGrowth);
        const analysis = evaluateBuffett7Principles(quote, safeFinancials, roeHistory, intrinsicValue);

        return {
          symbol,
          name: quote.longName || quote.shortName || symbol,
          price,
          change: quote.regularMarketChange ?? 0,
          changePercent: quote.regularMarketChangePercent ?? 0,
          marketCap: quote.marketCap ?? 0,
          sector: quote.sector,
          pe: quote.trailingPE,
          intrinsicValue,
          buffettAnalysis: analysis,
        };
      })
    );

    let stocks: ScreenerStockResult[] = results
      .filter((r): r is PromiseFulfilledResult<ScreenerStockResult> =>
        r.status === "fulfilled" && r.value !== null
      )
      .map((r) => r.value)
      .filter((v): v is ScreenerStockResult => v !== null);

    // フィルタリング
    if (minScore > 0) stocks = stocks.filter((s) => s.buffettAnalysis.totalScore >= minScore);
    if (signalFilter !== "ALL") stocks = stocks.filter((s) => s.buffettAnalysis.signal === signalFilter);
    if (minTenBagger > 0) stocks = stocks.filter((s) => s.buffettAnalysis.tenBaggerProbability >= minTenBagger);

    // 総合スコア降順ソート
    stocks.sort((a, b) => b.buffettAnalysis.totalScore - a.buffettAnalysis.totalScore);

    return Response.json({ success: true, data: stocks, count: stocks.length, timestamp: new Date().toISOString() });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
