"use client";

import { useState, useEffect } from "react";
import { StockTable, FilterPanel } from "@/components/screener";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { ScreeningCriteria, BuffettAnalysis } from "@/types/stock";
import { Search, Loader2 } from "lucide-react";

export default function ScreenerPage() {
  const [criteria, setCriteria] = useState<ScreeningCriteria>({});
  const [stocks, setStocks] = useState<BuffettAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStocks() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (criteria.minROE !== undefined)
          params.set("minROE", criteria.minROE.toString());
        if (criteria.maxPE !== undefined)
          params.set("maxPE", criteria.maxPE.toString());
        if (criteria.minMoatScore !== undefined)
          params.set("minMoatScore", criteria.minMoatScore.toString());
        if (criteria.minSafetyMargin !== undefined)
          params.set("minSafetyMargin", criteria.minSafetyMargin.toString());

        const response = await fetch(`/api/stocks?${params.toString()}`);
        const data = await response.json();

        if (data.success && data.data) {
          setStocks(data.data.stocks);
        }
      } catch (error) {
        console.error("Failed to fetch stocks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStocks();
  }, [criteria]);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gold-gradient">
          10倍株スクリーニング
        </h1>
        <p className="text-text-secondary mt-1">
          バフェット基準を満たす銘柄を自動抽出
        </p>
      </div>

      {/* フィルターパネル */}
      <FilterPanel criteria={criteria} onChange={setCriteria} />

      {/* 結果 */}
      <Card>
        <CardHeader
          title="スクリーニング結果"
          subtitle={`${stocks.length}銘柄が条件に一致`}
          action={
            <div className="flex items-center gap-2 text-text-secondary">
              <Search className="h-4 w-4" />
              <span className="text-sm">総合スコア順</span>
            </div>
          }
        />
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-gold animate-spin" />
            </div>
          ) : stocks.length > 0 ? (
            <StockTable stocks={stocks} />
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                条件に一致する銘柄が見つかりませんでした
              </p>
              <p className="text-text-muted text-sm mt-2">
                フィルター条件を調整してください
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 凡例 */}
      <div className="bg-surface border border-surface-light rounded-xl p-4">
        <h3 className="text-sm font-medium text-text-primary mb-3">
          スコアの見方
        </h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <span className="text-text-secondary">80+ 優秀</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gold" />
            <span className="text-text-secondary">60-79 良好</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-text-secondary">40-59 普通</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-text-secondary">40未満 注意</span>
          </div>
        </div>
      </div>
    </div>
  );
}
