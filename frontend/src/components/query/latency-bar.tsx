"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { Latency } from "@/lib/api";

interface LatencyBarProps {
  latency: Latency;
}

interface Segment {
  key: string;
  label: string;
  ms: number;
  color: string;
  textColor: string;
}

export function LatencyBar({ latency }: LatencyBarProps) {
  const segments: Segment[] = useMemo(
    () => [
      {
        key: "embedding",
        label: "Embed",
        ms: latency.embedding_ms,
        color: "bg-accent",
        textColor: "text-accent",
      },
      {
        key: "retrieval",
        label: "Retrieve",
        ms: latency.retrieval_ms,
        color: "bg-accent-cyan",
        textColor: "text-accent-cyan",
      },
      {
        key: "generation",
        label: "Generate",
        ms: latency.generation_ms,
        color: "bg-indigo",
        textColor: "text-indigo",
      },
      {
        key: "hallucination",
        label: "Hallucination Check",
        ms: latency.hallucination_check_ms,
        color: "bg-purple-500",
        textColor: "text-purple-400",
      },
    ],
    [latency]
  );

  const totalSegmentMs = segments.reduce((sum, s) => sum + s.ms, 0);

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
          <Clock className="h-4 w-4" />
          Latency Breakdown
        </h3>
        <span className="text-sm font-mono text-text-secondary">
          {latency.total_ms.toFixed(0)}ms total
        </span>
      </div>

      {/* Stacked bar */}
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-inset">
        {segments.map((seg, i) => {
          const pct = totalSegmentMs > 0 ? (seg.ms / totalSegmentMs) * 100 : 0;
          if (pct <= 0) return null;

          return (
            <motion.div
              key={seg.key}
              className={cn("h-full", seg.color, i === 0 && "rounded-l-full", i === segments.length - 1 && "rounded-r-full")}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {segments.map((seg) => (
          <div key={seg.key} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", seg.color)} />
              <span className="text-xs text-text-muted truncate">
                {seg.label}
              </span>
            </div>
            <span className={cn("text-sm font-mono font-medium", seg.textColor)}>
              {seg.ms.toFixed(0)}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
