"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn, formatUSD, getChangeColor } from "@/lib/utils";

interface StockHeaderProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  exchange: string;
  sector?: string;
  industry?: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  signal: "BUY" | "HOLD" | "PASS";
}

export function StockHeader({
  symbol,
  name,
  price,
  change,
  changePercent,
  marketCap,
  exchange,
  sector,
  industry,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
  signal,
}: StockHeaderProps) {
  const isPositive = changePercent >= 0;

  const signalConfig = {
    BUY: { label: "買いシグナル", variant: "success" as const },
    HOLD: { label: "保有シグナル", variant: "gold" as const },
    PASS: { label: "見送りシグナル", variant: "danger" as const },
  };

  // 52週レンジの位置
  const rangePercent =
    fiftyTwoWeekHigh > fiftyTwoWeekLow
      ? ((price - fiftyTwoWeekLow) / (fiftyTwoWeekHigh - fiftyTwoWeekLow)) * 100
      : 50;

  return (
    <div className="bg-surface border border-surface-light rounded-xl p-6">
      {/* ナビゲーション */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-text-muted hover:text-gold transition-colors mb-4 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          {/* 銘柄名・シンボル */}
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="text-3xl font-bold text-gold">{symbol}</h1>
            <Badge variant={signalConfig[signal].variant}>
              {signalConfig[signal].label}
            </Badge>
            {sector && (
              <Badge variant="outline">{sector}</Badge>
            )}
          </div>
          <p className="text-text-secondary text-lg mb-1">{name}</p>
          {industry && (
            <p className="text-text-muted text-sm">{industry} · {exchange}</p>
          )}
        </div>

        {/* 株価情報 */}
        <div className="text-right">
          <div className="text-4xl font-bold mono-number text-text-primary mb-1">
            ${price.toFixed(2)}
          </div>
          <div className={cn(
            "flex items-center justify-end gap-2 text-lg font-semibold mono-number",
            getChangeColor(changePercent)
          )}>
            <span>{isPositive ? "+" : ""}{change.toFixed(2)}</span>
            <span>({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)</span>
          </div>
          <div className="text-sm text-text-muted mt-1">
            時価総額: {formatUSD(marketCap)}
          </div>
        </div>
      </div>

      {/* 52週レンジ */}
      <div className="mt-4 pt-4 border-t border-surface-light">
        <div className="flex justify-between text-xs text-text-muted mb-2">
          <span>52週安値 ${fiftyTwoWeekLow.toFixed(2)}</span>
          <span className="text-text-secondary font-medium">52週レンジ</span>
          <span>52週高値 ${fiftyTwoWeekHigh.toFixed(2)}</span>
        </div>
        <div className="relative h-2 bg-surface-light rounded-full overflow-visible">
          <div
            className="h-full bg-gradient-to-r from-danger via-gold to-success rounded-full"
            style={{ width: "100%" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gold shadow-gold"
            style={{ left: `calc(${rangePercent}% - 6px)` }}
          />
        </div>
        <div className="text-center text-xs text-gold mt-1 mono-number">
          現在値 (レンジの {rangePercent.toFixed(0)}%)
        </div>
      </div>
    </div>
  );
}
