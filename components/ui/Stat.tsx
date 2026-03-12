import { cn, getChangeColor } from "@/lib/utils";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  variant?: "default" | "gold" | "large";
  className?: string;
}

export function Stat({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = "default",
  className,
}: StatProps) {
  const TrendIcon =
    change !== undefined
      ? change > 0
        ? TrendingUp
        : change < 0
        ? TrendingDown
        : Minus
      : null;

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gold">{icon}</span>}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-bold mono-number",
            variant === "large" ? "text-3xl" : "text-xl",
            variant === "gold" && "text-gold"
          )}
        >
          {value}
        </span>
        {change !== undefined && TrendIcon && (
          <span className={cn("flex items-center gap-0.5 text-sm", getChangeColor(change))}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(change).toFixed(2)}%
            {changeLabel && <span className="text-text-muted ml-1">{changeLabel}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const colStyles = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", colStyles[columns], className)}>
      {children}
    </div>
  );
}
