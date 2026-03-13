import {
  BuffettIndexCard,
  WatchlistStocks,
  MarketOverview,
} from "@/components/dashboard";
import { getBuffettIndex } from "@/lib/stock-api";
import { getMarketIndices } from "@/lib/yahoo-finance";

export default async function DashboardPage() {
  const [buffettIndex, marketData] = await Promise.all([
    getBuffettIndex(),
    getMarketIndices(),
  ]);

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

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gold-gradient leading-tight">
          バフェット分析ダッシュボード
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          バフェットの7原則に基づくリアルタイム銘柄分析
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BuffettIndexCard index={buffettIndex} />
        </div>
        <div className="lg:col-span-2">
          <WatchlistStocks />
        </div>
      </div>

      <MarketOverview data={marketData} />

      <div className="bg-surface border border-gold/20 rounded-xl p-6">
        <blockquote className="text-lg text-text-secondary italic">
          &ldquo;素晴らしい企業を適正な価格で買う方が、普通の企業を素晴らしい価格で買うよりもはるかに良い&rdquo;
        </blockquote>
        <p className="text-gold mt-2 text-sm">— ウォーレン・バフェット</p>
      </div>
    </div>
  );
}
