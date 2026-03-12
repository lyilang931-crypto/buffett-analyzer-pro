"use client";

import { Card, CardHeader, CardContent, Stat, StatGrid } from "@/components/ui";
import { TrendingUp, DollarSign, BarChart2, Activity } from "lucide-react";

interface MarketData {
  sp500: { value: number; change: number };
  nasdaq: { value: number; change: number };
  dow: { value: number; change: number };
  vix: { value: number; change: number };
}

interface MarketOverviewProps {
  data: MarketData;
}

export function MarketOverview({ data }: MarketOverviewProps) {
  return (
    <Card>
      <CardHeader
        title="市場概況"
        subtitle="主要指数のリアルタイム"
      />
      <CardContent>
        <StatGrid columns={2}>
          <Stat
            label="S&P 500"
            value={data.sp500.value.toLocaleString()}
            change={data.sp500.change}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <Stat
            label="NASDAQ"
            value={data.nasdaq.value.toLocaleString()}
            change={data.nasdaq.change}
            icon={<BarChart2 className="h-4 w-4" />}
          />
          <Stat
            label="DOW"
            value={data.dow.value.toLocaleString()}
            change={data.dow.change}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <Stat
            label="VIX"
            value={data.vix.value.toFixed(2)}
            change={data.vix.change}
            icon={<Activity className="h-4 w-4" />}
          />
        </StatGrid>
      </CardContent>
    </Card>
  );
}
