"use client";

import { cn } from "@/lib/utils";

interface HealthCardProps {
  name: string;
  isHealthy: boolean;
  lastChecked: Date | null;
  icon: React.ReactNode;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

export function HealthCard({ name, isHealthy, lastChecked, icon }: HealthCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 transition-all duration-300",
        isHealthy
          ? "border-status-green/20 hover:border-status-green/40"
          : "border-status-red/20 hover:border-status-red/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isHealthy
                ? "bg-status-green/10 text-status-green"
                : "bg-status-red/10 text-status-red"
            )}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{name}</h3>
            <p className="mt-0.5 text-xs text-text-muted">
              {lastChecked ? `Checked ${formatRelativeTime(lastChecked)}` : "Never checked"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "animate-pulse-dot inline-block h-2.5 w-2.5 rounded-full",
              isHealthy ? "bg-status-green" : "bg-status-red"
            )}
          />
          <span
            className={cn(
              "text-xs font-medium",
              isHealthy ? "text-status-green" : "text-status-red"
            )}
          >
            {isHealthy ? "Operational" : "Down"}
          </span>
        </div>
      </div>
    </div>
  );
}
