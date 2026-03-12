"use client";

import { Card, CardHeader, CardContent, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle } from "lucide-react";

interface SafetyMarginCardProps {
  intrinsicValue: number;
  currentPrice: number;
  marginPercent: number;
}

export function SafetyMarginCard({
  intrinsicValue,
  currentPrice,
  marginPercent,
}: SafetyMarginCardProps) {
  const isUndervalued = marginPercent > 0;
  const displayMargin = Math.abs(marginPercent);

  return (
    <Card>
      <CardHeader
        title="安全マージン分析"
        subtitle="内在価値 vs 現在株価（DCF + グレアム式）"
      />
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {/* 内在価値 */}
          <div className="text-center p-4 bg-surface-light rounded-xl">
            <div className="text-xs text-text-muted mb-1">推定内在価値</div>
            <div className="text-2xl font-bold text-gold mono-number">
              ${intrinsicValue.toFixed(2)}
            </div>
            <div className="text-xs text-text-muted mt-1">DCF + グレアム平均</div>
          </div>

          {/* 現在株価 */}
          <div className="text-center p-4 bg-surface-light rounded-xl">
            <div className="text-xs text-text-muted mb-1">現在株価</div>
            <div className="text-2xl font-bold text-text-primary mono-number">
              ${currentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-text-muted mt-1">リアルタイム</div>
          </div>

          {/* 安全マージン */}
          <div className={cn(
            "text-center p-4 rounded-xl",
            isUndervalued ? "bg-success/10" : "bg-danger/10"
          )}>
            <div className="text-xs text-text-muted mb-1">安全マージン</div>
            <div className={cn(
              "text-2xl font-bold mono-number",
              isUndervalued ? "text-success" : "text-danger"
            )}>
              {isUndervalued ? "+" : "-"}{displayMargin.toFixed(1)}%
            </div>
            <div className={cn("text-xs mt-1", isUndervalued ? "text-success" : "text-danger")}>
              {isUndervalued ? "割安" : "割高"}
            </div>
          </div>
        </div>

        {/* ゲージビジュアル */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {isUndervalued
              ? <Shield className="h-5 w-5 text-success flex-shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0" />
            }
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-secondary">安全マージン</span>
                <span className={cn(
                  "font-semibold mono-number",
                  isUndervalued ? "text-success" : "text-danger"
                )}>
                  {isUndervalued ? "+" : ""}{marginPercent.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, 50 + marginPercent / 2))}
                variant={isUndervalued ? "success" : "danger"}
                size="lg"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>大幅割高</span>
                <span>適正</span>
                <span>大幅割安</span>
              </div>
            </div>
          </div>
        </div>

        {/* 注意書き */}
        <p className="text-xs text-text-muted mt-4 p-3 bg-surface-light rounded-lg">
          ⚠️ 内在価値は予想EPS成長率を基にした推定値です。実際の投資判断には追加の調査が必要です。
        </p>
      </CardContent>
    </Card>
  );
}
