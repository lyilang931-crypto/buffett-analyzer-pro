"use client";

import { Card, CardHeader, CardContent } from "@/components/ui";
import { YahooFinancials } from "@/lib/yahoo-finance";
import { formatUSD } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MetricRowProps {
  label: string;
  value: string;
  good?: boolean | null;
  bold?: boolean;
}

function MetricRow({ label, value, good, bold }: MetricRowProps) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-surface-light last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn(
        "font-mono text-sm font-medium",
        bold && "font-bold",
        good === true && "text-success",
        good === false && "text-danger",
        good === null || good === undefined && "text-text-primary",
      )}>
        {value}
      </span>
    </div>
  );
}

interface FinancialsCardProps {
  financials: YahooFinancials;
  pe: number;
  forwardPe: number;
  pb: number;
  dividendYield: number;
}

export function FinancialsCard({ financials, pe, forwardPe, pb, dividendYield }: FinancialsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 収益性 */}
      <Card>
        <CardHeader title="収益性" subtitle="Profitability" />
        <CardContent>
          <MetricRow label="粗利益率" value={`${(financials.grossMargin ?? 0).toFixed(1)}%`} good={(financials.grossMargin ?? 0) >= 40} />
          <MetricRow label="営業利益率" value={`${(financials.operatingMargin ?? 0).toFixed(1)}%`} good={(financials.operatingMargin ?? 0) >= 15} />
          <MetricRow label="純利益率" value={`${(financials.netMargin ?? 0).toFixed(1)}%`} good={(financials.netMargin ?? 0) >= 10} />
          <MetricRow label="ROE" value={`${(financials.returnOnEquity ?? 0).toFixed(1)}%`} good={(financials.returnOnEquity ?? 0) >= 15} bold />
          <MetricRow label="ROA" value={`${(financials.returnOnAssets ?? 0).toFixed(1)}%`} good={(financials.returnOnAssets ?? 0) >= 8} />
        </CardContent>
      </Card>

      {/* バリュエーション */}
      <Card>
        <CardHeader title="バリュエーション" subtitle="Valuation" />
        <CardContent>
          <MetricRow label="PER（実績）" value={pe > 0 ? pe.toFixed(1) : "N/A"} good={pe > 0 && pe < 25 ? true : pe > 40 ? false : null} bold />
          <MetricRow label="PER（予想）" value={forwardPe > 0 ? forwardPe.toFixed(1) : "N/A"} />
          <MetricRow label="PBR" value={pb > 0 ? pb.toFixed(2) : "N/A"} good={pb > 0 && pb < 3 ? true : pb > 6 ? false : null} />
          <MetricRow label="配当利回り" value={dividendYield > 0 ? `${dividendYield.toFixed(2)}%` : "N/A"} />
          <MetricRow label="売上成長" value={`${(financials.revenueGrowth ?? 0).toFixed(1)}%`} good={(financials.revenueGrowth ?? 0) >= 10} />
        </CardContent>
      </Card>

      {/* 財務健全性 */}
      <Card>
        <CardHeader title="財務健全性" subtitle="Balance Sheet" />
        <CardContent>
          <MetricRow label="負債/資本比率" value={`${(financials.debtToEquity ?? 0).toFixed(1)}%`} good={(financials.debtToEquity ?? 0) < 100} bold />
          <MetricRow label="流動比率" value={(financials.currentRatio ?? 0).toFixed(2)} good={(financials.currentRatio ?? 0) >= 1.5} />
          <MetricRow label="総資産" value={formatUSD(financials.totalAssets ?? 0)} />
          <MetricRow label="現金・同等物" value={formatUSD(financials.totalCash ?? 0)} good={(financials.totalCash ?? 0) > 0} />
          <MetricRow label="総負債" value={formatUSD(financials.totalDebt ?? 0)} good={(financials.totalDebt ?? 0) < (financials.totalAssets ?? Infinity) * 0.5} />
        </CardContent>
      </Card>
    </div>
  );
}
