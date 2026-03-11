"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface LatencyDataPoint {
  timestamp: string;
  p50: number;
  p95: number;
  p99: number;
}

interface LatencyChartsProps {
  data: LatencyDataPoint[];
  title: string;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

const TIME_RANGE_SLICES: Record<TimeRange, number> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 168,
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-card rounded-lg border border-border px-3 py-2 shadow-xl">
      <p className="mb-1.5 text-xs text-text-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary">{entry.name}:</span>
          <span className="font-mono font-medium text-text-primary">
            {entry.value.toFixed(1)}ms
          </span>
        </div>
      ))}
    </div>
  );
}

export function LatencyCharts({ data, title }: LatencyChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const filteredData = useMemo(() => {
    const maxPoints = TIME_RANGE_SLICES[timeRange];
    if (data.length <= maxPoints) return data;
    return data.slice(data.length - maxPoints);
  }, [data, timeRange]);

  const ranges: TimeRange[] = ["1h", "6h", "24h", "7d"];

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex gap-1">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                timeRange === range
                  ? "bg-accent text-white"
                  : "text-text-muted hover:bg-card-hover hover:text-text-secondary"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
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
              tickFormatter={(v: number) => `${v}ms`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94A3B8" }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="p50"
              name="P50"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#3B82F6", stroke: "#0A0F1C", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="p95"
              name="P95"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#F59E0B", stroke: "#0A0F1C", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="p99"
              name="P99"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#EF4444", stroke: "#0A0F1C", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
