"use client";

import { useState, useCallback } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { MetricCard } from "@/components/evaluation/metric-card";
import { TrendChart, type TrendDataPoint } from "@/components/evaluation/trend-chart";
import { EvalTable } from "@/components/evaluation/eval-table";
import { evaluate, type EvalResponse, type EvalQuery } from "@/lib/api";
import { Play, Loader2, FlaskConical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_QUERIES: EvalQuery[] = [
  {
    query: "What is retrieval-augmented generation?",
    relevant_doc_ids: ["doc_001", "doc_002"],
  },
  {
    query: "How does vector similarity search work?",
    relevant_doc_ids: ["doc_003"],
  },
  {
    query: "Explain the transformer architecture",
    relevant_doc_ids: ["doc_004", "doc_005"],
  },
  {
    query: "What are embedding models used for?",
    relevant_doc_ids: ["doc_006"],
  },
  {
    query: "How to evaluate RAG system performance?",
    relevant_doc_ids: ["doc_007", "doc_008"],
  },
];

const DEFAULT_QUERY_JSON = JSON.stringify(SAMPLE_QUERIES, null, 2);

export default function EvaluationPage() {
  const [evalResults, setEvalResults] = useState<EvalResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("recall_at_5");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState(DEFAULT_QUERY_JSON);
  const [topK, setTopK] = useState(5);

  const runEvaluation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let queries: EvalQuery[];
      try {
        queries = JSON.parse(queryInput);
        if (!Array.isArray(queries)) {
          throw new Error("Input must be a JSON array of query objects.");
        }
      } catch (parseErr) {
        throw new Error(
          `Invalid JSON: ${parseErr instanceof Error ? parseErr.message : "Could not parse input."}`
        );
      }

      const result = await evaluate(queries, topK);
      setEvalResults(result);

      // Append to trend data
      const now = new Date();
      const timestamp = `${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      setTrendData((prev) => [
        ...prev,
        {
          timestamp,
          recall_at_5: topK === 5 ? result.aggregate_recall_at_k : (prev.at(-1)?.recall_at_5 ?? 0),
          recall_at_10: topK === 10 ? result.aggregate_recall_at_k : (prev.at(-1)?.recall_at_10 ?? 0),
          mrr: result.aggregate_mrr,
          ndcg: result.aggregate_ndcg,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [queryInput, topK]);

  const resetResults = () => {
    setEvalResults(null);
    setTrendData([]);
    setError(null);
    setQueryInput(DEFAULT_QUERY_JSON);
  };

  // Derive metrics from eval results
  const recallAt5 = evalResults?.top_k === 5 ? evalResults.aggregate_recall_at_k : 0;
  const recallAt10 = evalResults?.top_k === 10 ? evalResults.aggregate_recall_at_k : 0;
  const mrr = evalResults?.aggregate_mrr ?? 0;
  const ndcg = evalResults?.aggregate_ndcg ?? 0;
  const totalQueries = evalResults?.total_queries ?? 0;

  // Simulated hallucination rate derived from grounding (placeholder)
  const hallucinationRate = evalResults
    ? Math.max(0, (1 - evalResults.aggregate_ndcg) * 30)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <BlurFade delay={0}>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <FlaskConical className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Evaluation Dashboard
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Measure and track your RAG pipeline retrieval quality
              </p>
            </div>
          </div>
        </BlurFade>

        {/* Metric Cards */}
        <BlurFade delay={0.1}>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Recall@5"
              value={recallAt5}
              decimalPlaces={2}
            />
            <MetricCard
              label="Recall@10"
              value={recallAt10}
              decimalPlaces={2}
            />
            <MetricCard
              label="MRR"
              value={mrr}
              decimalPlaces={2}
            />
            <MetricCard
              label="NDCG"
              value={ndcg}
              decimalPlaces={2}
            />
            <MetricCard
              label="Hallucination Rate"
              value={hallucinationRate}
              decimalPlaces={1}
              suffix="%"
              invertThresholds
              thresholds={{ green: 20, amber: 50 }}
            />
            <MetricCard
              label="Total Queries"
              value={totalQueries}
              decimalPlaces={0}
              noThreshold
            />
          </div>
        </BlurFade>

        {/* Run Evaluation Section */}
        <BlurFade delay={0.2}>
          <div className="glass-card mb-8 rounded-xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <Play className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">
                  Run Evaluation
                </h3>
              </div>
              <button
                onClick={resetResults}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-inset hover:text-text-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <p className="mb-4 text-sm text-text-secondary">
              Enter evaluation queries as a JSON array. Each query needs a{" "}
              <code className="rounded bg-inset px-1.5 py-0.5 text-xs text-accent-cyan">
                query
              </code>{" "}
              string and an array of{" "}
              <code className="rounded bg-inset px-1.5 py-0.5 text-xs text-accent-cyan">
                relevant_doc_ids
              </code>
              .
            </p>

            <textarea
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              rows={10}
              spellCheck={false}
              className="mb-4 w-full resize-y rounded-lg border border-border bg-inset px-4 py-3 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/25"
              placeholder="Enter evaluation queries JSON..."
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="top-k"
                  className="text-sm font-medium text-text-secondary"
                >
                  Top K:
                </label>
                <select
                  id="top-k"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="rounded-lg border border-border bg-inset px-3 py-1.5 text-sm text-text-primary outline-none transition-colors focus:border-accent/50"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <button
                onClick={runEvaluation}
                disabled={isLoading}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200",
                  isLoading
                    ? "cursor-not-allowed bg-accent/50"
                    : "bg-accent shadow-lg shadow-accent/25 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98]"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Evaluation
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-status-red/20 bg-status-red/5 px-4 py-3 text-sm text-status-red">
                {error}
              </div>
            )}
          </div>
        </BlurFade>

        {/* Trend Chart */}
        <BlurFade delay={0.3}>
          <div className="mb-8">
            <TrendChart
              data={trendData}
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />
          </div>
        </BlurFade>

        {/* Evaluation Table */}
        <BlurFade delay={0.4}>
          <EvalTable data={evalResults?.per_query ?? []} />
        </BlurFade>
      </div>
    </div>
  );
}
