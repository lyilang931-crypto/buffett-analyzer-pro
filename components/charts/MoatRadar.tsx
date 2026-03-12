"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BuffettAnalysis } from "@/types/stock";

interface MoatRadarProps {
  moatFactors: BuffettAnalysis["moatFactors"];
  size?: number;
}

export function MoatRadar({ moatFactors, size = 250 }: MoatRadarProps) {
  const data = [
    { factor: "ブランド力", value: moatFactors.brandPower, fullMark: 100 },
    { factor: "スイッチングコスト", value: moatFactors.switchingCost, fullMark: 100 },
    { factor: "ネットワーク効果", value: moatFactors.networkEffect, fullMark: 100 },
    { factor: "コスト優位性", value: moatFactors.costAdvantage, fullMark: 100 },
    { factor: "無形資産", value: moatFactors.intangibleAssets, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data}>
        <PolarGrid stroke="#2a2a2a" />
        <PolarAngleAxis
          dataKey="factor"
          tick={{ fill: "#a0a0a0", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "#6b6b6b", fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="堀スコア"
          dataKey="value"
          stroke="#d4af37"
          fill="#d4af37"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "8px",
          }}
          formatter={(value) => [`${value}点`, "スコア"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
