// 株式基本情報
export interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  price: number;
  currency: string;
}

// 財務指標
export interface FinancialMetrics {
  // 収益性
  roe: number; // 自己資本利益率
  roa: number; // 総資産利益率
  roic: number; // 投下資本利益率
  grossMargin: number; // 粗利益率
  operatingMargin: number; // 営業利益率
  netMargin: number; // 純利益率

  // バリュエーション
  pe: number; // PER
  forwardPe: number; // 予想PER
  pb: number; // PBR
  ps: number; // PSR
  ev_ebitda: number; // EV/EBITDA

  // 成長性
  revenueGrowth: number; // 売上成長率
  epsGrowth: number; // EPS成長率

  // 財務健全性
  debtToEquity: number; // D/Eレシオ
  currentRatio: number; // 流動比率
  quickRatio: number; // 当座比率
  interestCoverage: number; // インタレストカバレッジ

  // 配当
  dividendYield: number; // 配当利回り
  payoutRatio: number; // 配当性向
}

// ROE推移データ
export interface ROEHistory {
  year: number;
  roe: number;
  industryAverage: number;
}

// バフェット分析結果
export interface BuffettAnalysis {
  symbol: string;
  name: string;

  // 経済的な堀スコア (0-100)
  moatScore: number;
  moatFactors: {
    brandPower: number; // ブランド力
    switchingCost: number; // スイッチングコスト
    networkEffect: number; // ネットワーク効果
    costAdvantage: number; // コスト優位性
    intangibleAssets: number; // 無形資産
  };

  // ROE分析
  roeAnalysis: {
    currentROE: number;
    fiveYearAvgROE: number;
    isConsistent: boolean; // 安定的に15%以上か
    trend: 'up' | 'stable' | 'down';
    history: ROEHistory[];
  };

  // バリュエーション
  valuation: {
    currentPE: number;
    historicalPE: number;
    industryPE: number;
    isUndervalued: boolean;
    discountPercent: number; // 割安度
  };

  // 安全マージン
  safetyMargin: {
    intrinsicValue: number; // 内在価値
    currentPrice: number;
    marginPercent: number; // 安全マージン率
    dcfValue: number;
    grahamValue: number;
  };

  // 総合スコア (0-100)
  overallScore: number;

  // 10倍株ポテンシャル
  tenBaggerPotential: {
    score: number; // 0-100
    factors: string[];
    risks: string[];
    timeframe: string; // e.g., "5-10年"
  };
}

// スクリーニング条件
export interface ScreeningCriteria {
  minROE?: number;
  maxPE?: number;
  maxPB?: number;
  minMoatScore?: number;
  minSafetyMargin?: number;
  sectors?: string[];
  countries?: string[];
  minMarketCap?: number;
  maxMarketCap?: number;
}

// スクリーニング結果
export interface ScreeningResult {
  stocks: BuffettAnalysis[];
  totalCount: number;
  criteria: ScreeningCriteria;
  generatedAt: string;
}

// バフェット指数
export interface BuffettIndex {
  value: number; // 時価総額/GDP比
  marketStatus: 'significantly_undervalued' | 'undervalued' | 'fair' | 'overvalued' | 'significantly_overvalued';
  statusLabel: string;
  totalMarketCap: number;
  gdp: number;
  historicalAverage: number;
  lastUpdated: string;
}

// 株価チャートデータ
export interface PriceHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 経営者情報
export interface Executive {
  name: string;
  title: string;
  since?: string;
  compensation?: number;
}

// 競合比較データ
export interface CompetitorComparison {
  symbol: string;
  name: string;
  marketCap: number;
  pe: number;
  roe: number;
  revenueGrowth: number;
  moatScore: number;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 株式詳細ページ用データ
export interface StockDetail {
  stock: Stock;
  metrics: FinancialMetrics;
  analysis: BuffettAnalysis;
  priceHistory: PriceHistory[];
  executives: Executive[];
  competitors: CompetitorComparison[];
}
