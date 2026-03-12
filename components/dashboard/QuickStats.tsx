"use client";

import { Card, CardContent } from "@/components/ui";
import { Target, Shield, TrendingUp, Award } from "lucide-react";

interface QuickStatsProps {
  totalAnalyzed: number;
  passingStocks: number;
  tenBaggerCandidates: number;
  avgMoatScore: number;
}

export function QuickStats({
  totalAnalyzed,
  passingStocks,
  tenBaggerCandidates,
  avgMoatScore,
}: QuickStatsProps) {
  const stats = [
    {
      label: "分析済み銘柄",
      value: totalAnalyzed,
      icon: Target,
      color: "text-gold",
      bgColor: "bg-gold/10",
    },
    {
      label: "バフェット基準達成",
      value: passingStocks,
      icon: Award,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "10倍株候補",
      value: tenBaggerCandidates,
      icon: TrendingUp,
      color: "text-gold-light",
      bgColor: "bg-gold-light/10",
    },
    {
      label: "平均堀スコア",
      value: avgMoatScore,
      suffix: "点",
      icon: Shield,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} hover>
          <CardContent className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{stat.label}</p>
              <p className="text-2xl font-bold mono-number">
                {stat.value}
                {stat.suffix && (
                  <span className="text-sm font-normal text-text-secondary ml-1">
                    {stat.suffix}
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
