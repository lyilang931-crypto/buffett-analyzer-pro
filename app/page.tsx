import {
  BuffettIndexCard,
  TopStocksCard,
  MarketOverview,
  QuickStats,
} from "@/components/dashboard";
import { getDashboardStocks } from "@/lib/dashboard-stocks";
import { getBuffettIndex } from "@/lib/stock-api";

export default async function DashboardPage() {
  // リアルデータを並列取得
  const [stocks, buffettIndex] = await Promise.all([
    getDashboardStocks(),
    getBuffettIndex(),
  ]);

  // 統計計算（7原則ベース）
  const passingStocks = stocks.filter(
    (s) => s.buffettAnalysis.signal === "BUY"
  ).length;
  const tenBaggerCandidates = stocks.filter(
    (s) => s.buffettAnalysis.tenBaggerProbability >= 50
  ).length;
  const avgMoatScore = Math.round(
    stocks.reduce(
      (sum, s) => sum + (s.buffettAnalysis.principles[1]?.score ?? 0),
      0
    ) / Math.max(stocks.length, 1)
  );

  // デモ市場データ
  const marketData = {
    sp500: { value: 5234.18, change: 0.82 },
    nasdaq: { value: 16428.82, change: 1.24 },
    dow: { value: 39127.14, change: 0.35 },
    vix: { value: 13.25, change: -2.15 },
  };

  return (
    <div className="space-y-5">
      {/* 免責事項バナー */}
      <div className="flex items-start gap-2 p-3 bg-gold/5 border border-gold/20 rounded-lg text-xs text-text-muted leading-relaxed">
        <span className="flex-shrink-0 mt-0.5">⚠️</span>
        <span>
          <strong className="text-text-secondary">教育目的のみ。</strong>
          投資判断は自己責任でお願いします。当サービスはWarren Buffett氏とは一切関係ありません。
        </span>
      </div>

      {/* ヘッダー */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gold-gradient leading-tight">
          バフェット分析ダッシュボード
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          バフェットの7原則に基づくリアルタイム銘柄分析
        </p>
      </div>

      {/* クイック統計 */}
      <QuickStats
        totalAnalyzed={stocks.length}
        passingStocks={passingStocks}
        tenBaggerCandidates={tenBaggerCandidates}
        avgMoatScore={avgMoatScore}
      />

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* バフェット指数 */}
        <div className="lg:col-span-1">
          <BuffettIndexCard index={buffettIndex} />
        </div>

        {/* トップ銘柄（7原則表示） */}
        <div className="lg:col-span-2">
          <TopStocksCard stocks={stocks} />
        </div>
      </div>

      {/* 市場概況 */}
      <MarketOverview data={marketData} />

      {/* バフェットの言葉 */}
      <div className="bg-surface border border-gold/20 rounded-xl p-6">
        <blockquote className="text-lg text-text-secondary italic">
          &ldquo;素晴らしい企業を適正な価格で買う方が、普通の企業を素晴らしい価格で買うよりもはるかに良い&rdquo;
        </blockquote>
        <p className="text-gold mt-2 text-sm">— ウォーレン・バフェット</p>
      </div>
    </div>
  );
}
