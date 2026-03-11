"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface QueryVolumeDataPoint {
  timestamp: string;
  count: number;
}

interface QueryVolumeProps {
  data: QueryVolumeDataPoint[];
}

type ViewMode = "hourly" | "daily";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card rounded-lg border border-border px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" />
        <span className="text-text-secondary">Queries:</span>
        <span className="font-mono font-medium text-text-primary">
          {payload[0].value.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function QueryVolume({ data }: QueryVolumeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("hourly");

  const displayData = useMemo(() => {
    if (viewMode === "hourly") return data;

    // Group by day for daily view
    const grouped: Record<string, number> = {};
    for (const point of data) {
      const day = point.timestamp.split(" ")[0] || point.timestamp;
      grouped[day] = (grouped[day] || 0) + point.count;
    }
    return Object.entries(grouped).map(([timestamp, count]) => ({
      timestamp,
      count,
    }));
  }, [data, viewMode]);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Query Volume</h3>
        <div className="flex gap-1">
          {(["hourly", "daily"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                viewMode === mode
                  ? "bg-accent text-white"
                  : "text-text-muted hover:bg-card-hover hover:text-text-secondary"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="queryVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickLine={{ stroke: "#1E293B" }}
              axisLine={{ stroke: "#1E293B" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickLine={{ stroke: "#1E293B" }}
              axisLine={{ stroke: "#1E293B" }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#queryVolumeGradient)"
              activeDot={{ r: 4, fill: "#3B82F6", stroke: "#0A0F1C", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
