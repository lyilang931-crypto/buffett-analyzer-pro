"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  BuffettPrinciplesCard,
  StockHeader,
  FinancialsCard,
  SafetyMarginCard,
  PriceTargetCard,
} from "@/components/analysis";
import type { PriceTarget } from "@/components/analysis";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { ROEChart, PriceChart, MoatRadar } from "@/components/charts";
import { SearchBar } from "@/components/ui";
import { Loader2, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { YahooFinancials } from "@/lib/yahoo-finance";
import { Buffett7PrinciplesResult } from "@/lib/buffett-7-principles";

interface AnalysisData {
  quote: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number;
    volume: number;
    pe: number;
    forwardPe: number;
    pb: number;
    dividendYield: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    exchange: string;
    sector?: string;
    industry?: string;
  };
  financials: YahooFinancials;
  buffettAnalysis: Buffett7PrinciplesResult;
  safetyMargin: {
    intrinsicValue: number;
    currentPrice: number;
    marginPercent: number;
  };
  priceTargets: PriceTarget[];
  priceHistory: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose: number;
  }>;
  roeHistory: Array<{
    year: number;
    roe: number;
    industryAverage: number;
  }>;
}

export default function AnalyzePage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();

  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "error">("live");

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analyze/${symbol}`);
      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || "データ取得失敗");
      }

      setData(json.data);
      setDataSource("live");
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラー";
      setError(message);
      setDataSource("error");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-gold animate-spin" />
        <div className="text-center">
          <p className="text-text-primary font-semibold text-lg">{symbol} を分析中...</p>
          <p className="text-text-muted text-sm mt-1">Yahoo Finance からデータ取得中</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="h-12 w-12 text-danger" />
        <div className="text-center">
          <p className="text-text-primary font-semibold text-lg">「{symbol}」の取得に失敗</p>
          <p className="text-text-muted text-sm mt-1 max-w-md">{error}</p>
          <p className="text-text-muted text-xs mt-2">
            ティッカーシンボルを確認してください（例: AAPL, NVDA, 7203.T）
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-background rounded-lg font-medium hover:bg-gold-light transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            再試行
          </button>
        </div>
        <div className="w-full max-w-md mt-4">
          <SearchBar />
        </div>
      </div>
    );
  }

  const { quote, financials, buffettAnalysis, safetyMargin, priceTargets, priceHistory, roeHistory } = data;

  // MoatRadar用ファクター（実財務から算出）
  const moatFactors = {
    brandPower: Math.min(100, ((financials.grossMargin ?? 0) / 60) * 100),
    switchingCost: Math.min(100, ((financials.returnOnEquity ?? 0) / 30) * 100),
    networkEffect: Math.min(100, ((financials.revenueGrowth ?? 0) / 30) * 100 + 30),
    costAdvantage: Math.min(100, ((financials.operatingMargin ?? 0) / 30) * 100),
    intangibleAssets: Math.min(100, ((financials.returnOnAssets ?? 0) / 20) * 100),
  };

  return (
    <div className="space-y-5">
      {/* データソースバッジ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {dataSource === "live"
            ? <><Wifi className="h-3 w-3 text-success" /><span className="text-success">Yahoo Finance ライブデータ</span></>
            : <><WifiOff className="h-3 w-3 text-danger" /><span className="text-danger">データ取得エラー</span></>
          }
        </div>
        <button
          onClick={fetchAnalysis}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-gold transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          更新
        </button>
      </div>

      {/* 銘柄ヘッダー */}
      <StockHeader
        symbol={quote.symbol}
        name={quote.name}
        price={quote.price}
        change={quote.change}
        changePercent={quote.changePercent}
        marketCap={quote.marketCap}
        exchange={quote.exchange}
        sector={quote.sector}
        industry={quote.industry}
        fiftyTwoWeekHigh={quote.fiftyTwoWeekHigh}
        fiftyTwoWeekLow={quote.fiftyTwoWeekLow}
        signal={buffettAnalysis.signal}
      />

      {/* バフェット7原則 */}
      <BuffettPrinciplesCard analysis={buffettAnalysis} />

      {/* 株価チャートと経済的な堀 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="株価チャート（1年）" subtitle="Yahoo Finance リアルタイム" />
            <CardContent>
              {priceHistory.length > 0 ? (
                <PriceChart data={priceHistory} height={300} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-text-muted">
                  チャートデータなし
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader title="経済的な堀" subtitle="競争優位性スコア" />
            <CardContent>
              <MoatRadar moatFactors={moatFactors} size={280} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 未来の株価予測 */}
      {priceTargets && priceTargets.length > 0 && (
        <PriceTargetCard
          currentPrice={safetyMargin.currentPrice}
          targets={priceTargets}
          tenBaggerProbability={buffettAnalysis.tenBaggerProbability}
        />
      )}

      {/* ROE履歴 */}
      {roeHistory.length > 0 && (
        <Card>
          <CardHeader
            title="ROE推移"
            subtitle="自己資本利益率の履歴（バフェット基準: 15%以上）"
            action={
              <span className="text-sm font-semibold mono-number">
                現在: <span className={(financials.returnOnEquity ?? 0) >= 15 ? "text-success" : "text-warning"}>
                  {(financials.returnOnEquity ?? 0).toFixed(1)}%
                </span>
              </span>
            }
          />
          <CardContent>
            <ROEChart data={roeHistory} height={220} />
          </CardContent>
        </Card>
      )}

      {/* 安全マージン */}
      <SafetyMarginCard
        intrinsicValue={safetyMargin.intrinsicValue}
        currentPrice={safetyMargin.currentPrice}
        marginPercent={safetyMargin.marginPercent}
      />

      {/* 財務指標 */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">財務指標</h2>
        <FinancialsCard
          financials={financials}
          pe={quote.pe}
          forwardPe={quote.forwardPe}
          pb={quote.pb}
          dividendYield={quote.dividendYield}
        />
      </div>

      {/* 免責事項 */}
      <div className="text-xs text-text-muted p-4 bg-surface border border-surface-light rounded-lg">
        ⚠️ <strong>免責事項:</strong> 本ツールの分析結果は教育・情報提供目的のみです。
        投資判断の根拠とする場合は、必ずご自身でリサーチを行い、資格のある財務アドバイザーにご相談ください。
        過去のパフォーマンスは将来の結果を保証しません。
      </div>
    </div>
  );
}
