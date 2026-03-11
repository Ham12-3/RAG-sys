"use client";

import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/number-ticker";

interface MetricCardProps {
  label: string;
  value: number;
  decimalPlaces?: number;
  suffix?: string;
  thresholds?: { green: number; amber: number };
  invertThresholds?: boolean;
  noThreshold?: boolean;
}

export function MetricCard({
  label,
  value,
  decimalPlaces = 2,
  suffix,
  thresholds = { green: 0.8, amber: 0.5 },
  invertThresholds = false,
  noThreshold = false,
}: MetricCardProps) {
  const getThresholdStatus = (): "green" | "amber" | "red" | "accent" => {
    if (noThreshold) return "accent";

    if (invertThresholds) {
      if (value < thresholds.amber) return "green";
      if (value < thresholds.green) return "amber";
      return "red";
    }

    if (value >= thresholds.green) return "green";
    if (value >= thresholds.amber) return "amber";
    return "red";
  };

  const status = getThresholdStatus();

  const borderColorMap = {
    green: "border-l-status-green",
    amber: "border-l-status-amber",
    red: "border-l-status-red",
    accent: "border-l-accent",
  };

  const textColorMap = {
    green: "text-status-green",
    amber: "text-status-amber",
    red: "text-status-red",
    accent: "text-accent",
  };

  const glowMap = {
    green: "shadow-[0_0_20px_rgba(34,197,94,0.08)]",
    amber: "shadow-[0_0_20px_rgba(245,158,11,0.08)]",
    red: "shadow-[0_0_20px_rgba(239,68,68,0.08)]",
    accent: "shadow-[0_0_20px_rgba(59,130,246,0.08)]",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-xl border-l-[3px] px-5 py-5 transition-all duration-300 hover:bg-card-hover",
        borderColorMap[status],
        glowMap[status]
      )}
    >
      <div className="flex items-baseline gap-1">
        <NumberTicker
          value={value}
          decimalPlaces={decimalPlaces}
          delay={0.2}
          className={cn("text-3xl font-bold tracking-tight", textColorMap[status])}
        />
        {suffix && (
          <span className={cn("text-lg font-medium", textColorMap[status])}>
            {suffix}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-text-secondary">{label}</p>
    </div>
  );
}
