"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, Star, CheckCircle2, XCircle,
  Filter, RefreshCw, ChevronRight, Loader2
} from "lucide-react";

const PRINCIPLE_LABELS = ["能力の輪","経済的堀","安全M","長期耐久","優秀経営","Mr.Market","顧客愛"];

const SIGNAL_CONFIG = {
  BUY:  { label: "買い",   bg: "bg-success/15", border: "border-success/50", text: "text-success",  icon: TrendingUp },
  HOLD: { label: "保有",   bg: "bg-gold/15",    border: "border-gold/50",    text: "text-gold",     icon: Minus },
  PASS: { label: "見送り", bg: "bg-danger/10",  border: "border-danger/30",  text: "text-danger",   icon: TrendingDown },
};

interface ScreenerStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  sector?: string;
  pe?: number;
  intrinsicValue: number;
  buffettAnalysis: {
    totalScore: number;
    signal: "BUY" | "HOLD" | "PASS";
    tenBaggerProbability: number;
    principles: { name: string; score: number; passed: boolean; details: string }[];
  };
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [signalFilter, setSignalFilter] = useState<"ALL"|"BUY"|"HOLD"|"PASS">("ALL");
  const [minScore, setMinScore] = useState(0);
  const [minTenBagger, setMinTenBagger] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (signalFilter !== "ALL") params.set("signal", signalFilter);
      if (minScore > 0) params.set("minScore", String(minScore));
      if (minTenBagger > 0) params.set("minTenBagger", String(minTenBagger));
      const res = await fetch(`/api/screener?${params}`);
      const data = await res.json();
      if (data.success) setStocks(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [signalFilter, minScore, minTenBagger]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const formatPrice = (p: number, sym: string) =>
    sym.endsWith(".T") || sym.endsWith(".KS") ? p.toLocaleString() : `$${p.toFixed(2)}`;

  const formatMC = (mc: number) =>
    mc >= 1e12 ? `$${(mc/1e12).toFixed(1)}T` : mc >= 1e9 ? `$${(mc/1e9).toFixed(0)}B` : `$${(mc/1e6).toFixed(0)}M`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gold-gradient leading-tight">
          10倍株スクリーニング
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          世界{loading ? "..." : stocks.length + "銘柄"}をバフェット7原則でリアルタイム採点
        </p>
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="flex flex-wrap gap-3 items-center p-4">
          <Filter className="h-4 w-4 text-gold flex-shrink-0" />

          {/* シグナルフィルター */}
          <div className="flex gap-1">
            {(["ALL","BUY","HOLD","PASS"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSignalFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  signalFilter === s
                    ? "bg-gold text-background"
                    : "bg-surface-light text-text-secondary hover:bg-gold/20"
                )}
              >
                {s === "ALL" ? "すべて" : s === "BUY" ? "買い" : s === "HOLD" ? "保有" : "見送り"}
              </button>
            ))}
          </div>

          {/* スコアフィルター */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">最低スコア:</span>
            {[0, 60, 70, 80].map((v) => (
              <button
                key={v}
                onClick={() => setMinScore(v)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs transition-all",
                  minScore === v ? "bg-gold text-background" : "bg-surface-light text-text-secondary hover:bg-gold/20"
                )}
              >
                {v === 0 ? "全て" : `${v}+`}
              </button>
            ))}
          </div>

          {/* 10倍候補フィルター */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">10倍確率:</span>
            {[0, 30, 50].map((v) => (
              <button
                key={v}
                onClick={() => setMinTenBagger(v)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs transition-all",
                  minTenBagger === v ? "bg-gold text-background" : "bg-surface-light text-text-secondary hover:bg-gold/20"
                )}
              >
                {v === 0 ? "全て" : `${v}%+`}
              </button>
            ))}
          </div>

          <button
            onClick={fetchStocks}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs hover:bg-gold/20 transition-all"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            更新
          </button>
        </CardContent>
      </Card>

      {/* 結果一覧 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-10 w-10 text-gold animate-spin" />
          <p className="text-text-secondary text-sm">Yahoo Financeからリアルタイムデータ取得中...</p>
          <p className="text-text-muted text-xs">複数銘柄の7原則を同時採点しています（20〜40秒）</p>
        </div>
      ) : (
        <div className="space-y-2">
          {stocks.map((stock, index) => {
            const ba = stock.buffettAnalysis;
            const cfg = SIGNAL_CONFIG[ba.signal];
            const SignalIcon = cfg.icon;
            const isExpanded = expanded === stock.symbol;
            const isUp = stock.changePercent >= 0;
            const discount = stock.intrinsicValue > 0 && stock.price > 0
              ? ((stock.intrinsicValue - stock.price) / stock.intrinsicValue * 100)
              : null;

            return (
              <div
                key={stock.symbol}
                className={cn(
                  "rounded-xl border transition-all",
                  ba.signal === "BUY" ? "border-success/25 bg-success/3" :
                  ba.signal === "HOLD" ? "border-gold/20" : "border-surface-light bg-surface"
                )}
              >
                {/* メイン行 */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : stock.symbol)}
                >
                  {/* ランク */}
                  <span className="w-5 text-center text-gold font-bold text-sm flex-shrink-0">{index + 1}</span>

                  {/* シグナル */}
                  <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold flex-shrink-0", cfg.bg, cfg.border, cfg.text)}>
                    <SignalIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </div>

                  {/* 銘柄 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-primary text-sm">{stock.symbol}</span>
                      {ba.tenBaggerProbability >= 50 && (
                        <span className="flex items-center gap-0.5 text-xs text-gold bg-gold/10 border border-gold/30 px-1.5 py-0.5 rounded-full">
                          <Star className="h-2.5 w-2.5" />10x
                        </span>
                      )}
                      {stock.sector && (
                        <span className="hidden md:inline text-xs text-text-muted bg-surface-light px-1.5 py-0.5 rounded">{stock.sector}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">{stock.name}</p>
                  </div>

                  {/* 7原則ミニバー */}
                  <div className="hidden sm:flex gap-0.5 flex-shrink-0">
                    {ba.principles.map((p, i) => (
                      <div
                        key={i}
                        title={`${PRINCIPLE_LABELS[i]}: ${p.score}`}
                        className={cn("w-4 h-6 rounded-sm text-[8px] flex items-center justify-center font-bold",
                          p.passed ? "bg-success/20 text-success" : "bg-danger/15 text-danger")}
                      >
                        {p.score}
                      </div>
                    ))}
                  </div>

                  {/* スコア + 10倍 */}
                  <div className="flex-shrink-0 text-right space-y-0.5">
                    <div className={cn("text-sm font-bold mono-number",
                      ba.totalScore >= 72 ? "text-success" : ba.totalScore >= 52 ? "text-gold" : "text-danger")}>
                      {ba.totalScore}点
                    </div>
                    <div className="text-xs text-gold mono-number">{ba.tenBaggerProbability}%</div>
                  </div>

                  {/* 株価 */}
                  <div className="flex-shrink-0 text-right hidden md:block">
                    <div className="font-mono text-sm font-bold text-text-primary">{formatPrice(stock.price, stock.symbol)}</div>
                    <div className={cn("text-xs", isUp ? "text-success" : "text-danger")}>
                      {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  {/* 展開矢印 */}
                  <ChevronRight className={cn("h-4 w-4 text-text-muted flex-shrink-0 transition-transform", isExpanded && "rotate-90")} />
                </div>

                {/* 展開: 7原則詳細 */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-surface-light pt-3 space-y-3">
                    {/* 7原則グリッド */}
                    <div className="grid grid-cols-7 gap-1">
                      {ba.principles.map((p, i) => (
                        <div key={i} className={cn("flex flex-col items-center rounded-lg px-0.5 py-2 border",
                          p.passed ? "bg-success/10 border-success/30" : "bg-danger/8 border-danger/20")}>
                          {p.passed
                            ? <CheckCircle2 className="h-4 w-4 text-success mb-1" />
                            : <XCircle className="h-4 w-4 text-danger mb-1" />}
                          <span className={cn("text-[9px] leading-tight text-center font-medium",
                            p.passed ? "text-success" : "text-danger/80")}>
                            {PRINCIPLE_LABELS[i]}
                          </span>
                          <span className={cn("text-[10px] font-bold mono-number mt-0.5",
                            p.passed ? "text-success" : "text-danger")}>
                            {p.score}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 原則の詳細テキスト */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {ba.principles.map((p, i) => (
                        <div key={i} className="text-xs text-text-muted bg-surface-light rounded px-2 py-1.5">
                          <span className={cn("font-medium mr-1", p.passed ? "text-success" : "text-danger")}>
                            {i+1}. {p.name}
                          </span>
                          {p.details}
                        </div>
                      ))}
                    </div>

                    {/* バリュエーション情報 */}
                    <div className="flex flex-wrap gap-3 text-xs">
                      {stock.pe && (
                        <span className="text-text-muted">PER: <span className="text-text-primary font-medium">{stock.pe.toFixed(1)}</span></span>
                      )}
                      {discount !== null && (
                        <span className="text-text-muted">内在価値比: <span className={cn("font-medium", discount >= 0 ? "text-success" : "text-danger")}>
                          {discount >= 0 ? "+" : ""}{discount.toFixed(1)}%
                        </span></span>
                      )}
                      {stock.marketCap > 0 && (
                        <span className="text-text-muted">時価総額: <span className="text-text-primary font-medium">{formatMC(stock.marketCap)}</span></span>
                      )}
                      <Link
                        href={`/analyze/${stock.symbol}`}
                        className="ml-auto text-gold hover:text-gold-light flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        詳細分析 <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 凡例 */}
      {!loading && (
        <div className="bg-surface border border-surface-light rounded-xl p-4 text-xs text-text-muted">
          <p>行をクリックすると7原則の詳細が展開されます。データはYahoo Financeのリアルタイム情報に基づきます。</p>
        </div>
      )}
    </div>
  );
}
