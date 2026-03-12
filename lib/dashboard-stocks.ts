import { getQuote, getFinancials, getROEHistory } from "./yahoo-finance";
import { evaluateBuffett7Principles, Buffett7PrinciplesResult } from "./buffett-7-principles";

// ダッシュボードに表示する銘柄リスト（カスタマイズ可能）
const DASHBOARD_SYMBOLS = ["AAPL", "NVDA", "MSFT", "GOOGL", "V"];

export interface DashboardStock {
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
  priceTarget1yr: {
    conservative: number;
    base: number;
    optimistic: number;
  } | null;
}

function calcIntrinsicValue(
  price: number,
  trailingPE: number | undefined,
  earningsGrowth: number | undefined
): number {
  const pe = trailingPE || 15;
  const eps = price / pe;
  const g = Math.min((earningsGrowth ?? 5) / 100, 0.25);
  const graham = eps * (8.5 + 2 * g * 100) * (4.4 / 5);
  let dcf = 0;
  for (let i = 1; i <= 10; i++) {
    dcf += (eps * Math.pow(1 + g, i)) / Math.pow(1.1, i);
  }
  dcf += (eps * Math.pow(1 + g, 10) * 12) / Math.pow(1.1, 10);
  return (graham + dcf) / 2;
}

function calcPriceTarget1yr(
  price: number,
  trailingPE: number | undefined,
  earningsGrowth: number | undefined
) {
  if (price <= 0) return null;
  const pe = trailingPE || 15;
  const eps = price / pe;
  const base = Math.min(Math.max((earningsGrowth ?? 5) / 100, -0.1), 0.3);
  const conservative = Math.max(base * 0.5, 0.02);
  const optimistic = Math.min(base * 1.5, 0.4);
  const futurePE = (r: number) => Math.max(12, pe * Math.pow(0.95, r * 3));
  const project = (r: number) => Math.round(eps * (1 + r) * futurePE(r));
  return {
    conservative: project(conservative),
    base: project(base),
    optimistic: project(optimistic),
  };
}

export async function getDashboardStocks(): Promise<DashboardStock[]> {
  const results = await Promise.allSettled(
    DASHBOARD_SYMBOLS.map(async (symbol) => {
      const [quote, financials, roeHistory] = await Promise.all([
        getQuote(symbol),
        getFinancials(symbol),
        getROEHistory(symbol),
      ]);

      if (!quote) return null;

      const safeFinancials = financials || { symbol };
      const price = quote.regularMarketPrice ?? 0;
      const intrinsicValue = calcIntrinsicValue(
        price,
        quote.trailingPE,
        safeFinancials.earningsGrowth
      );

      const buffettAnalysis = evaluateBuffett7Principles(
        quote,
        safeFinancials,
        roeHistory,
        intrinsicValue
      );

      return {
        symbol: quote.symbol,
        name: quote.longName || quote.shortName || symbol,
        price,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        marketCap: quote.marketCap ?? 0,
        exchange: quote.exchange ?? "",
        sector: quote.sector,
        pe: quote.trailingPE,
        buffettAnalysis,
        priceTarget1yr: calcPriceTarget1yr(
          price,
          quote.trailingPE,
          safeFinancials.earningsGrowth
        ),
      } as DashboardStock;
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<DashboardStock> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value)
    .sort(
      (a, b) => b.buffettAnalysis.totalScore - a.buffettAnalysis.totalScore
    );
}
