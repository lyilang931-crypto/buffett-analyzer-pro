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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} hover>
          <CardContent className="flex items-center gap-2 md:gap-3 p-3 md:p-4">
            <div className={`p-2 md:p-3 rounded-lg flex-shrink-0 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary leading-tight truncate">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold mono-number">
                {stat.value}
                {stat.suffix && (
                  <span className="text-xs md:text-sm font-normal text-text-secondary ml-1">
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
