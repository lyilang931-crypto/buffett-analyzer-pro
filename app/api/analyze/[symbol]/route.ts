import { NextRequest, NextResponse } from "next/server";
import {
  getQuote,
  getFinancials,
  getHistoricalPrices,
  getROEHistory,
} from "@/lib/yahoo-finance";
import { evaluateBuffett7Principles } from "@/lib/buffett-7-principles";
import { getBrandSentiment } from "@/lib/brand-sentiment";

// キャッシュ完全無効化 — 株価はリクエストごとに必ず再取得
export const dynamic = 'force-dynamic';
// Vercel Pro: 最大30秒まで延長（Hobbyは10秒固定）
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase();

    // 財務データ取得とブランドセンチメントを並列実行
    // センチメントはtickerシンボルで先行取得（quote取得完了を待たない）
    const sentimentPromise = getBrandSentiment(symbol, symbol).catch(() => null);

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
    const intrinsicValue = calculateIntrinsicValue(
      currentPrice,
      safeFinancials.trailingEps,    // 株価非依存EPS（優先）
      quote.trailingPE,              // PEフォールバック
      safeFinancials.earningsGrowth
    );
    const safetyMargin = {
      intrinsicValue,
      currentPrice,
      marginPercent: intrinsicValue > 0
        ? ((intrinsicValue - currentPrice) / intrinsicValue) * 100
        : 0,
    };

    // センチメント結果を受け取る（すでに並列実行済みなので待ち時間ほぼゼロ）
    const brandSentiment = await sentimentPromise;

    // バフェット7原則評価（内在価値・センチメントを渡す）
    const buffettAnalysis = evaluateBuffett7Principles(
      quote,
      safeFinancials,
      roeHistory,
      intrinsicValue,
      brandSentiment
    );

    // 未来の株価予測（1年・3年・5年）
    const priceTargets = calculatePriceTargets(
      currentPrice,
      safeFinancials.trailingEps,   // 株価非依存EPS（優先）
      quote.trailingPE,
      safeFinancials.earningsGrowth
    );

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
//
// 修正: EPS を「株価 / PE」で計算すると IV ∝ 現在株価 になり
//       割引率が常に一定になるバグがあった。
//       trailingEps（Yahoo defaultKeyStatistics）は株価と独立した固定値なので
//       これを使うことで「株価が上がると割高・下がると割安」が正しく機能する。
function calculateIntrinsicValue(
  price: number,
  trailingEps: number | undefined,   // 株価非依存のEPS（優先）
  trailingPE: number | undefined,    // PE（trailingEpsがない場合のフォールバック）
  earningsGrowth: number | undefined
): number {
  // EPS取得の優先順位:
  //   1. trailingEps（株価と独立 → IV が固定値になる ✓）
  //   2. price / PE（PE が stale な場合は誤差あり）
  //   3. price / 15（PE=15仮定のフォールバック）
  let eps: number;
  if (trailingEps && trailingEps > 0) {
    eps = trailingEps;                        // 最優先: 固定EPSで正確な内在価値
  } else if (trailingPE && trailingPE > 0) {
    eps = price / trailingPE;                 // フォールバック
  } else {
    eps = price / 15;                         // 最終フォールバック
  }

  if (eps <= 0) return 0; // 赤字企業は内在価値計算不可

  const growthRate = Math.min((earningsGrowth ?? 5) / 100, 0.25);

  // グレアム式: V = EPS × (8.5 + 2g) × (4.4 / Y)
  const grahamValue = eps * (8.5 + 2 * growthRate * 100) * (4.4 / 5);

  // 簡易DCF（10年）
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
  trailingEps: number | undefined,
  trailingPE: number | undefined,
  earningsGrowth: number | undefined
): Array<{ period: string; years: number; conservative: number; base: number; optimistic: number }> {
  if (currentPrice <= 0) return [];

  // EPS: trailingEps優先（株価非依存）
  const pe = trailingPE && trailingPE > 0 ? trailingPE : 15;
  const eps = (trailingEps && trailingEps > 0)
    ? trailingEps
    : currentPrice / pe;

  if (eps <= 0) return [];

  const baseGrowthRate = Math.min(Math.max((earningsGrowth ?? 5) / 100, -0.1), 0.3);
  const conservativeRate = Math.max(baseGrowthRate * 0.5, 0.02);  // 最低2%
  const optimisticRate = Math.min(baseGrowthRate * 1.5, 0.4);      // 最高40%

  // 将来EPS × 将来PE = 将来株価
  const futurePE = (rate: number, years: number) =>
    Math.max(12, pe * Math.pow(0.95, years * rate * 3));

  const project = (rate: number, years: number) => {
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
