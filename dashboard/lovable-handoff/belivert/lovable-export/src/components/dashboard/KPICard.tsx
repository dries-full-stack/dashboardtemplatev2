
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  format?: "number" | "currency" | "percent" | "decimal";
  onClick?: () => void;
  calculationRule?: string;
}

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
  format = "number",
  onClick,
  calculationRule,
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("nl-BE", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case "percent":
        return `${val.toFixed(1)}%`;
      case "decimal":
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val);
      default:
        return new Intl.NumberFormat("nl-BE").format(val);
    }
  };

  const TrendIcon = change === undefined ? null : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={cn(
        "kpi-card animate-slide-up",
        variant === "success" && "kpi-card-success",
        variant === "warning" && "kpi-card-warning",
        variant === "danger" && "kpi-card-danger",
        onClick && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="metric-label truncate">{title}</p>
            {calculationRule && (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    <p className="font-medium mb-1">Berekeningsregel:</p>
                    <p className="whitespace-pre-wrap">{calculationRule}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="metric-value mt-2">{formatValue(value)}</p>

          {(change !== undefined || subtitle) && (
            <div className="flex items-center gap-2 mt-2">
              {change !== undefined && TrendIcon && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    change > 0 && "text-success",
                    change < 0 && "text-destructive",
                    change === 0 && "text-muted-foreground"
                  )}
                >
                  <TrendIcon className="w-3 h-3" />
                  {Math.abs(change).toFixed(1)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
