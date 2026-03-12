import {
  BuffettAnalysis,
  FinancialMetrics,
  ROEHistory,
  ScreeningCriteria,
  ScreeningResult,
} from "@/types/stock";
import {
  getStockProfile,
  getFinancialMetrics,
  getROEHistory,
} from "./stock-api";

// 経済的な堀（Moat）スコアを計算
function calculateMoatScore(metrics: FinancialMetrics): {
  total: number;
  factors: BuffettAnalysis["moatFactors"];
} {
  const factors = {
    brandPower: 0,
    switchingCost: 0,
    networkEffect: 0,
    costAdvantage: 0,
    intangibleAssets: 0,
  };

  // ブランド力: 粗利益率が高いほどブランド力がある
  if (metrics.grossMargin >= 60) factors.brandPower = 100;
  else if (metrics.grossMargin >= 50) factors.brandPower = 80;
  else if (metrics.grossMargin >= 40) factors.brandPower = 60;
  else if (metrics.grossMargin >= 30) factors.brandPower = 40;
  else factors.brandPower = 20;

  // スイッチングコスト: 顧客維持率の代わりにROEの安定性で推測
  // ROEが安定して高い = 顧客が離れにくい
  if (metrics.roe >= 20 && metrics.operatingMargin >= 25) factors.switchingCost = 90;
  else if (metrics.roe >= 15 && metrics.operatingMargin >= 20) factors.switchingCost = 70;
  else if (metrics.roe >= 10) factors.switchingCost = 50;
  else factors.switchingCost = 30;

  // ネットワーク効果: PSRが高く、売上成長も高い場合
  if (metrics.ps >= 5 && metrics.revenueGrowth >= 20) factors.networkEffect = 90;
  else if (metrics.ps >= 3 && metrics.revenueGrowth >= 15) factors.networkEffect = 70;
  else if (metrics.revenueGrowth >= 10) factors.networkEffect = 50;
  else factors.networkEffect = 30;

  // コスト優位性: 営業利益率が業界平均を大幅に上回る
  if (metrics.operatingMargin >= 30) factors.costAdvantage = 100;
  else if (metrics.operatingMargin >= 25) factors.costAdvantage = 80;
  else if (metrics.operatingMargin >= 20) factors.costAdvantage = 60;
  else if (metrics.operatingMargin >= 15) factors.costAdvantage = 40;
  else factors.costAdvantage = 20;

  // 無形資産: ROICとROEの差、特許・知的財産の代理指標
  if (metrics.roic >= 20) factors.intangibleAssets = 90;
  else if (metrics.roic >= 15) factors.intangibleAssets = 70;
  else if (metrics.roic >= 10) factors.intangibleAssets = 50;
  else factors.intangibleAssets = 30;

  // 総合スコア（加重平均）
  const total = Math.round(
    factors.brandPower * 0.25 +
    factors.switchingCost * 0.2 +
    factors.networkEffect * 0.15 +
    factors.costAdvantage * 0.25 +
    factors.intangibleAssets * 0.15
  );

  return { total, factors };
}

// ROE分析
function analyzeROE(history: ROEHistory[], currentROE: number): BuffettAnalysis["roeAnalysis"] {
  const fiveYearAvgROE =
    history.length > 0
      ? history.reduce((sum, h) => sum + h.roe, 0) / history.length
      : currentROE;

  // 安定性チェック: 過去5年間、全て15%以上か
  const isConsistent = history.every((h) => h.roe >= 15);

  // トレンド判定
  let trend: "up" | "stable" | "down" = "stable";
  if (history.length >= 2) {
    const recent = history.slice(-2);
    const change = recent[1]?.roe - recent[0]?.roe;
    if (change > 3) trend = "up";
    else if (change < -3) trend = "down";
  }

  return {
    currentROE,
    fiveYearAvgROE,
    isConsistent,
    trend,
    history: history.map((h) => ({
      ...h,
      industryAverage: 12, // 業界平均のデフォルト値
    })),
  };
}

// バリュエーション分析
function analyzeValuation(metrics: FinancialMetrics): BuffettAnalysis["valuation"] {
  const industryPE = 20; // 業界平均PE（デフォルト）
  const historicalPE = 18; // 過去平均PE（デフォルト）

  const isUndervalued = metrics.pe > 0 && metrics.pe < industryPE * 0.8;
  const discountPercent = metrics.pe > 0 ? ((industryPE - metrics.pe) / industryPE) * 100 : 0;

  return {
    currentPE: metrics.pe,
    historicalPE,
    industryPE,
    isUndervalued,
    discountPercent,
  };
}

// 安全マージン計算（簡易DCF + グレアム式）
function calculateSafetyMargin(
  metrics: FinancialMetrics,
  currentPrice: number
): BuffettAnalysis["safetyMargin"] {
  // 簡易DCF: 10年間のEPS成長を想定
  const epsGrowthRate = Math.min(metrics.epsGrowth, 25) / 100; // 最大25%でキャップ
  const discountRate = 0.1; // 10%割引率
  const terminalMultiple = 15;

  // 現在のEPSを推定（PE比率から逆算）
  const currentEPS = currentPrice / (metrics.pe || 15);
  let dcfValue = 0;

  // 10年間のキャッシュフローを割り引く
  for (let i = 1; i <= 10; i++) {
    const futureEPS = currentEPS * Math.pow(1 + epsGrowthRate, i);
    dcfValue += futureEPS / Math.pow(1 + discountRate, i);
  }

  // ターミナルバリュー
  const terminalEPS = currentEPS * Math.pow(1 + epsGrowthRate, 10);
  const terminalValue = (terminalEPS * terminalMultiple) / Math.pow(1 + discountRate, 10);
  dcfValue += terminalValue;

  // グレアム式: 内在価値 = EPS × (8.5 + 2g) × (4.4 / AAA債券利回り)
  const grahamValue = currentEPS * (8.5 + 2 * epsGrowthRate * 100) * (4.4 / 5);

  // 内在価値は両方の平均
  const intrinsicValue = (dcfValue + grahamValue) / 2;
  const marginPercent = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;

  return {
    intrinsicValue,
    currentPrice,
    marginPercent,
    dcfValue,
    grahamValue,
  };
}

// 10倍株ポテンシャル評価
function evaluateTenBaggerPotential(
  metrics: FinancialMetrics,
  moatScore: number,
  roeAnalysis: BuffettAnalysis["roeAnalysis"],
  valuation: BuffettAnalysis["valuation"]
): BuffettAnalysis["tenBaggerPotential"] {
  const factors: string[] = [];
  const risks: string[] = [];
  let score = 0;

  // 成長性評価
  if (metrics.revenueGrowth >= 20) {
    score += 20;
    factors.push("高い売上成長率");
  } else if (metrics.revenueGrowth >= 10) {
    score += 10;
  } else {
    risks.push("売上成長の鈍化");
  }

  // ROEの安定性
  if (roeAnalysis.isConsistent && roeAnalysis.fiveYearAvgROE >= 20) {
    score += 25;
    factors.push("安定した高ROE");
  } else if (roeAnalysis.fiveYearAvgROE >= 15) {
    score += 15;
  } else {
    risks.push("ROEの不安定性");
  }

  // 経済的な堀
  if (moatScore >= 80) {
    score += 25;
    factors.push("強力な経済的堀");
  } else if (moatScore >= 60) {
    score += 15;
  } else {
    risks.push("競争優位性の弱さ");
  }

  // バリュエーション
  if (valuation.isUndervalued) {
    score += 20;
    factors.push("割安な株価");
  } else if (valuation.currentPE > 30) {
    risks.push("高いバリュエーション");
  } else {
    score += 10;
  }

  // 財務健全性
  if (metrics.debtToEquity < 0.5 && metrics.currentRatio > 1.5) {
    score += 10;
    factors.push("健全な財務体質");
  } else if (metrics.debtToEquity > 2) {
    risks.push("高い負債水準");
  }

  // タイムフレームの推定
  let timeframe = "10年以上";
  if (score >= 80 && metrics.revenueGrowth >= 25) timeframe = "5-7年";
  else if (score >= 60) timeframe = "7-10年";

  return {
    score,
    factors,
    risks,
    timeframe,
  };
}

// 総合スコア計算
function calculateOverallScore(
  moatScore: number,
  roeAnalysis: BuffettAnalysis["roeAnalysis"],
  valuation: BuffettAnalysis["valuation"],
  safetyMargin: BuffettAnalysis["safetyMargin"],
  metrics: FinancialMetrics
): number {
  let score = 0;

  // 堀スコア (30%)
  score += moatScore * 0.3;

  // ROE (25%)
  const roeScore = Math.min(roeAnalysis.fiveYearAvgROE / 25 * 100, 100);
  score += roeScore * 0.25;

  // バリュエーション (20%)
  const valuationScore = valuation.isUndervalued ? 100 : Math.max(0, 100 - valuation.currentPE * 2);
  score += valuationScore * 0.2;

  // 安全マージン (15%)
  const safetyScore = Math.max(0, Math.min(100, safetyMargin.marginPercent * 2));
  score += safetyScore * 0.15;

  // 財務健全性 (10%)
  let financialScore = 50;
  if (metrics.debtToEquity < 0.5) financialScore += 25;
  if (metrics.currentRatio > 1.5) financialScore += 25;
  score += financialScore * 0.1;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// メイン分析関数
export async function analyzeStock(symbol: string): Promise<BuffettAnalysis | null> {
  try {
    const [stock, metrics, roeHistory] = await Promise.all([
      getStockProfile(symbol),
      getFinancialMetrics(symbol),
      getROEHistory(symbol, 5),
    ]);

    if (!stock || !metrics) {
      return null;
    }

    const moat = calculateMoatScore(metrics);
    const roeAnalysis = analyzeROE(roeHistory, metrics.roe);
    const valuation = analyzeValuation(metrics);
    const safetyMargin = calculateSafetyMargin(metrics, stock.price);
    const tenBaggerPotential = evaluateTenBaggerPotential(
      metrics,
      moat.total,
      roeAnalysis,
      valuation
    );
    const overallScore = calculateOverallScore(
      moat.total,
      roeAnalysis,
      valuation,
      safetyMargin,
      metrics
    );

    return {
      symbol: stock.symbol,
      name: stock.name,
      moatScore: moat.total,
      moatFactors: moat.factors,
      roeAnalysis,
      valuation,
      safetyMargin,
      overallScore,
      tenBaggerPotential,
    };
  } catch (error) {
    console.error(`Failed to analyze stock ${symbol}:`, error);
    return null;
  }
}

// スクリーニング実行
export async function screenStocks(
  criteria: ScreeningCriteria
): Promise<ScreeningResult> {
  // デモデータ（実際はAPIから取得）
  const demoStocks: BuffettAnalysis[] = [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      moatScore: 92,
      moatFactors: {
        brandPower: 100,
        switchingCost: 90,
        networkEffect: 85,
        costAdvantage: 90,
        intangibleAssets: 95,
      },
      roeAnalysis: {
        currentROE: 147,
        fiveYearAvgROE: 95,
        isConsistent: true,
        trend: "stable",
        history: [
          { year: 2020, roe: 73.7, industryAverage: 12 },
          { year: 2021, roe: 150.1, industryAverage: 13 },
          { year: 2022, roe: 196.9, industryAverage: 12 },
          { year: 2023, roe: 156.1, industryAverage: 14 },
          { year: 2024, roe: 147.2, industryAverage: 13 },
        ],
      },
      valuation: {
        currentPE: 28.5,
        historicalPE: 22,
        industryPE: 25,
        isUndervalued: false,
        discountPercent: -14,
      },
      safetyMargin: {
        intrinsicValue: 210,
        currentPrice: 178,
        marginPercent: 15,
        dcfValue: 225,
        grahamValue: 195,
      },
      overallScore: 85,
      tenBaggerPotential: {
        score: 65,
        factors: ["強力なブランド", "エコシステム効果", "サービス成長"],
        risks: ["成長鈍化", "高バリュエーション"],
        timeframe: "7-10年",
      },
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      moatScore: 94,
      moatFactors: {
        brandPower: 95,
        switchingCost: 98,
        networkEffect: 90,
        costAdvantage: 92,
        intangibleAssets: 96,
      },
      roeAnalysis: {
        currentROE: 38.5,
        fiveYearAvgROE: 42,
        isConsistent: true,
        trend: "stable",
        history: [
          { year: 2020, roe: 40.1, industryAverage: 12 },
          { year: 2021, roe: 47.1, industryAverage: 13 },
          { year: 2022, roe: 43.7, industryAverage: 12 },
          { year: 2023, roe: 38.6, industryAverage: 14 },
          { year: 2024, roe: 38.5, industryAverage: 13 },
        ],
      },
      valuation: {
        currentPE: 35.2,
        historicalPE: 28,
        industryPE: 30,
        isUndervalued: false,
        discountPercent: -17,
      },
      safetyMargin: {
        intrinsicValue: 450,
        currentPrice: 415,
        marginPercent: 8,
        dcfValue: 480,
        grahamValue: 420,
      },
      overallScore: 88,
      tenBaggerPotential: {
        score: 70,
        factors: ["クラウド成長", "AI投資", "エンタープライズ基盤"],
        risks: ["規制リスク", "成熟市場"],
        timeframe: "7-10年",
      },
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      moatScore: 90,
      moatFactors: {
        brandPower: 95,
        switchingCost: 75,
        networkEffect: 100,
        costAdvantage: 90,
        intangibleAssets: 92,
      },
      roeAnalysis: {
        currentROE: 25.3,
        fiveYearAvgROE: 23,
        isConsistent: true,
        trend: "up",
        history: [
          { year: 2020, roe: 18.1, industryAverage: 12 },
          { year: 2021, roe: 30.2, industryAverage: 13 },
          { year: 2022, roe: 23.4, industryAverage: 12 },
          { year: 2023, roe: 24.8, industryAverage: 14 },
          { year: 2024, roe: 25.3, industryAverage: 13 },
        ],
      },
      valuation: {
        currentPE: 23.5,
        historicalPE: 25,
        industryPE: 28,
        isUndervalued: true,
        discountPercent: 16,
      },
      safetyMargin: {
        intrinsicValue: 195,
        currentPrice: 155,
        marginPercent: 20,
        dcfValue: 210,
        grahamValue: 180,
      },
      overallScore: 82,
      tenBaggerPotential: {
        score: 75,
        factors: ["検索独占", "YouTube成長", "クラウド拡大", "AI技術"],
        risks: ["広告依存", "規制リスク"],
        timeframe: "5-7年",
      },
    },
    {
      symbol: "BRK.B",
      name: "Berkshire Hathaway Inc.",
      moatScore: 88,
      moatFactors: {
        brandPower: 85,
        switchingCost: 80,
        networkEffect: 60,
        costAdvantage: 95,
        intangibleAssets: 90,
      },
      roeAnalysis: {
        currentROE: 15.2,
        fiveYearAvgROE: 12,
        isConsistent: true,
        trend: "up",
        history: [
          { year: 2020, roe: 10.5, industryAverage: 10 },
          { year: 2021, roe: 18.2, industryAverage: 11 },
          { year: 2022, roe: 8.5, industryAverage: 10 },
          { year: 2023, roe: 14.8, industryAverage: 11 },
          { year: 2024, roe: 15.2, industryAverage: 12 },
        ],
      },
      valuation: {
        currentPE: 9.5,
        historicalPE: 12,
        industryPE: 15,
        isUndervalued: true,
        discountPercent: 37,
      },
      safetyMargin: {
        intrinsicValue: 520,
        currentPrice: 410,
        marginPercent: 21,
        dcfValue: 550,
        grahamValue: 490,
      },
      overallScore: 86,
      tenBaggerPotential: {
        score: 55,
        factors: ["バフェットの運用", "保険フロート", "現金山積み"],
        risks: ["後継者問題", "巨大な規模"],
        timeframe: "10年以上",
      },
    },
    {
      symbol: "V",
      name: "Visa Inc.",
      moatScore: 96,
      moatFactors: {
        brandPower: 95,
        switchingCost: 98,
        networkEffect: 100,
        costAdvantage: 92,
        intangibleAssets: 95,
      },
      roeAnalysis: {
        currentROE: 47.8,
        fiveYearAvgROE: 44,
        isConsistent: true,
        trend: "stable",
        history: [
          { year: 2020, roe: 35.2, industryAverage: 12 },
          { year: 2021, roe: 42.5, industryAverage: 13 },
          { year: 2022, roe: 45.1, industryAverage: 12 },
          { year: 2023, roe: 48.3, industryAverage: 14 },
          { year: 2024, roe: 47.8, industryAverage: 13 },
        ],
      },
      valuation: {
        currentPE: 30.5,
        historicalPE: 32,
        industryPE: 28,
        isUndervalued: false,
        discountPercent: -9,
      },
      safetyMargin: {
        intrinsicValue: 320,
        currentPrice: 280,
        marginPercent: 12.5,
        dcfValue: 350,
        grahamValue: 290,
      },
      overallScore: 91,
      tenBaggerPotential: {
        score: 80,
        factors: ["決済ネットワーク独占", "キャッシュレス化", "新興国成長"],
        risks: ["フィンテック競合"],
        timeframe: "5-7年",
      },
    },
  ];

  // フィルタリング
  let filtered = [...demoStocks];

  if (criteria.minROE !== undefined) {
    filtered = filtered.filter((s) => s.roeAnalysis.fiveYearAvgROE >= criteria.minROE!);
  }
  if (criteria.maxPE !== undefined) {
    filtered = filtered.filter((s) => s.valuation.currentPE <= criteria.maxPE!);
  }
  if (criteria.minMoatScore !== undefined) {
    filtered = filtered.filter((s) => s.moatScore >= criteria.minMoatScore!);
  }
  if (criteria.minSafetyMargin !== undefined) {
    filtered = filtered.filter((s) => s.safetyMargin.marginPercent >= criteria.minSafetyMargin!);
  }

  // スコア順でソート
  filtered.sort((a, b) => b.overallScore - a.overallScore);

  return {
    stocks: filtered,
    totalCount: filtered.length,
    criteria,
    generatedAt: new Date().toISOString(),
  };
}

// バフェット基準チェック
export function checkBuffettCriteria(analysis: BuffettAnalysis): {
  passed: boolean;
  criteria: Array<{ name: string; passed: boolean; value: string; threshold: string }>;
} {
  const criteria = [
    {
      name: "ROE > 15%（5年平均）",
      passed: analysis.roeAnalysis.fiveYearAvgROE >= 15,
      value: `${analysis.roeAnalysis.fiveYearAvgROE.toFixed(1)}%`,
      threshold: "15%以上",
    },
    {
      name: "経済的な堀",
      passed: analysis.moatScore >= 70,
      value: `${analysis.moatScore}点`,
      threshold: "70点以上",
    },
    {
      name: "理解可能なビジネス",
      passed: true, // 定性的判断
      value: "対象",
      threshold: "理解可能",
    },
    {
      name: "安全マージン",
      passed: analysis.safetyMargin.marginPercent >= 0,
      value: `${analysis.safetyMargin.marginPercent.toFixed(1)}%`,
      threshold: "0%以上",
    },
    {
      name: "財務健全性",
      passed: analysis.moatFactors.costAdvantage >= 60,
      value: `${analysis.moatFactors.costAdvantage}点`,
      threshold: "健全",
    },
  ];

  const passed = criteria.every((c) => c.passed);

  return { passed, criteria };
}
