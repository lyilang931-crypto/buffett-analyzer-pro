import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardContent, ScoreBadge, Badge, Progress } from "@/components/ui";
import { ROEChart, PriceChart, MoatRadar } from "@/components/charts";
import { screenStocks, checkBuffettCriteria } from "@/lib/buffett-analysis";
import { formatPercent } from "@/lib/utils";
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface PageProps {
  params: { symbol: string };
}

export default async function StockDetailPage({ params }: PageProps) {
  const symbol = params.symbol.toUpperCase();

  // デモデータから銘柄を取得
  const result = await screenStocks({});
  const analysis = result.stocks.find((s) => s.symbol === symbol);

  if (!analysis) {
    notFound();
  }

  const buffettCheck = checkBuffettCriteria(analysis);

  // デモ用の株価データ
  const priceHistory = Array.from({ length: 365 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (365 - i));
    const basePrice = 150;
    const trend = i * 0.1;
    const noise = Math.sin(i * 0.1) * 10 + Math.random() * 5;
    return {
      date: date.toISOString().split("T")[0],
      open: basePrice + trend + noise - 1,
      high: basePrice + trend + noise + 2,
      low: basePrice + trend + noise - 2,
      close: basePrice + trend + noise,
      volume: Math.floor(Math.random() * 1000000) + 500000,
    };
  });

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/screener"
            className="inline-flex items-center gap-1 text-text-secondary hover:text-gold transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            スクリーナーに戻る
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gold">{symbol}</h1>
            {analysis.tenBaggerPotential.score >= 70 && (
              <Badge variant="gold">
                <TrendingUp className="h-4 w-4 mr-1" />
                10倍株候補
              </Badge>
            )}
          </div>
          <p className="text-text-secondary mt-1">{analysis.name}</p>
        </div>

        <div className="text-right">
          <div className="text-sm text-text-secondary mb-1">総合スコア</div>
          <ScoreBadge score={analysis.overallScore} size="lg" showLabel />
        </div>
      </div>

      {/* モートスコアチェック */}
      <Card glow={buffettCheck.passed}>
        <CardHeader
          title="モートスコアチェック"
          subtitle={
            buffettCheck.passed
              ? "全ての基準をクリア"
              : "一部の基準が未達成"
          }
          action={
            buffettCheck.passed ? (
              <Badge variant="success">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                合格
              </Badge>
            ) : (
              <Badge variant="warning">
                <AlertTriangle className="h-4 w-4 mr-1" />
                要確認
              </Badge>
            )
          }
        />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {buffettCheck.criteria.map((c) => (
              <div
                key={c.name}
                className={`p-4 rounded-lg ${
                  c.passed ? "bg-success/10" : "bg-danger/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {c.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger" />
                  )}
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <div className="text-lg font-bold mono-number">{c.value}</div>
                <div className="text-xs text-text-muted">{c.threshold}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* メイン分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 株価チャート */}
        <Card>
          <CardHeader title="株価推移" subtitle="過去1年" />
          <CardContent>
            <PriceChart data={priceHistory} height={280} />
          </CardContent>
        </Card>

        {/* 経済的な堀 */}
        <Card>
          <CardHeader
            title="経済的な堀（Moat）"
            subtitle={`総合スコア: ${analysis.moatScore}点`}
            action={<ScoreBadge score={analysis.moatScore} size="sm" />}
          />
          <CardContent>
            <MoatRadar moatFactors={analysis.moatFactors} size={280} />
          </CardContent>
        </Card>
      </div>

      {/* ROE分析 */}
      <Card>
        <CardHeader
          title="ROE分析"
          subtitle="過去5年間の自己資本利益率推移"
          action={
            <div className="flex items-center gap-2">
              <span className="text-text-secondary text-sm">5年平均:</span>
              <span
                className={`font-bold mono-number ${
                  analysis.roeAnalysis.fiveYearAvgROE >= 15
                    ? "text-success"
                    : "text-warning"
                }`}
              >
                {analysis.roeAnalysis.fiveYearAvgROE.toFixed(1)}%
              </span>
            </div>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ROEChart data={analysis.roeAnalysis.history} height={220} />
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-surface-light rounded-lg">
                <div className="text-sm text-text-secondary mb-1">現在のROE</div>
                <div className="text-2xl font-bold text-gold mono-number">
                  {analysis.roeAnalysis.currentROE.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 bg-surface-light rounded-lg">
                <div className="text-sm text-text-secondary mb-1">安定性</div>
                <div className="flex items-center gap-2">
                  {analysis.roeAnalysis.isConsistent ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <span className="text-success">安定的に15%以上</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <span className="text-warning">変動あり</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4 bg-surface-light rounded-lg">
                <div className="text-sm text-text-secondary mb-1">トレンド</div>
                <div className="flex items-center gap-2">
                  {analysis.roeAnalysis.trend === "up" && (
                    <Badge variant="success">上昇傾向</Badge>
                  )}
                  {analysis.roeAnalysis.trend === "stable" && (
                    <Badge variant="gold">安定</Badge>
                  )}
                  {analysis.roeAnalysis.trend === "down" && (
                    <Badge variant="danger">下降傾向</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* バリュエーション & 安全マージン */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="バリュエーション"
            action={
              analysis.valuation.isUndervalued ? (
                <Badge variant="success">割安</Badge>
              ) : (
                <Badge variant="warning">適正〜割高</Badge>
              )
            }
          />
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">現在PER</span>
                <span className="font-bold mono-number">
                  {analysis.valuation.currentPE.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">過去平均PER</span>
                <span className="font-bold mono-number">
                  {analysis.valuation.historicalPE.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">業界平均PER</span>
                <span className="font-bold mono-number">
                  {analysis.valuation.industryPE.toFixed(1)}
                </span>
              </div>
              <div className="pt-4 border-t border-surface-light">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">割安度</span>
                  <span
                    className={`font-bold mono-number ${
                      analysis.valuation.discountPercent > 0
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {formatPercent(analysis.valuation.discountPercent)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="安全マージン"
            action={
              <span
                className={`font-bold mono-number ${
                  analysis.safetyMargin.marginPercent >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {formatPercent(analysis.safetyMargin.marginPercent)}
              </span>
            }
          />
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">内在価値（推定）</span>
                <span className="font-bold mono-number text-gold">
                  ${analysis.safetyMargin.intrinsicValue.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">現在株価</span>
                <span className="font-bold mono-number">
                  ${analysis.safetyMargin.currentPrice.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">DCF評価額</span>
                <span className="font-bold mono-number">
                  ${analysis.safetyMargin.dcfValue.toFixed(0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">グレアム評価額</span>
                <span className="font-bold mono-number">
                  ${analysis.safetyMargin.grahamValue.toFixed(0)}
                </span>
              </div>
              <Progress
                value={Math.max(0, analysis.safetyMargin.marginPercent)}
                max={50}
                variant="gold"
                size="lg"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 10倍株ポテンシャル */}
      <Card>
        <CardHeader
          title="10倍株ポテンシャル"
          subtitle={`予想タイムフレーム: ${analysis.tenBaggerPotential.timeframe}`}
          action={
            <ScoreBadge score={analysis.tenBaggerPotential.score} size="md" />
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="flex items-center gap-2 text-success font-medium mb-3">
                <CheckCircle2 className="h-5 w-5" />
                成長要因
              </h4>
              <ul className="space-y-2">
                {analysis.tenBaggerPotential.factors.map((factor, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-text-secondary"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="flex items-center gap-2 text-danger font-medium mb-3">
                <AlertTriangle className="h-5 w-5" />
                リスク要因
              </h4>
              <ul className="space-y-2">
                {analysis.tenBaggerPotential.risks.map((risk, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-text-secondary"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
