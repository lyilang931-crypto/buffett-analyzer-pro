import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "gold" | "outline";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-light text-text-secondary",
  success: "bg-success/20 text-success border border-success/30",
  danger: "bg-danger/20 text-danger border border-danger/30",
  warning: "bg-warning/20 text-warning border border-warning/30",
  gold: "bg-gold/20 text-gold border border-gold/30",
  outline: "border border-surface-light text-text-secondary",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const getVariant = (): BadgeVariant => {
    if (score >= 80) return "success";
    if (score >= 60) return "gold";
    if (score >= 40) return "warning";
    return "danger";
  };

  const getLabel = (): string => {
    if (score >= 80) return "優秀";
    if (score >= 60) return "良好";
    if (score >= 40) return "普通";
    return "注意";
  };

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-bold",
        variantStyles[getVariant()],
        sizeStyles[size]
      )}
    >
      <span className="mono-number">{score}</span>
      {showLabel && <span className="font-normal">({getLabel()})</span>}
    </span>
  );
}
