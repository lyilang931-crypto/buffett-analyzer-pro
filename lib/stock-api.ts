import {
  Stock,
  FinancialMetrics,
  PriceHistory,
  Executive,
  CompetitorComparison,
  BuffettIndex,
} from "@/types/stock";

// Financial Modeling Prep API (無料枠: 250回/日)
const FMP_API_KEY = process.env.FMP_API_KEY || "demo";
const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

// APIリクエストのキャッシュ
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// 株式プロフィール取得
export async function getStockProfile(symbol: string): Promise<Stock | null> {
  try {
    const data = await fetchWithCache<Array<{
      symbol: string;
      companyName: string;
      exchangeShortName: string;
      sector: string;
      industry: string;
      country: string;
      mktCap: number;
      price: number;
      currency: string;
    }>>(`${FMP_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`);

    if (!data || data.length === 0) return null;

    const profile = data[0];
    return {
      symbol: profile.symbol,
      name: profile.companyName,
      exchange: profile.exchangeShortName,
      sector: profile.sector,
      industry: profile.industry,
      country: profile.country,
      marketCap: profile.mktCap,
      price: profile.price,
      currency: profile.currency,
    };
  } catch (error) {
    console.error(`Failed to fetch stock profile for ${symbol}:`, error);
    return null;
  }
}

// 財務指標取得
export async function getFinancialMetrics(symbol: string): Promise<FinancialMetrics | null> {
  try {
    const [ratios, growth, keyMetrics] = await Promise.all([
      fetchWithCache<Array<Record<string, number>>>(`${FMP_BASE_URL}/ratios/${symbol}?limit=1&apikey=${FMP_API_KEY}`),
      fetchWithCache<Array<Record<string, number>>>(`${FMP_BASE_URL}/financial-growth/${symbol}?limit=1&apikey=${FMP_API_KEY}`),
      fetchWithCache<Array<Record<string, number>>>(`${FMP_BASE_URL}/key-metrics/${symbol}?limit=1&apikey=${FMP_API_KEY}`),
    ]);

    if (!ratios?.length || !growth?.length || !keyMetrics?.length) return null;

    const r = ratios[0];
    const g = growth[0];
    const k = keyMetrics[0];

    return {
      roe: (r.returnOnEquity || 0) * 100,
      roa: (r.returnOnAssets || 0) * 100,
      roic: (r.returnOnCapitalEmployed || 0) * 100,
      grossMargin: (r.grossProfitMargin || 0) * 100,
      operatingMargin: (r.operatingProfitMargin || 0) * 100,
      netMargin: (r.netProfitMargin || 0) * 100,
      pe: r.priceEarningsRatio || 0,
      forwardPe: r.priceToEarningsRatio || 0,
      pb: r.priceToBookRatio || 0,
      ps: r.priceToSalesRatio || 0,
      ev_ebitda: k.enterpriseValueOverEBITDA || 0,
      revenueGrowth: (g.revenueGrowth || 0) * 100,
      epsGrowth: (g.epsgrowth || 0) * 100,
      debtToEquity: r.debtEquityRatio || 0,
      currentRatio: r.currentRatio || 0,
      quickRatio: r.quickRatio || 0,
      interestCoverage: r.interestCoverage || 0,
      dividendYield: (r.dividendYield || 0) * 100,
      payoutRatio: (r.payoutRatio || 0) * 100,
    };
  } catch (error) {
    console.error(`Failed to fetch financial metrics for ${symbol}:`, error);
    return null;
  }
}

// ROE履歴取得
export async function getROEHistory(symbol: string, years: number = 5): Promise<Array<{ year: number; roe: number; industryAverage: number }>> {
  try {
    const data = await fetchWithCache<Array<{
      date: string;
      returnOnEquity: number;
    }>>(`${FMP_BASE_URL}/ratios/${symbol}?limit=${years}&apikey=${FMP_API_KEY}`);

    if (!data) return [];

    return data.map((item) => ({
      year: new Date(item.date).getFullYear(),
      roe: (item.returnOnEquity || 0) * 100,
      industryAverage: 12, // デフォルト業界平均
    })).reverse();
  } catch (error) {
    console.error(`Failed to fetch ROE history for ${symbol}:`, error);
    return [];
  }
}

// 株価履歴取得
export async function getPriceHistory(
  symbol: string,
  period: "1M" | "3M" | "1Y" | "5Y" = "1Y"
): Promise<PriceHistory[]> {
  try {
    const data = await fetchWithCache<{
      historical: Array<{
        date: string;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }>;
    }>(`${FMP_BASE_URL}/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`);

    if (!data?.historical) return [];

    const now = new Date();
    const periodDays = {
      "1M": 30,
      "3M": 90,
      "1Y": 365,
      "5Y": 365 * 5,
    };

    const cutoffDate = new Date(now.getTime() - periodDays[period] * 24 * 60 * 60 * 1000);

    return data.historical
      .filter((item) => new Date(item.date) >= cutoffDate)
      .map((item) => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }))
      .reverse();
  } catch (error) {
    console.error(`Failed to fetch price history for ${symbol}:`, error);
    return [];
  }
}

// 経営者情報取得
export async function getExecutives(symbol: string): Promise<Executive[]> {
  try {
    const data = await fetchWithCache<Array<{
      name: string;
      title: string;
      pay: number;
    }>>(`${FMP_BASE_URL}/key-executives/${symbol}?apikey=${FMP_API_KEY}`);

    if (!data) return [];

    return data.slice(0, 5).map((exec) => ({
      name: exec.name,
      title: exec.title,
      compensation: exec.pay,
    }));
  } catch (error) {
    console.error(`Failed to fetch executives for ${symbol}:`, error);
    return [];
  }
}

// 競合他社取得
export async function getCompetitors(symbol: string): Promise<CompetitorComparison[]> {
  try {
    const profile = await getStockProfile(symbol);
    if (!profile) return [];

    // 同じセクターの銘柄を取得
    const data = await fetchWithCache<Array<{
      symbol: string;
      name: string;
      marketCap: number;
      pe: number;
    }>>(`${FMP_BASE_URL}/stock-screener?sector=${profile.sector}&limit=5&apikey=${FMP_API_KEY}`);

    if (!data) return [];

    const competitors: CompetitorComparison[] = [];
    for (const stock of data.filter(s => s.symbol !== symbol).slice(0, 4)) {
      const metrics = await getFinancialMetrics(stock.symbol);
      competitors.push({
        symbol: stock.symbol,
        name: stock.name,
        marketCap: stock.marketCap,
        pe: stock.pe || 0,
        roe: metrics?.roe || 0,
        revenueGrowth: metrics?.revenueGrowth || 0,
        moatScore: 0, // 後で計算
      });
    }

    return competitors;
  } catch (error) {
    console.error(`Failed to fetch competitors for ${symbol}:`, error);
    return [];
  }
}

// バフェット指数取得
export async function getBuffettIndex(): Promise<BuffettIndex> {
  try {
    // 米国市場の時価総額とGDPを使用（将来的にAPIから取得）
    // デモデータ（API制限時のフォールバック）
    const totalMarketCap = 50e12; // 約50兆ドル
    const gdp = 27e12; // 約27兆ドル
    const value = (totalMarketCap / gdp) * 100;

    const statusMap = {
      significantly_undervalued: "大幅割安 - 絶好の買い場",
      undervalued: "割安 - 買い推奨",
      fair: "適正水準",
      overvalued: "割高 - 注意",
      significantly_overvalued: "大幅割高 - 警戒",
    };

    let status: BuffettIndex["marketStatus"] = "fair";
    if (value < 50) status = "significantly_undervalued";
    else if (value < 75) status = "undervalued";
    else if (value < 100) status = "fair";
    else if (value < 125) status = "overvalued";
    else status = "significantly_overvalued";

    return {
      value,
      marketStatus: status,
      statusLabel: statusMap[status],
      totalMarketCap,
      gdp,
      historicalAverage: 85,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch Buffett Index:", error);
    // フォールバック値
    return {
      value: 185,
      marketStatus: "significantly_overvalued",
      statusLabel: "大幅割高 - 警戒",
      totalMarketCap: 50e12,
      gdp: 27e12,
      historicalAverage: 85,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// スクリーニング用の銘柄リスト取得
export async function getScreenerStocks(
  limit: number = 50
): Promise<Array<{ symbol: string; name: string; marketCap: number; sector: string }>> {
  try {
    const data = await fetchWithCache<Array<{
      symbol: string;
      companyName: string;
      marketCap: number;
      sector: string;
    }>>(`${FMP_BASE_URL}/stock-screener?marketCapMoreThan=10000000000&limit=${limit}&apikey=${FMP_API_KEY}`);

    if (!data) return [];

    return data.map((stock) => ({
      symbol: stock.symbol,
      name: stock.companyName,
      marketCap: stock.marketCap,
      sector: stock.sector,
    }));
  } catch (error) {
    console.error("Failed to fetch screener stocks:", error);
    return [];
  }
}

// リアルタイム株価取得
export async function getQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
  volume: number;
} | null> {
  try {
    const data = await fetchWithCache<Array<{
      price: number;
      change: number;
      changesPercentage: number;
      volume: number;
    }>>(`${FMP_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`);

    if (!data || data.length === 0) return null;

    const quote = data[0];
    return {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      volume: quote.volume,
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}
