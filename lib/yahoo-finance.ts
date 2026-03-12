// yahoo-finance2 v3.x wrapper
// Verified working with: AAPL, NVDA – quoteSummary, chart, search

// eslint-disable-next-line @typescript-eslint/no-require-imports
const YahooFinanceCls = require('yahoo-finance2').default as new (opts: Record<string, unknown>) => unknown;

// Singleton instance
let _yf: unknown = null;
function getYF(): unknown {
  if (!_yf) {
    _yf = new YahooFinanceCls({
      suppressNotices: ['yahooSurvey', 'ripHistorical'],
    });
  }
  return _yf;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YahooSearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
  sector?: string;
  industry?: string;
}

export interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  chartPreviousClose?: number;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  dividendYield?: number;
  currency?: string;
  exchange?: string;
  sector?: string;
  industry?: string;
}

export interface YahooFinancials {
  symbol: string;
  // From financialData
  totalRevenue?: number;
  grossProfits?: number;
  ebitda?: number;
  netIncomeToCommon?: number;
  returnOnEquity?: number;       // percentage (multiplied by 100)
  returnOnAssets?: number;       // percentage (multiplied by 100)
  netMargin?: number;            // percentage (multiplied by 100)
  operatingMargin?: number;      // percentage (multiplied by 100)
  grossMargin?: number;          // percentage (multiplied by 100)
  revenueGrowth?: number;        // percentage (multiplied by 100)
  earningsGrowth?: number;       // percentage (multiplied by 100)
  totalCash?: number;
  totalDebt?: number;
  debtToEquity?: number;         // already in percentage from Yahoo (e.g. 150 = 150%)
  currentRatio?: number;
  quickRatio?: number;
  freeCashflow?: number;
  operatingCashflow?: number;
  revenuePerShare?: number;
  // From summaryDetail
  trailingPE?: number;
  forwardPE?: number;
  priceToBook?: number;
  dividendYield?: number;        // percentage (multiplied by 100)
  payoutRatio?: number;          // percentage (multiplied by 100)
  beta?: number;
  // From balanceSheetHistory
  totalAssets?: number;
  totalStockholderEquity?: number;
  // From incomeStatementHistory
  totalRevenueLY?: number;
  netIncomeLY?: number;
}

export interface YahooHistoricalPrice {
  date: Date;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  adjclose?: number;
  volume?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a plain number from a value that may be { raw: number } or number */
function rawNum(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null && 'raw' in v) {
    const raw = (v as { raw: unknown }).raw;
    if (typeof raw === 'number') return raw;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// searchStocks
// ---------------------------------------------------------------------------

export async function searchStocks(query: string): Promise<YahooSearchResult[]> {
  try {
    const yf = getYF() as { search: (q: string) => Promise<{ quotes?: YahooSearchResult[] }> };
    const result = await yf.search(query);
    return result.quotes ?? [];
  } catch (err) {
    console.error('[yahoo-finance] searchStocks error:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// getQuote
// ---------------------------------------------------------------------------

export async function getQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const yf = getYF() as {
      quoteSummary: (
        sym: string,
        opts: { modules: string[] }
      ) => Promise<Record<string, Record<string, unknown>>>;
    };

    const result = await yf.quoteSummary(symbol, {
      modules: ['financialData', 'summaryDetail', 'assetProfile', 'price'],
    });

    const price = (result.price ?? {}) as Record<string, unknown>;
    const summary = (result.summaryDetail ?? {}) as Record<string, unknown>;
    const profile = (result.assetProfile ?? {}) as Record<string, unknown>;
    const financial = (result.financialData ?? {}) as Record<string, unknown>;

    // regularMarketChangePercent from price module is a decimal like 0.012 → multiply by 100 if abs < 1
    let changePercent = rawNum(price.regularMarketChangePercent);
    if (changePercent !== undefined && Math.abs(changePercent) < 1) {
      changePercent = changePercent * 100;
    }

    // dividendYield is decimal → multiply by 100
    let divYield = rawNum(summary.dividendYield);
    if (divYield !== undefined) divYield = divYield * 100;

    const quote: YahooQuote = {
      symbol,
      shortName:
        (price.shortName as string | undefined) ??
        (price.shortname as string | undefined),
      longName:
        (price.longName as string | undefined) ??
        (price.longname as string | undefined),
      regularMarketPrice: rawNum(price.regularMarketPrice),
      regularMarketChange: rawNum(price.regularMarketChange),
      regularMarketChangePercent: changePercent,
      regularMarketVolume: rawNum(price.regularMarketVolume),
      regularMarketDayHigh: rawNum(price.regularMarketDayHigh),
      regularMarketDayLow: rawNum(price.regularMarketDayLow),
      chartPreviousClose: rawNum(price.chartPreviousClose) ?? rawNum(price.regularMarketPreviousClose),
      marketCap: rawNum(price.marketCap) ?? rawNum(summary.marketCap),
      trailingPE: rawNum(summary.trailingPE),
      forwardPE: rawNum(summary.forwardPE),
      priceToBook: rawNum(summary.priceToBook) ?? rawNum(financial.priceToBook as unknown),
      fiftyTwoWeekHigh: rawNum(summary.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: rawNum(summary.fiftyTwoWeekLow),
      averageVolume: rawNum(summary.averageVolume),
      dividendYield: divYield,
      currency:
        (price.currency as string | undefined),
      exchange:
        (price.exchangeName as string | undefined) ??
        (price.exchange as string | undefined),
      sector: profile.sector as string | undefined,
      industry: profile.industry as string | undefined,
    };

    return quote;
  } catch (err) {
    console.error('[yahoo-finance] getQuote error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// getFinancials
// ---------------------------------------------------------------------------

export async function getFinancials(symbol: string): Promise<YahooFinancials | null> {
  try {
    const yf = getYF() as {
      quoteSummary: (
        sym: string,
        opts: { modules: string[] }
      ) => Promise<Record<string, Record<string, unknown>>>;
    };

    const result = await yf.quoteSummary(symbol, {
      modules: ['financialData', 'summaryDetail', 'incomeStatementHistory', 'balanceSheetHistory'],
    });

    const fd = (result.financialData ?? {}) as Record<string, unknown>;
    const sd = (result.summaryDetail ?? {}) as Record<string, unknown>;

    // incomeStatementHistory
    const incomeHistory = result.incomeStatementHistory as
      | { incomeStatementHistory?: Array<Record<string, unknown>> }
      | undefined;
    const latestIncome = incomeHistory?.incomeStatementHistory?.[0] ?? {};

    // balanceSheetHistory
    const bsHistory = result.balanceSheetHistory as
      | { balanceSheetStatements?: Array<Record<string, unknown>> }
      | undefined;
    const latestBS = bsHistory?.balanceSheetStatements?.[0] ?? {};

    // helpers for percentage ratios (decimal → %)
    const pct = (v: unknown) => {
      const n = rawNum(v);
      return n !== undefined ? n * 100 : undefined;
    };

    let divYield = rawNum(sd.dividendYield);
    if (divYield !== undefined) divYield = divYield * 100;

    let payoutRatio = rawNum(sd.payoutRatio);
    if (payoutRatio !== undefined) payoutRatio = payoutRatio * 100;

    const financials: YahooFinancials = {
      symbol,
      // financialData
      totalRevenue: rawNum(fd.totalRevenue),
      grossProfits: rawNum(fd.grossProfits),
      ebitda: rawNum(fd.ebitda),
      netIncomeToCommon: rawNum(fd.netIncomeToCommon),
      returnOnEquity: pct(fd.returnOnEquity),
      returnOnAssets: pct(fd.returnOnAssets),
      netMargin: pct(fd.profitMargins),
      operatingMargin: pct(fd.operatingMargins),
      grossMargin: pct(fd.grossMargins),
      revenueGrowth: pct(fd.revenueGrowth),
      earningsGrowth: pct(fd.earningsGrowth),
      totalCash: rawNum(fd.totalCash),
      totalDebt: rawNum(fd.totalDebt),
      debtToEquity: rawNum(fd.debtToEquity), // Yahoo already returns as percentage
      currentRatio: rawNum(fd.currentRatio),
      quickRatio: rawNum(fd.quickRatio),
      freeCashflow: rawNum(fd.freeCashflow),
      operatingCashflow: rawNum(fd.operatingCashflow),
      revenuePerShare: rawNum(fd.revenuePerShare),
      // summaryDetail
      trailingPE: rawNum(sd.trailingPE),
      forwardPE: rawNum(sd.forwardPE),
      priceToBook: rawNum(sd.priceToBook),
      dividendYield: divYield,
      payoutRatio,
      beta: rawNum(sd.beta),
      // balanceSheetHistory
      totalAssets: rawNum(latestBS.totalAssets),
      totalStockholderEquity: rawNum(latestBS.totalStockholderEquity),
      // incomeStatementHistory
      totalRevenueLY: rawNum(latestIncome.totalRevenue),
      netIncomeLY: rawNum(latestIncome.netIncome),
    };

    return financials;
  } catch (err) {
    console.error('[yahoo-finance] getFinancials error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// getHistoricalPrices
// ---------------------------------------------------------------------------

const PERIOD_DAYS: Record<string, number> = {
  '1mo': 30,
  '3mo': 90,
  '1y': 365,
  '5y': 1825,
};

export async function getHistoricalPrices(
  symbol: string,
  period: '1mo' | '3mo' | '1y' | '5y'
): Promise<YahooHistoricalPrice[]> {
  try {
    const yf = getYF() as {
      chart: (
        sym: string,
        opts: { period1: Date; interval: string }
      ) => Promise<{ quotes?: Array<Record<string, unknown>> }>;
    };

    const days = PERIOD_DAYS[period] ?? 365;
    const period1 = new Date(Date.now() - days * 86400000);
    const interval = period === '5y' ? '1wk' : '1d';

    const result = await yf.chart(symbol, { period1, interval });
    const quotes = result.quotes ?? [];

    return quotes.map((q) => ({
      date: q.date instanceof Date ? q.date : new Date(q.date as string),
      open: rawNum(q.open),
      high: rawNum(q.high),
      low: rawNum(q.low),
      close: rawNum(q.close),
      adjclose: rawNum(q.adjclose),
      volume: rawNum(q.volume),
    }));
  } catch (err) {
    console.error('[yahoo-finance] getHistoricalPrices error:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// getROEHistory
// ---------------------------------------------------------------------------

export async function getROEHistory(
  symbol: string
): Promise<Array<{ year: number; roe: number }>> {
  try {
    const yf = getYF() as {
      fundamentalsTimeSeries: (
        sym: string,
        opts: { period1: Date; period2: Date; module: string }
      ) => Promise<Array<Record<string, unknown>>>;
    };

    const period2 = new Date();
    const period1 = new Date();
    period1.setFullYear(period1.getFullYear() - 6);

    // Fetch income + balance sheet quarterly data in parallel
    const [finData, bsData] = await Promise.all([
      yf.fundamentalsTimeSeries(symbol, { period1, period2, module: 'financials' }),
      yf.fundamentalsTimeSeries(symbol, { period1, period2, module: 'balance-sheet' }),
    ]);

    // Group quarterly net income by fiscal year (sum 4 quarters)
    const incomeByYear = new Map<number, number>();
    for (const item of finData) {
      const date = item.date instanceof Date ? item.date : new Date(item.date as string);
      const year = date.getFullYear();
      const ni = typeof item.netIncome === 'number' ? item.netIncome : 0;
      incomeByYear.set(year, (incomeByYear.get(year) ?? 0) + ni);
    }

    // Get most recent stockholdersEquity per year (end of year balance)
    const equityByYear = new Map<number, number>();
    for (const item of bsData) {
      const date = item.date instanceof Date ? item.date : new Date(item.date as string);
      const year = date.getFullYear();
      const eq = typeof item.stockholdersEquity === 'number' ? item.stockholdersEquity : undefined;
      if (eq !== undefined && eq !== 0) {
        // Keep the most recent (last) record per year
        equityByYear.set(year, eq);
      }
    }

    const roeData: Array<{ year: number; roe: number }> = [];
    incomeByYear.forEach((netIncome, year) => {
      const equity = equityByYear.get(year);
      if (!equity || equity === 0) return;
      roeData.push({ year, roe: (netIncome / equity) * 100 });
    });

    // Sort ascending by year, return last 5 years
    return roeData
      .sort((a, b) => a.year - b.year)
      .slice(-5);
  } catch (err) {
    console.error('[yahoo-finance] getROEHistory error:', err);
    return [];
  }
}
