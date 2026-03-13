"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, Minus, Star,
  CheckCircle2, XCircle, ArrowRight, Plus, X, Loader2, Settings,
} from "lucide-react";

const DEFAULT_SYMBOLS = ["AAPL", "NVDA", "MSFT", "GOOGL", "V"];
const STORAGE_KEY = "buffett_watchlist";
const PRINCIPLE_LABELS = ["能力の輪","経済的堀","安全M","長期耐久","優秀経営","Mr.Market","顧客愛"];

const SIGNAL_CONFIG = {
  BUY:  { label: "買い",   bg: "bg-success/15", border: "border-success/50", text: "text-success",  icon: TrendingUp },
  HOLD: { label: "保有",   bg: "bg-gold/15",    border: "border-gold/50",    text: "text-gold",     icon: Minus },
  PASS: { label: "見送り", bg: "bg-danger/10",  border: "border-danger/30",  text: "text-danger",   icon: TrendingDown },
};

function formatPrice(price: number, symbol: string) {
  return symbol.endsWith(".T") || symbol.endsWith(".KS") ? price.toLocaleString() : price.toFixed(2);
}
function formatMC(mc: number) {
  if (mc >= 1e12) return `$${(mc/1e12).toFixed(1)}T`;
  if (mc >= 1e9) return `$${(mc/1e9).toFixed(0)}B`;
  return `$${(mc/1e6).toFixed(0)}M`;
}

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  marketCap: number;
  sector?: string;
  pe?: number;
  priceTarget1yr: { conservative: number; base: number; optimistic: number } | null;
  buffettAnalysis: {
    totalScore: number;
    signal: "BUY" | "HOLD" | "PASS";
    tenBaggerProbability: number;
    principles: { name: string; score: number; passed: boolean; details: string }[];
  };
}

export function WatchlistStocks() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState("");

  // localStorage から読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) setSymbols(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // localStorage に保存
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols)); } catch {
      // ignore storage errors
    }
  }, [symbols]);

  const fetchStocks = useCallback(async () => {
    if (symbols.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/watchlist-stocks?symbols=${symbols.join(",")}`);
      const data = await res.json();
      if (data.success) setStocks(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const handleAdd = async () => {
    const sym = addInput.trim().toUpperCase();
    if (!sym) return;
    if (symbols.includes(sym)) { setAddError("既に追加済みです"); return; }
    if (symbols.length >= 10) { setAddError("最大10銘柄まで"); return; }
    setAddError("");
    setSymbols(prev => [...prev, sym]);
    setAddInput("");
  };

  const handleRemove = (sym: string) => {
    setSymbols(prev => prev.filter(s => s !== sym));
    setStocks(prev => prev.filter(s => s.symbol !== sym));
  };

  return (
    <Card>
      <CardHeader
        title="ウォッチリスト — バフェット7原則評価"
        subtitle="全7原則をリアルデータで自動採点"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManager(!showManager)}
              className={cn(
                "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                showManager
                  ? "bg-gold/10 border-gold/30 text-gold"
                  : "border-surface-light text-text-muted hover:border-gold/30 hover:text-gold"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">銘柄管理</span>
            </button>
            <Link
              href="/screener"
              className="flex items-center gap-1 text-xs text-gold hover:text-gold-light transition-colors"
            >
              全銘柄
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />
      <CardContent>
        {/* 銘柄管理パネル */}
        {showManager && (
          <div className="mb-4 p-3 bg-surface-light rounded-xl border border-gold/20 space-y-3">
            <p className="text-xs font-medium text-text-secondary">ウォッチリスト管理（最大10銘柄）</p>
            {/* 現在の銘柄タグ */}
            <div className="flex flex-wrap gap-1.5">
              {symbols.map(sym => (
                <div key={sym} className="flex items-center gap-1 bg-surface border border-surface-light rounded-full px-2.5 py-1">
                  <span className="text-xs text-text-primary font-medium">{sym}</span>
                  <button
                    onClick={() => handleRemove(sym)}
                    className="text-text-muted hover:text-danger transition-colors"
                    aria-label={`${sym}を削除`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {/* 追加フォーム */}
            <div className="flex gap-2">
              <input
                type="text"
                value={addInput}
                onChange={e => { setAddInput(e.target.value.toUpperCase()); setAddError(""); }}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="ティッカー例: 7203.T, AMZN"
                className="flex-1 px-3 py-1.5 text-xs bg-surface border border-surface-light rounded-lg text-text-primary placeholder:text-text-muted focus:border-gold focus:outline-none"
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-1.5 bg-gold text-background text-xs font-medium rounded-lg hover:bg-gold-light transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                追加
              </button>
            </div>
            {addError && <p className="text-xs text-danger">{addError}</p>}
            <p className="text-xs text-text-muted">
              米国株: AAPL / 日本株: 7203.T / 韓国株: 005930.KS / 台湾株: 2330.TW
            </p>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 text-gold animate-spin" />
            <span className="text-sm text-text-secondary">データ取得中...</span>
          </div>
        )}

        {/* 銘柄リスト */}
        {!loading && (
          <div className="space-y-2">
            {stocks.map((stock, index) => {
              const ba = stock.buffettAnalysis;
              const cfg = SIGNAL_CONFIG[ba.signal];
              const SignalIcon = cfg.icon;
              const passedCount = ba.principles.filter(p => p.passed).length;
              const isUp = stock.changePercent >= 0;

              return (
                <Link
                  key={stock.symbol}
                  href={`/analyze/${stock.symbol}`}
                  className={cn(
                    "block rounded-xl border p-3 transition-all group",
                    "hover:border-gold/40 hover:shadow-[0_0_12px_rgba(212,175,55,0.12)]",
                    ba.signal === "BUY" ? "border-success/20 bg-success/3" :
                    ba.signal === "HOLD" ? "border-gold/20" : "border-surface-light bg-surface"
                  )}
                >
                  {/* Row 1: ランク・シグナル・銘柄・株価 */}
                  <div className="flex items-start gap-2 mb-2.5">
                    <span className="w-5 text-center text-gold font-bold text-sm flex-shrink-0 mt-0.5">{index+1}</span>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold flex-shrink-0", cfg.bg, cfg.border, cfg.text)}>
                      <SignalIcon className="h-3 w-3" />
                      {cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-text-primary text-sm group-hover:text-gold transition-colors">{stock.symbol}</span>
                        {stock.sector && <span className="hidden sm:inline text-xs text-text-muted bg-surface-light px-1.5 py-0.5 rounded">{stock.sector}</span>}
                        {ba.tenBaggerProbability >= 50 && (
                          <span className="flex items-center gap-0.5 text-xs text-gold bg-gold/10 border border-gold/30 px-1.5 py-0.5 rounded-full">
                            <Star className="h-2.5 w-2.5" />10x
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted truncate">{stock.name}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="font-mono font-bold text-sm">{formatPrice(stock.price, stock.symbol)}</div>
                      <div className={cn("text-xs", isUp ? "text-success" : "text-danger")}>
                        {isUp?"+":""}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Row 2: 7原則グリッド */}
                  <div className="mb-2.5">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-text-muted">7原則:</span>
                      <span className={cn("text-xs font-bold",
                        passedCount >= 6 ? "text-success" : passedCount >= 4 ? "text-gold" : "text-danger")}>
                        {passedCount}/7
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {ba.principles.map((p, i) => (
                        <div key={i} title={`原則${i+1}: ${p.name}\n${p.details}\nスコア: ${p.score}`}
                          className={cn("flex flex-col items-center rounded px-0.5 py-1 border",
                            p.passed ? "bg-success/10 border-success/30" : "bg-danger/8 border-danger/20")}>
                          {p.passed
                            ? <CheckCircle2 className="h-3 w-3 text-success mb-0.5" />
                            : <XCircle className="h-3 w-3 text-danger mb-0.5" />}
                          <span className={cn("text-[8px] leading-tight text-center", p.passed ? "text-success" : "text-danger/80")}>
                            {PRINCIPLE_LABELS[i]}
                          </span>
                          <span className={cn("text-[9px] font-bold mono-number", p.passed ? "text-success" : "text-danger")}>
                            {p.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: 総合・10倍・1年後 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
                      <span className="text-xs text-text-muted">総合</span>
                      <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          ba.totalScore >= 72 ? "bg-success" : ba.totalScore >= 52 ? "bg-gold" : "bg-danger")}
                          style={{width:`${ba.totalScore}%`}} />
                      </div>
                      <span className={cn("text-xs font-bold mono-number",
                        ba.totalScore >= 72 ? "text-success" : ba.totalScore >= 52 ? "text-gold" : "text-danger")}>
                        {ba.totalScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-gold" />
                      <span className="text-xs font-bold text-gold mono-number">{ba.tenBaggerProbability}%</span>
                    </div>
                    {stock.priceTarget1yr && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-text-muted" />
                        <span className="text-xs text-text-muted">1年後:</span>
                        <span className="text-xs font-bold text-success mono-number">{formatPrice(stock.priceTarget1yr.base, stock.symbol)}</span>
                        <span className="hidden sm:inline text-xs text-text-muted">({stock.priceTarget1yr.conservative}〜{stock.priceTarget1yr.optimistic})</span>
                      </div>
                    )}
                    {stock.marketCap > 0 && <span className="hidden md:inline text-xs text-text-muted ml-auto">{formatMC(stock.marketCap)}</span>}
                    <div className="ml-auto flex items-center gap-1 text-xs text-gold group-hover:text-gold-light">
                      詳細 <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-surface-light text-center">
          <p className="text-xs text-text-muted">カーソルで原則の詳細表示 · クリックで完全分析 · 「銘柄管理」で追加・削除</p>
        </div>
      </CardContent>
    </Card>
  );
}
