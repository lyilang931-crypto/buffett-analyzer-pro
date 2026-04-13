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
  Heart,
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

function SentimentBadge({ trend }: { trend: "上昇" | "安定" | "下降" }) {
  const config = {
    上昇: { icon: TrendingUp, color: "text-success", bg: "bg-success/10 border-success/20" },
    安定: { icon: Minus,      color: "text-gold",    bg: "bg-gold/10 border-gold/20" },
    下降: { icon: TrendingDown, color: "text-danger", bg: "bg-danger/10 border-danger/20" },
  };
  const { icon: Icon, color, bg } = config[trend];
  return (
    <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-xs font-medium", bg, color)}>
      <Icon className="h-3 w-3" />
      {trend}
    </span>
  );
}

function PrincipleRow({ principle, index }: PrincipleRowProps) {
  const sentiment = index === 6 ? principle.sentiment : null;

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

          {/* 原則7のみ: Geminiセンチメントセクション（取得成功時のみ表示） */}
          {sentiment && (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-2">
              {/* ヘッダー */}
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-pink-400" />
                <span className="text-xs font-semibold text-text-secondary">
                  顧客センチメント分析
                </span>
                <span className="text-[10px] text-text-muted ml-auto opacity-60">
                  powered by {sentiment.source}
                </span>
              </div>

              {/* スコア + トレンド */}
              <div className="flex items-center gap-3">
                {/* センチメントスコア */}
                <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-surface-light border border-border/50 min-w-[64px]">
                  <span className={cn(
                    "text-xl font-bold mono-number leading-none",
                    sentiment.score >= 70 ? "text-success"
                      : sentiment.score >= 45 ? "text-gold"
                      : "text-danger"
                  )}>
                    {sentiment.score}
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5">/ 100</span>
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  {/* ブランドトレンド */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-muted w-16 shrink-0">トレンド</span>
                    <SentimentBadge trend={sentiment.trend} />
                  </div>

                  {/* ポジ/ネガ比率バー */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-muted w-16 shrink-0">評判比率</span>
                    <div className="flex-1 flex h-2 rounded-full overflow-hidden gap-px">
                      <div
                        className="bg-success rounded-l-full"
                        style={{ width: `${sentiment.positiveRatio}%` }}
                      />
                      <div
                        className="bg-danger rounded-r-full"
                        style={{ width: `${sentiment.negativeRatio}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-success font-medium whitespace-nowrap">
                      +{sentiment.positiveRatio}%
                    </span>
                    <span className="text-[10px] text-danger font-medium whitespace-nowrap">
                      -{sentiment.negativeRatio}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        title="7つのモート原則 自動採点"
        subtitle={`${passedCount}/7項目クリア · モートスコア ${analysis.totalScore}点`}
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
