"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { DashboardStock } from "@/lib/dashboard-stocks";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Star,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 原則の短縮ラベル
const PRINCIPLE_LABELS = [
  "能力の輪",
  "経済的堀",
  "安全ﾏｰｼﾞﾝ",
  "長期耐久",
  "優秀経営",
  "Mr.Market",
  "顧客愛",
];

interface SignalConfig {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: React.ElementType;
}

const SIGNAL_CONFIG: Record<string, SignalConfig> = {
  BUY: {
    label: "買い",
    bg: "bg-success/15",
    border: "border-success/50",
    text: "text-success",
    icon: TrendingUp,
  },
  HOLD: {
    label: "保有",
    bg: "bg-gold/15",
    border: "border-gold/50",
    text: "text-gold",
    icon: Minus,
  },
  PASS: {
    label: "見送り",
    bg: "bg-danger/10",
    border: "border-danger/30",
    text: "text-danger",
    icon: TrendingDown,
  },
};

function formatPrice(price: number, symbol: string): string {
  // 日本株・韓国株は小数不要
  if (symbol.endsWith(".T") || symbol.endsWith(".KS")) {
    return price.toLocaleString();
  }
  return price.toFixed(2);
}

function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(1)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(0)}B`;
  return `$${(mc / 1e6).toFixed(0)}M`;
}

interface TopStocksCardProps {
  stocks: DashboardStock[];
}

export function TopStocksCard({ stocks }: TopStocksCardProps) {
  return (
    <Card>
      <CardHeader
        title="注目銘柄 TOP5 — モート7原則評価"
        subtitle="7原則すべてをリアルデータで自動採点"
        action={
          <Link
            href="/screener"
            className="flex items-center gap-1 text-sm text-gold hover:text-gold-light transition-colors"
          >
            スクリーナー
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <CardContent>
        <div className="space-y-3">
          {stocks.map((stock, index) => {
            const ba = stock.buffettAnalysis;
            const cfg = SIGNAL_CONFIG[ba.signal];
            const SignalIcon = cfg.icon;
            const passedCount = ba.principles.filter((p) => p.passed).length;
            const isUp = stock.changePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/analyze/${stock.symbol}`}
                className={cn(
                  "block rounded-xl border p-4 transition-all group",
                  "hover:border-gold/40 hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]",
                  ba.signal === "BUY"
                    ? "border-success/20 bg-success/3"
                    : ba.signal === "HOLD"
                    ? "border-gold/20 bg-gold/3"
                    : "border-surface-light bg-surface"
                )}
              >
                {/* ── Row 1: ランク・シグナル・銘柄・株価 ── */}
                <div className="flex items-start gap-3 mb-3">
                  {/* ランク + シグナルバッジ */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="w-5 text-center text-gold font-bold text-sm">
                      {index + 1}
                    </span>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold",
                        cfg.bg,
                        cfg.border,
                        cfg.text
                      )}
                    >
                      <SignalIcon className="h-3 w-3" />
                      {cfg.label}
                    </div>
                  </div>

                  {/* 銘柄名 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-text-primary group-hover:text-gold transition-colors">
                        {stock.symbol}
                      </span>
                      {/* セクターはデスクトップのみ表示 */}
                      {stock.sector && (
                        <span className="hidden sm:inline text-xs text-text-muted bg-surface-light px-1.5 py-0.5 rounded">
                          {stock.sector}
                        </span>
                      )}
                      {ba.tenBaggerProbability >= 50 && (
                        <span className="flex items-center gap-0.5 text-xs text-gold bg-gold/10 border border-gold/30 px-1.5 py-0.5 rounded-full">
                          <Star className="h-2.5 w-2.5" />
                          <span className="hidden sm:inline">10倍候補</span>
                          <span className="sm:hidden">10x</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {stock.name}
                    </p>
                  </div>

                  {/* 株価 */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono font-bold text-text-primary">
                      {formatPrice(stock.price, stock.symbol)}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-medium",
                        isUp ? "text-success" : "text-danger"
                      )}
                    >
                      {isUp ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* ── Row 2: モート7原則 ── */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-xs text-text-muted">モート7原則:</span>
                    <span
                      className={cn(
                        "text-xs font-bold",
                        passedCount >= 6
                          ? "text-success"
                          : passedCount >= 4
                          ? "text-gold"
                          : "text-danger"
                      )}
                    >
                      {passedCount}/7 クリア
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {ba.principles.map((p, i) => (
                      <div
                        key={i}
                        title={`原則${i + 1}: ${p.name}\n${p.details}\nスコア: ${p.score}`}
                        className={cn(
                          "flex flex-col items-center rounded-lg px-0.5 py-1.5 border transition-all",
                          p.passed
                            ? "bg-success/10 border-success/30"
                            : "bg-danger/8 border-danger/20"
                        )}
                      >
                        {p.passed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success mb-1" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-danger mb-1" />
                        )}
                        <span
                          className={cn(
                            "text-[9px] leading-tight text-center font-medium",
                            p.passed ? "text-success" : "text-danger/80"
                          )}
                        >
                          {PRINCIPLE_LABELS[i]}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-bold mono-number mt-0.5",
                            p.passed ? "text-success" : "text-danger"
                          )}
                        >
                          {p.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Row 3: 総合スコア・10倍確率・1年後予測 ── */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* 総合スコアバー */}
                  <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <span className="text-xs text-text-muted whitespace-nowrap">
                      総合
                    </span>
                    <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          ba.totalScore >= 72
                            ? "bg-success"
                            : ba.totalScore >= 52
                            ? "bg-gold"
                            : "bg-danger"
                        )}
                        style={{ width: `${ba.totalScore}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold mono-number whitespace-nowrap",
                        ba.totalScore >= 72
                          ? "text-success"
                          : ba.totalScore >= 52
                          ? "text-gold"
                          : "text-danger"
                      )}
                    >
                      {ba.totalScore}点
                    </span>
                  </div>

                  {/* 10倍確率 */}
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-gold" />
                    <span className="text-xs text-text-muted">10倍:</span>
                    <span className="text-xs font-bold text-gold mono-number">
                      {ba.tenBaggerProbability}%
                    </span>
                  </div>

                  {/* 1年後予測（モバイルはターゲットのみ、デスクトップはレンジも） */}
                  {stock.priceTarget1yr && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-text-muted" />
                      <span className="text-xs text-text-muted">1年後:</span>
                      <span className="text-xs font-bold text-success mono-number">
                        {formatPrice(stock.priceTarget1yr.base, stock.symbol)}
                      </span>
                      <span className="hidden sm:inline text-xs text-text-muted">
                        ({stock.priceTarget1yr.conservative}〜
                        {stock.priceTarget1yr.optimistic})
                      </span>
                    </div>
                  )}

                  {/* 時価総額（デスクトップのみ） */}
                  {stock.marketCap > 0 && (
                    <span className="hidden md:inline text-xs text-text-muted">
                      {formatMarketCap(stock.marketCap)}
                    </span>
                  )}

                  {/* 詳細リンク */}
                  <div className="ml-auto flex items-center gap-1 text-xs text-gold group-hover:text-gold-light transition-colors">
                    詳細分析
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 凡例 */}
        <div className="mt-4 pt-3 border-t border-surface-light">
          <p className="text-xs text-text-muted text-center">
            各マスにカーソルを当てると原則の詳細が表示されます ·
            クリックで完全分析へ
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
