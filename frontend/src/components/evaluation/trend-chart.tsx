"use client";

import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

export interface TrendDataPoint {
  timestamp: string;
  recall_at_5: number;
  recall_at_10: number;
  mrr: number;
  ndcg: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
}

const metricOptions = [
  { key: "recall_at_5", label: "Recall@5" },
  { key: "recall_at_10", label: "Recall@10" },
  { key: "mrr", label: "MRR" },
  { key: "ndcg", label: "NDCG" },
] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const metricLabel =
    metricOptions.find((m) => m.key === entry.dataKey)?.label ?? entry.dataKey;

  return (
    <div className="glass-card rounded-lg px-4 py-3 shadow-xl">
      <p className="mb-1 text-xs font-medium text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-accent">
        {metricLabel}: {entry.value.toFixed(3)}
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  selectedMetric,
  onMetricChange,
}: TrendChartProps) {
  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Metric Trends
          </h3>
        </div>

        {/* Toggle Buttons */}
        <div className="flex gap-1 rounded-lg bg-inset p-1">
          {metricOptions.map((metric) => (
            <button
              key={metric.key}
              onClick={() => onMetricChange(metric.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                selectedMetric === metric.key
                  ? "bg-accent text-white shadow-md shadow-accent/25"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border">
          <TrendingUp className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">
            No trend data yet. Run evaluations to see metric trends over time.
          </p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1E293B"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={false}
                dy={8}
              />
              <YAxis
                domain={[0, 1]}
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={false}
                dx={-4}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={0.8}
                stroke="#F59E0B"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{
                  value: "Target 0.8",
                  position: "insideTopRight",
                  fill: "#F59E0B",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: "#3B82F6",
                  stroke: "#0A0F1C",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#3B82F6",
                  stroke: "#0A0F1C",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
