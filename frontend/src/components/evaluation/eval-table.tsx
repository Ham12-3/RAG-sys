"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  TableProperties,
} from "lucide-react";
import type { EvalPerQuery } from "@/lib/api";

interface EvalTableProps {
  data: EvalPerQuery[];
}

function getMetricColor(value: number): string {
  if (value >= 0.8) return "text-status-green";
  if (value >= 0.5) return "text-status-amber";
  return "text-status-red";
}

function getMetricBgColor(value: number): string {
  if (value >= 0.8) return "bg-status-green/10";
  if (value >= 0.5) return "bg-status-amber/10";
  return "bg-status-red/10";
}

function getRowStatus(row: EvalPerQuery): "pass" | "mixed" | "fail" {
  const metrics = [row.recall_at_k, row.reciprocal_rank, row.ndcg];
  const aboveThreshold = metrics.filter((m) => m >= 0.5).length;
  if (aboveThreshold === metrics.length) return "pass";
  if (aboveThreshold === 0) return "fail";
  return "mixed";
}

function StatusIcon({ status }: { status: "pass" | "mixed" | "fail" }) {
  switch (status) {
    case "pass":
      return <CheckCircle className="h-5 w-5 text-status-green" />;
    case "mixed":
      return <AlertTriangle className="h-5 w-5 text-status-amber" />;
    case "fail":
      return <XCircle className="h-5 w-5 text-status-red" />;
  }
}

function MetricBadge({ value, label }: { value: number; label: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-lg px-4 py-3",
        getMetricBgColor(value)
      )}
    >
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <span className={cn("mt-1 text-lg font-bold", getMetricColor(value))}>
        {value.toFixed(3)}
      </span>
    </div>
  );
}

export function EvalTable({ data }: EvalTableProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleRow = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
            <TableProperties className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Evaluation Results
          </h3>
        </div>
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border">
          <TableProperties className="h-10 w-10 text-text-muted/50" />
          <p className="text-sm text-text-muted">
            No evaluation results yet. Run an evaluation to see per-query
            metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
          <TableProperties className="h-5 w-5 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">
          Evaluation Results
        </h3>
        <span className="ml-auto rounded-full bg-inset px-3 py-1 text-xs font-medium text-text-muted">
          {data.length} {data.length === 1 ? "query" : "queries"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] table-fixed">
          <thead>
            <tr className="sticky top-0 z-10 bg-inset">
              <th className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                #
              </th>
              <th className="w-auto px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                Query
              </th>
              <th className="w-28 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                Recall@K
              </th>
              <th className="w-28 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                MRR
              </th>
              <th className="w-24 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                NDCG
              </th>
              <th className="w-20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                Status
              </th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const status = getRowStatus(row);
              const isExpanded = expandedIndex === index;

              return (
                <Fragment key={index}>
                  <tr
                    onClick={() => toggleRow(index)}
                    className={cn(
                      "cursor-pointer border-t border-border transition-colors duration-150",
                      index % 2 === 0 ? "bg-transparent" : "bg-inset/40",
                      isExpanded && "bg-card-hover",
                      !isExpanded && "hover:bg-card-hover/50"
                    )}
                  >
                    <td className="px-4 py-3 text-sm tabular-nums text-text-muted">
                      {index + 1}
                    </td>
                    <td className="max-w-0 truncate px-4 py-3 text-sm text-text-primary">
                      {row.query}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          getMetricColor(row.recall_at_k)
                        )}
                      >
                        {row.recall_at_k.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          getMetricColor(row.reciprocal_rank)
                        )}
                      >
                        {row.reciprocal_rank.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          getMetricColor(row.ndcg)
                        )}
                      >
                        {row.ndcg.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <StatusIcon status={status} />
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-text-muted transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </td>
                  </tr>

                  {/* Expanded Detail */}
                  <tr>
                    <td colSpan={7} className="p-0">
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border bg-inset/60 px-6 py-5">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-text-muted">
                                Full Query
                              </p>
                              <p className="mb-5 text-sm leading-relaxed text-text-primary">
                                {row.query}
                              </p>

                              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">
                                Detailed Metrics
                              </p>
                              <div className="grid grid-cols-3 gap-3">
                                <MetricBadge
                                  label="Recall@K"
                                  value={row.recall_at_k}
                                />
                                <MetricBadge
                                  label="Reciprocal Rank (MRR)"
                                  value={row.reciprocal_rank}
                                />
                                <MetricBadge
                                  label="NDCG"
                                  value={row.ndcg}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Fragment import needed for keyed fragments */
import { Fragment } from "react";
