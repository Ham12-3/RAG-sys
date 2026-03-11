"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Citation, Grounding } from "@/lib/api";

interface AnswerPanelProps {
  answer: string;
  citations: Citation[];
  grounding: Grounding;
  onCitationClick: (index: number) => void;
}

type ConfidenceLevel = "high" | "medium" | "low";

function getConfidence(score: number): {
  level: ConfidenceLevel;
  label: string;
  color: string;
  bgColor: string;
  icon: typeof ShieldCheck;
} {
  if (score >= 0.8)
    return {
      level: "high",
      label: "High Confidence",
      color: "text-status-green",
      bgColor: "bg-status-green/15",
      icon: ShieldCheck,
    };
  if (score >= 0.5)
    return {
      level: "medium",
      label: "Medium Confidence",
      color: "text-status-amber",
      bgColor: "bg-status-amber/15",
      icon: ShieldAlert,
    };
  return {
    level: "low",
    label: "Low Confidence",
    color: "text-status-red",
    bgColor: "bg-status-red/15",
    icon: ShieldAlert,
  };
}

/**
 * Parse answer text and split it into segments of plain text and citation references.
 * Citation references look like [1], [2], etc.
 */
function parseAnswer(text: string): Array<{ type: "text"; value: string } | { type: "citation"; index: number }> {
  const segments: Array<{ type: "text"; value: string } | { type: "citation"; index: number }> = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "citation", index: parseInt(match[1], 10) });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

export function AnswerPanel({
  answer,
  citations,
  grounding,
  onCitationClick,
}: AnswerPanelProps) {
  const [showUngrounded, setShowUngrounded] = useState(false);
  const confidence = getConfidence(grounding.grounding_score);
  const ConfidenceIcon = confidence.icon;
  const segments = useMemo(() => parseAnswer(answer), [answer]);

  return (
    <div className="glass-card rounded-xl p-6 space-y-5">
      {/* Answer heading */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
        Answer
      </h3>

      {/* Answer body with inline citations */}
      <div className="text-text-primary leading-relaxed text-[15px]">
        {segments.map((seg, i) => {
          if (seg.type === "text") {
            return <span key={i}>{seg.value}</span>;
          }
          const citationIndex = seg.index;
          const exists = citations.some((c) => c.chunk_index === citationIndex);
          return (
            <button
              key={i}
              onClick={() => onCitationClick(citationIndex)}
              disabled={!exists}
              className={cn(
                "inline-flex items-center justify-center",
                "mx-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold",
                "transition-all duration-150",
                exists
                  ? "bg-accent/20 text-accent hover:bg-accent/35 cursor-pointer active:scale-90"
                  : "bg-card text-text-muted cursor-default"
              )}
              title={exists ? `Go to chunk ${citationIndex}` : `Citation ${citationIndex}`}
            >
              {citationIndex}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Confidence badge & grounding stats */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
            confidence.bgColor,
            confidence.color
          )}
        >
          <ConfidenceIcon className="h-3.5 w-3.5" />
          {confidence.label}
        </span>

        <span className="text-xs text-text-muted">
          {grounding.grounded_sentences}/{grounding.total_sentences} sentences
          grounded
        </span>

        <span className="text-xs text-text-muted font-mono">
          ({(grounding.grounding_score * 100).toFixed(0)}%)
        </span>
      </div>

      {/* Ungrounded claims collapsible section */}
      {grounding.ungrounded_claims.length > 0 && (
        <div className="rounded-lg bg-status-amber/5 border border-status-amber/20">
          <button
            onClick={() => setShowUngrounded((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm text-status-amber hover:bg-status-amber/10 transition-colors rounded-lg"
          >
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              {grounding.ungrounded_claims.length} ungrounded claim
              {grounding.ungrounded_claims.length !== 1 && "s"}
            </span>
            {showUngrounded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showUngrounded && (
            <ul className="px-4 pb-3 space-y-2">
              {grounding.ungrounded_claims.map((claim, i) => (
                <li
                  key={i}
                  className="text-sm text-text-secondary pl-6 relative before:content-[''] before:absolute before:left-2 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-status-amber/60"
                >
                  {claim}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
