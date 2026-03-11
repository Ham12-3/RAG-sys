"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigPanelProps {
  strategy: string;
  chunkSize: number;
  chunkOverlap: number;
  onStrategyChange: (strategy: string) => void;
  onChunkSizeChange: (size: number) => void;
  onChunkOverlapChange: (overlap: number) => void;
}

const strategies = [
  { value: "recursive_character", label: "Recursive Character" },
  { value: "sentence", label: "Sentence-Based" },
  { value: "semantic", label: "Semantic" },
];

export function ConfigPanel({
  strategy,
  chunkSize,
  chunkOverlap,
  onStrategyChange,
  onChunkSizeChange,
  onChunkOverlapChange,
}: ConfigPanelProps) {
  const overlapExceedsHalf = chunkOverlap > chunkSize / 2;

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-6">
        Chunking Configuration
      </h3>

      <div className="flex flex-col gap-6">
        {/* Chunking strategy */}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="strategy-select"
            className="text-sm font-medium text-text-primary"
          >
            Chunking Strategy
          </label>
          <p className="text-xs text-text-muted">
            Choose how documents are split into chunks for embedding.
          </p>
          <select
            id="strategy-select"
            value={strategy}
            onChange={(e) => onStrategyChange(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-border bg-inset px-3 py-2.5 text-sm text-text-primary",
              "appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent",
              "transition-colors duration-150"
            )}
          >
            {strategies.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chunk size slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="chunk-size-slider"
              className="text-sm font-medium text-text-primary"
            >
              Chunk Size (characters)
            </label>
            <span className="rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent tabular-nums">
              {chunkSize}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Maximum number of characters per chunk. Larger chunks preserve more context.
          </p>
          <input
            id="chunk-size-slider"
            type="range"
            min={128}
            max={2048}
            step={64}
            value={chunkSize}
            onChange={(e) => onChunkSizeChange(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>128</span>
            <span>2048</span>
          </div>
        </div>

        {/* Overlap slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="overlap-slider"
              className="text-sm font-medium text-text-primary"
            >
              Chunk Overlap (characters)
            </label>
            <span
              className={cn(
                "rounded-md px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                overlapExceedsHalf
                  ? "bg-status-amber/15 text-status-amber"
                  : "bg-accent/15 text-accent"
              )}
            >
              {chunkOverlap}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Number of overlapping characters between consecutive chunks. Helps preserve context at boundaries.
          </p>
          <input
            id="overlap-slider"
            type="range"
            min={0}
            max={512}
            step={16}
            value={chunkOverlap}
            onChange={(e) => onChunkOverlapChange(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>0</span>
            <span>512</span>
          </div>

          {/* Overlap warning */}
          {overlapExceedsHalf && (
            <div className="flex items-start gap-2 rounded-lg bg-status-amber/10 border border-status-amber/20 px-3 py-2 mt-1">
              <AlertTriangle className="h-4 w-4 shrink-0 text-status-amber mt-0.5" />
              <p className="text-xs text-status-amber">
                Overlap exceeds half the chunk size ({Math.floor(chunkSize / 2)}).
                This may cause excessive duplication and is not recommended.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
