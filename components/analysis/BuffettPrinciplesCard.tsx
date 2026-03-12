"use client";

import { Card, CardHeader, CardContent, Progress } from "@/components/ui";
import { Buffett7PrinciplesResult, BuffettPrincipleScore } from "@/lib/buffett-7-principles";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalBadgeProps {
  signal: "BUY" | "HOLD" | "PASS";
  strength: number;
}

function SignalBadge({ signal, strength }: SignalBadgeProps) {
  const config = {
    BUY: {
      label: "買い",
      bg: "bg-success",
      border: "border-success",
      glow: "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
      icon: TrendingUp,
      textColor: "text-success",
    },
    HOLD: {
      label: "保有",
      bg: "bg-gold",
      border: "border-gold",
      glow: "shadow-[0_0_20px_rgba(212,175,55,0.5)]",
      icon: Minus,
      textColor: "text-gold",
    },
    PASS: {
      label: "見送り",
      bg: "bg-danger",
      border: "border-danger",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
      icon: TrendingDown,
      textColor: "text-danger",
    },
  };

  const { label, border, glow, icon: Icon, textColor } = config[signal];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "w-24 h-24 rounded-full flex flex-col items-center justify-center",
          "bg-background border-4",
          border,
          glow,
        )}
      >
        <Icon className={cn("h-8 w-8", textColor)} />
        <span className={cn("text-sm font-bold mt-1", textColor)}>{label}</span>
      </div>
      <div className="text-center">
        <div className={cn("text-2xl font-bold mono-number", textColor)}>
          {strength}%
        </div>
        <div className="text-xs text-text-muted">確信度</div>
      </div>
    </div>
  );
}

interface PrincipleRowProps {
  principle: BuffettPrincipleScore;
  index: number;
}

function PrincipleRow({ principle, index }: PrincipleRowProps) {
  return (
    <div className={cn(
      "rounded-lg p-4 border transition-all",
      principle.passed
        ? "bg-success/5 border-success/20"
        : "bg-danger/5 border-danger/20"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {principle.passed
            ? <CheckCircle2 className="h-5 w-5 text-success" />
            : <XCircle className="h-5 w-5 text-danger" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-mono">原則{index + 1}</span>
              <div>
                <h4 className="font-semibold text-text-primary text-sm">{principle.name}</h4>
                {principle.nameEn && (
                  <span className="text-xs text-text-muted">{principle.nameEn}</span>
                )}
              </div>
            </div>
            <span className={cn(
              "text-lg font-bold mono-number flex-shrink-0",
              principle.passed ? "text-success" : "text-danger"
            )}>
              {principle.score}
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-2">{principle.description}</p>
          <Progress
            value={principle.score}
            variant={principle.passed ? "success" : "danger"}
            size="sm"
          />
          <p className="text-xs text-text-muted mt-1.5">{principle.details}</p>
        </div>
      </div>
    </div>
  );
}

interface BuffettPrinciplesCardProps {
  analysis: Buffett7PrinciplesResult;
}

export function BuffettPrinciplesCard({ analysis }: BuffettPrinciplesCardProps) {
  const passedCount = analysis.principles.filter(p => p.passed).length;

  return (
    <Card>
      <CardHeader
        title="バフェット7原則 自動採点"
        subtitle={`${passedCount}/7項目クリア · 総合スコア ${analysis.totalScore}点`}
      />
      <CardContent>
        {/* シグナルと総合スコア */}
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 p-5 bg-surface-light rounded-xl">
          <SignalBadge signal={analysis.signal} strength={analysis.signalStrength} />

          <div className="flex-1 space-y-3 w-full">
            {/* 総合スコアゲージ */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-text-secondary">総合スコア</span>
                <span className="text-sm font-bold mono-number">{analysis.totalScore}/100</span>
              </div>
              <Progress
                value={analysis.totalScore}
                variant={analysis.totalScore >= 75 ? "success" : analysis.totalScore >= 55 ? "gold" : "danger"}
                size="lg"
              />
            </div>

            {/* 10倍株確率 */}
            <div>
              <div className="flex justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-gold" />
                  <span className="text-sm text-text-secondary">10倍株確率</span>
                </div>
                <span className="text-sm font-bold text-gold mono-number">
                  {analysis.tenBaggerProbability}%
                </span>
              </div>
              <Progress value={analysis.tenBaggerProbability} variant="gold" size="lg" />
            </div>

            {/* クリア数バー */}
            <div className="flex gap-1.5">
              {analysis.principles.map((p, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 h-2 rounded-full",
                    p.passed ? "bg-success" : "bg-surface"
                  )}
                  title={p.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* サマリー */}
        <div className="mb-5 p-4 bg-gold/5 border border-gold/20 rounded-lg">
          <p className="text-sm text-text-secondary leading-relaxed">{analysis.summary}</p>
        </div>

        {/* 7原則一覧 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {analysis.principles.map((principle, index) => (
            <PrincipleRow key={index} principle={principle} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
