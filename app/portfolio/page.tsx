"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, Minus, ExternalLink, RefreshCw } from "lucide-react";
import type { BerkshirePortfolio, Holding } from "@/lib/sec-13f";

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────
function fmtValue(v: number) {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}
function fmtShares(n: number) {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

// ──────────────────────────────────────────────────────
// Change badge
// ──────────────────────────────────────────────────────
function ChangeBadge({ holding }: { holding: Holding }) {
  const { change, changePercent, changeShares } = holding;

  if (change === "NEW") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
      ✦ NEW
    </span>
  );
  if (change === "SOLD") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-danger/15 text-danger border border-danger/30">
      ✕ SOLD
    </span>
  );
  if (change === "UNCHANGED") return (
    <span className="flex items-center gap-1 text-xs text-text-muted">
      <Minus className="h-3 w-3" /> 変化なし
    </span>
  );
  if (change === "INCREASED") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-success/15 text-success border border-success/30">
      <TrendingUp className="h-3 w-3" />
      +{changePercent.toFixed(1)}%
    </span>
  );
  // DECREASED
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30">
      <TrendingDown className="h-3 w-3" />
      {changePercent.toFixed(1)}%
    </span>
  );
}

// ──────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<BerkshirePortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "INCREASED" | "DECREASED" | "SOLD">("ALL");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/berkshire-portfolio");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPortfolio(json.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = portfolio?.holdings.filter(h =>
    filter === "ALL" ? h.change !== "SOLD" : h.change === filter
  ) ?? [];

  // Stats
  const newCount = portfolio?.holdings.filter(h => h.change === "NEW").length ?? 0;
  const soldCount = portfolio?.holdings.filter(h => h.change === "SOLD").length ?? 0;
  const incrCount = portfolio?.holdings.filter(h => h.change === "INCREASED").length ?? 0;
  const decrCount = portfolio?.holdings.filter(h => h.change === "DECREASED").length ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gold-gradient leading-tight">
          バークシャー・ハサウェイ ポートフォリオ
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          SEC 13F申告書 (最新四半期) · リアルデータ
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 text-gold animate-spin" />
          <p className="text-text-secondary text-sm">SEC EDGARからデータ取得中...</p>
          <p className="text-text-muted text-xs">初回は10〜20秒かかります</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          データ取得エラー: {error}
        </div>
      )}

      {portfolio && !loading && (
        <>
          {/* Meta info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface border border-surface-light rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">申告期間</p>
              <p className="text-sm font-semibold text-gold">{portfolio.periodOfReport}</p>
              <p className="text-xs text-text-muted mt-0.5">申告日: {portfolio.filingDate}</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">ポートフォリオ総額</p>
              <p className="text-lg font-bold mono-number text-gold">{fmtValue(portfolio.totalValueDollars)}</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">保有銘柄数</p>
              <p className="text-lg font-bold mono-number">{portfolio.holdings.filter(h => h.change !== "SOLD").length}</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-4">
              <p className="text-xs text-text-muted mb-1">前四半期比較</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {newCount > 0 && <span className="text-xs text-blue-400">新規 {newCount}</span>}
                {incrCount > 0 && <span className="text-xs text-success">増加 {incrCount}</span>}
                {decrCount > 0 && <span className="text-xs text-orange-400">減少 {decrCount}</span>}
                {soldCount > 0 && <span className="text-xs text-danger">売却 {soldCount}</span>}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["ALL", "NEW", "INCREASED", "DECREASED", "SOLD"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  filter === f
                    ? "bg-gold text-background"
                    : "bg-surface-light text-text-secondary hover:bg-gold/20"
                )}
              >
                {f === "ALL" ? `全銘柄 (${portfolio.holdings.filter(h=>h.change!=="SOLD").length})`
                  : f === "NEW" ? `新規 (${newCount})`
                  : f === "INCREASED" ? `増加 (${incrCount})`
                  : f === "DECREASED" ? `減少 (${decrCount})`
                  : `売却 (${soldCount})`}
              </button>
            ))}
            <button
              onClick={load}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs hover:bg-gold/20 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              更新
            </button>
          </div>

          {/* Holdings table */}
          <div className="bg-surface border border-surface-light rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 border-b border-surface-light text-xs text-text-muted">
              <div className="col-span-1">#</div>
              <div className="col-span-3">銘柄</div>
              <div className="col-span-2 text-right">評価額</div>
              <div className="col-span-2 text-right">保有株数</div>
              <div className="col-span-2 text-right">比率</div>
              <div className="col-span-2 text-center">前Q比</div>
            </div>

            <div className="divide-y divide-surface-light">
              {filtered.map((h) => (
                <HoldingRow key={h.cusip} holding={h} totalValue={portfolio.totalValueDollars} />
              ))}
              {filtered.length === 0 && (
                <div className="py-8 text-center text-text-muted text-sm">
                  該当銘柄なし
                </div>
              )}
            </div>
          </div>

          {/* Source note */}
          <p className="text-xs text-text-muted text-center">
            データソース: SEC EDGAR 13F-HR · 前四半期: {portfolio.prevPeriodOfReport} との比較
            · 取得: {new Date(portfolio.fetchedAt).toLocaleTimeString("ja-JP")}
          </p>
        </>
      )}
    </div>
  );
}

function HoldingRow({ holding, totalValue }: { holding: Holding; totalValue: number }) {
  const isSold = holding.change === "SOLD";

  return (
    <div className={cn(
      "grid md:grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-surface-light/50 transition-colors",
      isSold && "opacity-50"
    )}>
      {/* Mobile layout */}
      <div className="md:hidden flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-text-muted text-xs w-5 mt-0.5">{isSold ? "–" : holding.rank}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{holding.nameOfIssuer}</span>
              {holding.ticker && (
                <Link href={`/analyze/${holding.ticker}`} className="text-xs text-gold hover:underline flex items-center gap-0.5">
                  {holding.ticker} <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-text-secondary mono-number">{fmtValue(holding.valueDollars)}</span>
              {!isSold && <span className="text-xs text-text-muted">{holding.portfolioPercent.toFixed(1)}%</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <ChangeBadge holding={holding} />
          {holding.change !== "UNCHANGED" && holding.change !== "NEW" && holding.change !== "SOLD" && (
            <p className="text-xs text-text-muted mt-1">
              {holding.changeShares > 0 ? "+" : ""}{fmtShares(holding.changeShares)}株
            </p>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:contents">
        {/* Rank */}
        <div className="col-span-1 text-text-muted text-sm">{isSold ? "–" : holding.rank}</div>

        {/* Name + ticker */}
        <div className="col-span-3">
          <div className="font-medium text-sm leading-tight">{holding.nameOfIssuer}</div>
          {holding.ticker ? (
            <Link href={`/analyze/${holding.ticker}`} className="text-xs text-gold hover:underline flex items-center gap-0.5 mt-0.5 w-fit">
              {holding.ticker} <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          ) : (
            <span className="text-xs text-text-muted">{holding.cusip}</span>
          )}
        </div>

        {/* Value */}
        <div className="col-span-2 text-right mono-number text-sm">
          {isSold ? <span className="text-danger">全売却</span> : fmtValue(holding.valueDollars)}
        </div>

        {/* Shares */}
        <div className="col-span-2 text-right mono-number text-sm text-text-secondary">
          {isSold ? "–" : fmtShares(holding.shares)}
        </div>

        {/* Portfolio % with bar */}
        <div className="col-span-2 text-right">
          {!isSold && (
            <>
              <span className="text-sm mono-number font-medium">{holding.portfolioPercent.toFixed(1)}%</span>
              <div className="w-full bg-surface-light rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 rounded-full bg-gold"
                  style={{ width: `${Math.min(100, holding.portfolioPercent * 2)}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* Change */}
        <div className="col-span-2 flex flex-col items-center gap-0.5">
          <ChangeBadge holding={holding} />
          {(holding.change === "INCREASED" || holding.change === "DECREASED") && (
            <span className="text-xs text-text-muted mono-number">
              {holding.changeShares > 0 ? "+" : ""}{fmtShares(holding.changeShares)}株
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
