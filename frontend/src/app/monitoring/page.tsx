"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Database, Cpu, Zap } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { HealthCard } from "@/components/monitoring/health-card";
import { LatencyCharts } from "@/components/monitoring/latency-charts";
import { QueryVolume } from "@/components/monitoring/query-volume";
import { StatsMarquee } from "@/components/monitoring/stats-marquee";
import { checkHealth, type HealthResponse } from "@/lib/api";

// ---------------------------------------------------------------------------
// Sample data generators
// ---------------------------------------------------------------------------

function generateLatencyData(
  hours: number,
  baselines: { p50: [number, number]; p95: [number, number]; p99: [number, number] }
) {
  const now = Date.now();
  const points: Array<{ timestamp: string; p50: number; p95: number; p99: number }> = [];

  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 3600_000);
    const label =
      hours <= 24
        ? t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : t.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit" });

    const jitter = () => (Math.random() - 0.5) * 2;

    points.push({
      timestamp: label,
      p50: +(baselines.p50[0] + Math.random() * (baselines.p50[1] - baselines.p50[0]) + jitter()).toFixed(1),
      p95: +(baselines.p95[0] + Math.random() * (baselines.p95[1] - baselines.p95[0]) + jitter()).toFixed(1),
      p99: +(baselines.p99[0] + Math.random() * (baselines.p99[1] - baselines.p99[0]) + jitter()).toFixed(1),
    });
  }
  return points;
}

function generateQueryVolumeData(hours: number) {
  const now = Date.now();
  const points: Array<{ timestamp: string; count: number }> = [];

  for (let i = hours; i >= 0; i--) {
    const t = new Date(now - i * 3600_000);
    // Simulate a diurnal pattern: more queries during business hours
    const hour = t.getHours();
    const diurnalFactor = hour >= 9 && hour <= 18 ? 1.5 : 0.6;
    const count = Math.floor((50 + Math.random() * 150) * diurnalFactor);

    points.push({
      timestamp: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      count,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  // Generate sample data once using useMemo so it stays stable across renders
  const embeddingLatency = useMemo(
    () =>
      generateLatencyData(24, {
        p50: [30, 80],
        p95: [120, 280],
        p99: [300, 650],
      }),
    []
  );

  const retrievalLatency = useMemo(
    () =>
      generateLatencyData(24, {
        p50: [15, 60],
        p95: [80, 200],
        p99: [200, 500],
      }),
    []
  );

  const generationLatency = useMemo(
    () =>
      generateLatencyData(24, {
        p50: [80, 200],
        p95: [350, 600],
        p99: [700, 1500],
      }),
    []
  );

  const queryVolumeData = useMemo(() => generateQueryVolumeData(24), []);

  const totalQueries = useMemo(
    () => queryVolumeData.reduce((sum, d) => sum + d.count, 0),
    [queryVolumeData]
  );

  const avgLatency = useMemo(() => {
    const avg =
      embeddingLatency.reduce((s, d) => s + d.p50, 0) / embeddingLatency.length;
    return Math.round(avg);
  }, [embeddingLatency]);

  // Health polling
  const fetchHealth = useCallback(async () => {
    try {
      const res = await checkHealth();
      setHealth(res);
      setLastChecked(new Date());
    } catch {
      setHealth({ status: "degraded", services: { api: false, weaviate: false } });
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 30_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  // Update relative timestamps every 10s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  // Derive service health from response
  const weaviateHealthy = health?.services.weaviate ?? false;
  const apiHealthy = health?.services.api ?? false;
  // LLM service is synthetic — mark healthy when API is healthy
  const llmHealthy = health?.status === "healthy";

  const marqueeStats = useMemo(
    () => [
      { label: "Total Queries", value: totalQueries.toLocaleString() },
      { label: "Avg Latency", value: `${avgLatency}ms` },
      { label: "Uptime", value: "99.94%" },
      { label: "Active Collections", value: "3" },
      { label: "Documents Indexed", value: "1,247" },
      { label: "Healthy Services", value: `${[weaviateHealthy, apiHealthy, llmHealthy].filter(Boolean).length}/3` },
      { label: "Cache Hit Rate", value: "87.3%" },
      { label: "P99 Retrieval", value: `${retrievalLatency[retrievalLatency.length - 1]?.p99 ?? 0}ms` },
    ],
    [totalQueries, avgLatency, weaviateHealthy, apiHealthy, llmHealthy, retrievalLatency]
  );

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Title */}
        <BlurFade delay={0}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                System Monitoring
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Real-time health, latency, and throughput metrics
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-text-muted">Total Queries</span>
              <span className="text-xl font-bold text-accent">
                <NumberTicker value={totalQueries} delay={0.3} />
              </span>
            </div>
          </div>
        </BlurFade>

        {/* Stats Marquee */}
        <BlurFade delay={0.1}>
          <StatsMarquee stats={marqueeStats} />
        </BlurFade>

        {/* Health Status */}
        <BlurFade delay={0.2}>
          <section>
            <h2 className="mb-4 text-sm font-medium tracking-wide text-text-muted uppercase">
              Service Health
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <HealthCard
                name="Weaviate"
                isHealthy={weaviateHealthy}
                lastChecked={lastChecked}
                icon={<Database className="h-5 w-5" />}
              />
              <HealthCard
                name="Embedding Service"
                isHealthy={apiHealthy}
                lastChecked={lastChecked}
                icon={<Cpu className="h-5 w-5" />}
              />
              <HealthCard
                name="LLM Service"
                isHealthy={llmHealthy}
                lastChecked={lastChecked}
                icon={<Zap className="h-5 w-5" />}
              />
            </div>
          </section>
        </BlurFade>

        {/* Latency Charts */}
        <BlurFade delay={0.3}>
          <section>
            <h2 className="mb-4 text-sm font-medium tracking-wide text-text-muted uppercase">
              Latency Metrics
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <LatencyCharts data={embeddingLatency} title="Embedding Latency" />
              <LatencyCharts data={retrievalLatency} title="Retrieval Latency" />
              <LatencyCharts data={generationLatency} title="Generation Latency" />
            </div>
          </section>
        </BlurFade>

        {/* Query Volume */}
        <BlurFade delay={0.4}>
          <section>
            <h2 className="mb-4 text-sm font-medium tracking-wide text-text-muted uppercase">
              Throughput
            </h2>
            <QueryVolume data={queryVolumeData} />
          </section>
        </BlurFade>
      </div>
    </div>
  );
}
