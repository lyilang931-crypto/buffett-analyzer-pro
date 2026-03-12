import { NextRequest, NextResponse } from "next/server";
import {
  getQuote,
  getFinancials,
  getHistoricalPrices,
  getROEHistory,
} from "@/lib/yahoo-finance";
import { evaluateBuffett7Principles } from "@/lib/buffett-7-principles";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase();

    // 並列でデータ取得
    const [quote, financials, priceHistory, roeHistory] = await Promise.all([
      getQuote(symbol),
      getFinancials(symbol),
      getHistoricalPrices(symbol, "1y"),
      getROEHistory(symbol),
    ]);

    if (!quote) {
      return NextResponse.json(
        {
          success: false,
          error: `銘柄 ${symbol} が見つかりません`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // 財務データがない場合のフォールバック
    const safeFinancials = financials || { symbol };

    // 安全マージン計算（バフェット原則評価前に実施）
    const currentPrice = quote.regularMarketPrice ?? 0;
    const intrinsicValue = calculateIntrinsicValue(currentPrice, quote.trailingPE, safeFinancials.earningsGrowth);
    const safetyMargin = {
      intrinsicValue,
      currentPrice,
      marginPercent: intrinsicValue > 0
        ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100
        : 0,
    };

    // バフェット7原則評価（内在価値を渡す）
    const buffettAnalysis = evaluateBuffett7Principles(
      quote,
      safeFinancials,
      roeHistory,
      intrinsicValue
    );

    // 未来の株価予測（1年・3年・5年）
    const priceTargets = calculatePriceTargets(currentPrice, quote.trailingPE, safeFinancials.earningsGrowth);

    // レスポンス構築
    const response = {
      success: true,
      data: {
        quote: {
          symbol: quote.symbol,
          name: quote.longName || quote.shortName,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          marketCap: quote.marketCap,
          volume: quote.regularMarketVolume,
          pe: quote.trailingPE,
          forwardPe: quote.forwardPE,
          pb: quote.priceToBook,
          dividendYield: quote.dividendYield,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          exchange: quote.exchange,
          sector: quote.sector,
          industry: quote.industry,
        },
        financials: safeFinancials,
        buffettAnalysis,
        safetyMargin,
        priceTargets,
        priceHistory,
        roeHistory: roeHistory.map((r) => ({
          ...r,
          industryAverage: 12,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "分析に失敗しました",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// 内在価値計算（簡易DCF + グレアム式）
function calculateIntrinsicValue(
  price: number,
  trailingPE: number | undefined,
  earningsGrowth: number | undefined
): number {
  const pe = trailingPE || 15;
  const eps = price / pe;
  const growthRate = Math.min((earningsGrowth ?? 5) / 100, 0.25);

  // グレアム式: V = EPS × (8.5 + 2g) × (4.4 / Y)
  const grahamValue = eps * (8.5 + 2 * growthRate * 100) * (4.4 / 5);

  // 簡易DCF
  let dcfValue = 0;
  const discountRate = 0.1;
  for (let i = 1; i <= 10; i++) {
    const futureEps = eps * Math.pow(1 + growthRate, i);
    dcfValue += futureEps / Math.pow(1 + discountRate, i);
  }
  const terminalValue = (eps * Math.pow(1 + growthRate, 10) * 12) / Math.pow(1 + discountRate, 10);
  dcfValue += terminalValue;

  return (grahamValue + dcfValue) / 2;
}

// 未来の株価予測（保守的・標準・楽観的シナリオ）
function calculatePriceTargets(
  currentPrice: number,
  trailingPE: number | undefined,
  earningsGrowth: number | undefined
): Array<{ period: string; years: number; conservative: number; base: number; optimistic: number }> {
  if (currentPrice <= 0) return [];

  const pe = trailingPE || 15;
  const baseGrowthRate = Math.min(Math.max((earningsGrowth ?? 5) / 100, -0.1), 0.3);
  const conservativeRate = Math.max(baseGrowthRate * 0.5, 0.02);  // 最低2%
  const optimisticRate = Math.min(baseGrowthRate * 1.5, 0.4);      // 最高40%

  // 将来EPS × 将来PE = 将来株価
  // 成長に伴ってPEは緩やかに低下（高成長銘柄は将来PEが下がる傾向）
  const futurePE = (rate: number, years: number) =>
    Math.max(12, pe * Math.pow(0.95, years * rate * 3));

  const project = (rate: number, years: number) => {
    const eps = currentPrice / pe;
    const futureEps = eps * Math.pow(1 + rate, years);
    return Math.round(futureEps * futurePE(rate, years));
  };

  return [
    {
      period: "1年後",
      years: 1,
      conservative: project(conservativeRate, 1),
      base: project(baseGrowthRate, 1),
      optimistic: project(optimisticRate, 1),
    },
    {
      period: "3年後",
      years: 3,
      conservative: project(conservativeRate, 3),
      base: project(baseGrowthRate, 3),
      optimistic: project(optimisticRate, 3),
    },
    {
      period: "5年後",
      years: 5,
      conservative: project(conservativeRate, 5),
      base: project(baseGrowthRate, 5),
      optimistic: project(optimisticRate, 5),
    },
  ];
}
