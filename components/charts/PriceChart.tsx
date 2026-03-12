"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PriceHistory } from "@/types/stock";
import { formatUSD } from "@/lib/utils";

interface PriceChartProps {
  data: PriceHistory[];
  height?: number;
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  const isPositive =
    data.length >= 2 && data[data.length - 1].close >= data[0].close;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? "#22c55e" : "#ef4444"}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? "#22c55e" : "#ef4444"}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis
          dataKey="date"
          stroke="#6b6b6b"
          fontSize={11}
          tickLine={false}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#6b6b6b"
          fontSize={11}
          tickLine={false}
          domain={["auto", "auto"]}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#a0a0a0" }}
          formatter={(value) => [formatUSD(value as number), "価格"]}
          labelFormatter={(label) => {
            const date = new Date(label);
            return date.toLocaleDateString("ja-JP");
          }}
        />
        <Area
          type="monotone"
          dataKey="close"
          stroke={isPositive ? "#22c55e" : "#ef4444"}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPrice)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
