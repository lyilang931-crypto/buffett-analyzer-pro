"use client";

import { Card, CardHeader, CardContent } from "@/components/ui";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PriceTarget {
  period: string;   // "1年後", "3年後", "5年後"
  years: number;
  conservative: number;
  base: number;
  optimistic: number;
}

interface PriceTargetCardProps {
  currentPrice: number;
  targets: PriceTarget[];
  tenBaggerProbability: number;
}

function TargetBar({
  label,
  value,
  currentPrice,
  colorClass,
}: {
  label: string;
  value: number;
  currentPrice: number;
  colorClass: string;
}) {
  const pct = currentPrice > 0 ? ((value - currentPrice) / currentPrice) * 100 : 0;
  const isUp = pct >= 0;
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-text-muted w-14">{label}</span>
      <div className="flex-1 mx-2 h-1.5 bg-surface-light rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", colorClass)}
          style={{ width: `${Math.min(100, Math.abs(pct) / 3)}%` }}
        />
      </div>
      <div className="text-right">
        <span className={cn("font-mono text-sm font-semibold", isUp ? "text-success" : "text-danger")}>
          ${value.toFixed(0)}
        </span>
        <span className={cn("text-xs ml-1", isUp ? "text-success" : "text-danger")}>
          ({isUp ? "+" : ""}{pct.toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}

export function PriceTargetCard({ currentPrice, targets, tenBaggerProbability }: PriceTargetCardProps) {
  return (
    <Card>
      <CardHeader
        title="株価目標・未来予測"
        subtitle="保守的DCF + 成長率ベース予測（保守的・標準・楽観的）"
        action={
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30">
            <Target className="h-3.5 w-3.5 text-gold" />
            <span className="text-xs font-bold text-gold">10倍株確率 {tenBaggerProbability}%</span>
          </div>
        }
      />
      <CardContent>
        {/* 現在株価 */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-surface-light rounded-lg">
          <div className="text-text-muted text-sm">現在株価</div>
          <div className="font-mono text-xl font-bold text-gold">${currentPrice.toFixed(2)}</div>
          <div className="text-xs text-text-muted ml-auto">基準値</div>
        </div>

        {/* 期間別目標株価 */}
        <div className="space-y-4">
          {targets.map((t) => {
            const baseReturn = currentPrice > 0 ? ((t.base - currentPrice) / currentPrice) * 100 : 0;
            const isBull = baseReturn >= 0;
            return (
              <div key={t.period} className="p-3 rounded-lg border border-surface-light">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isBull
                      ? <TrendingUp className="h-4 w-4 text-success" />
                      : <TrendingDown className="h-4 w-4 text-danger" />
                    }
                    <span className="text-sm font-semibold text-text-primary">{t.period}</span>
                  </div>
                  <div className={cn(
                    "text-sm font-bold px-2 py-0.5 rounded",
                    isBull ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                  )}>
                    標準: ${t.base.toFixed(0)} ({isBull ? "+" : ""}{baseReturn.toFixed(0)}%)
                  </div>
                </div>
                <div className="space-y-1">
                  <TargetBar label="楽観的" value={t.optimistic} currentPrice={currentPrice} colorClass="bg-success" />
                  <TargetBar label="標準" value={t.base} currentPrice={currentPrice} colorClass="bg-gold" />
                  <TargetBar label="保守的" value={t.conservative} currentPrice={currentPrice} colorClass="bg-text-muted" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 免責 */}
        <p className="text-xs text-text-muted mt-3 leading-relaxed">
          ※ 目標株価はEPS成長率・PEマルチプル・DCF法による試算です。実際の株価を保証するものではありません。
        </p>
      </CardContent>
    </Card>
  );
}
