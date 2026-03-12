import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 数値フォーマット
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// 大きな数値の短縮表示
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}兆`;
  }
  if (value >= 1e8) {
    return `${(value / 1e8).toFixed(2)}億`;
  }
  if (value >= 1e4) {
    return `${(value / 1e4).toFixed(2)}万`;
  }
  return value.toLocaleString("ja-JP");
}

// USD表記
export function formatUSD(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toLocaleString("en-US")}`;
}

// パーセント表示
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

// 日付フォーマット
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// バフェット指数のステータス判定
export function getBuffettIndexStatus(value: number): {
  status: "significantly_undervalued" | "undervalued" | "fair" | "overvalued" | "significantly_overvalued";
  label: string;
  color: string;
} {
  if (value < 50) {
    return { status: "significantly_undervalued", label: "大幅割安", color: "text-success" };
  }
  if (value < 75) {
    return { status: "undervalued", label: "割安", color: "text-green-400" };
  }
  if (value < 100) {
    return { status: "fair", label: "適正", color: "text-gold" };
  }
  if (value < 125) {
    return { status: "overvalued", label: "割高", color: "text-warning" };
  }
  return { status: "significantly_overvalued", label: "大幅割高", color: "text-danger" };
}

// スコアに応じた色を返す
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-green-400";
  if (score >= 40) return "text-gold";
  if (score >= 20) return "text-warning";
  return "text-danger";
}

// スコアバッジの背景色
export function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-success/20 border-success/50";
  if (score >= 60) return "bg-green-400/20 border-green-400/50";
  if (score >= 40) return "bg-gold/20 border-gold/50";
  if (score >= 20) return "bg-warning/20 border-warning/50";
  return "bg-danger/20 border-danger/50";
}

// 変動率の色
export function getChangeColor(change: number): string {
  if (change > 0) return "text-success";
  if (change < 0) return "text-danger";
  return "text-text-secondary";
}

// 遅延処理
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
