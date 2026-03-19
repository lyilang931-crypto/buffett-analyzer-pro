"use client";

import { Card, CardHeader, CardContent } from "@/components/ui";
import { BuffettGauge } from "@/components/charts";
import { BuffettIndex } from "@/types/stock";
import { formatUSD } from "@/lib/utils";
import { Activity } from "lucide-react";

interface BuffettIndexCardProps {
  index: BuffettIndex;
}

export function BuffettIndexCard({ index }: BuffettIndexCardProps) {
  return (
    <Card glow>
      <CardHeader
        title="市場評価指数"
        subtitle="米国株式市場の過熱度"
        action={
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Activity className="h-3 w-3" />
            リアルタイム
          </div>
        }
      />
      <CardContent>
        <div className="flex flex-col items-center">
          <BuffettGauge index={index} size={220} />
          <div className="grid grid-cols-2 gap-6 mt-6 w-full">
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">時価総額</p>
              <p className="text-lg font-semibold mono-number">
                {formatUSD(index.totalMarketCap)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">GDP</p>
              <p className="text-lg font-semibold mono-number">
                {formatUSD(index.gdp)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-surface-light w-full">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">歴史的平均</span>
              <span className="mono-number">{index.historicalAverage}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
