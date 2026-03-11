"use client";

import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import type { Citation } from "@/lib/api";

interface ChunkCardProps {
  chunk: Citation;
  index: number;
  isHighlighted: boolean;
  id: string;
}

function getScoreColor(score: number) {
  if (score >= 0.8) return "bg-status-green";
  if (score >= 0.5) return "bg-status-amber";
  return "bg-status-red";
}

function getScoreTrackColor(score: number) {
  if (score >= 0.8) return "bg-status-green/20";
  if (score >= 0.5) return "bg-status-amber/20";
  return "bg-status-red/20";
}

export function ChunkCard({ chunk, index, isHighlighted, id }: ChunkCardProps) {
  const truncatedText =
    chunk.text.length > 280 ? chunk.text.slice(0, 280) + "..." : chunk.text;

  return (
    <div
      id={id}
      className={cn(
        "glass-card rounded-xl p-4 transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5 hover:bg-card-hover",
        isHighlighted && [
          "border-accent/40 ring-1 ring-accent/30",
          "scale-[1.02] shadow-lg shadow-accent-glow",
        ]
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center justify-center h-6 w-6 rounded-md bg-accent/15 text-accent text-xs font-bold">
          {index + 1}
        </span>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-inset text-text-secondary text-xs font-medium">
          <FileText className="h-3 w-3" />
          <span className="max-w-[140px] truncate">{chunk.source}</span>
        </div>
      </div>

      {/* Text snippet */}
      <p className="text-sm text-text-secondary leading-relaxed mb-3">
        {truncatedText}
      </p>

      {/* Relevance score bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Relevance</span>
          <span className="text-text-secondary font-mono">
            {(chunk.relevance_score * 100).toFixed(1)}%
          </span>
        </div>
        <div
          className={cn("h-1.5 w-full rounded-full", getScoreTrackColor(chunk.relevance_score))}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              getScoreColor(chunk.relevance_score)
            )}
            style={{ width: `${Math.min(chunk.relevance_score * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
