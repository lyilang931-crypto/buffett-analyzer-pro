"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ROEHistory } from "@/types/stock";

interface ROEChartProps {
  data: ROEHistory[];
  height?: number;
}

export function ROEChart({ data, height = 200 }: ROEChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis
          dataKey="year"
          stroke="#6b6b6b"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#6b6b6b"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#a0a0a0" }}
          formatter={(value, name) => [
            `${(value as number).toFixed(1)}%`,
            name === "roe" ? "ROE" : "業界平均",
          ]}
        />
        <ReferenceLine
          y={15}
          stroke="#d4af37"
          strokeDasharray="5 5"
          label={{
            value: "バフェット基準 15%",
            position: "right",
            fill: "#d4af37",
            fontSize: 10,
          }}
        />
        <Line
          type="monotone"
          dataKey="roe"
          stroke="#d4af37"
          strokeWidth={2}
          dot={{ fill: "#d4af37", strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, fill: "#f4e4bc" }}
        />
        <Line
          type="monotone"
          dataKey="industryAverage"
          stroke="#6b6b6b"
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
