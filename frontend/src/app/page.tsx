"use client";

import { useState, useCallback } from "react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BlurFade } from "@/components/ui/blur-fade";
import { SearchBar } from "@/components/query/search-bar";
import { ChunkCard } from "@/components/query/chunk-card";
import { AnswerPanel } from "@/components/query/answer-panel";
import { LatencyBar } from "@/components/query/latency-bar";
import { queryRAG, type QueryResponse } from "@/lib/api";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [results, setResults] = useState<QueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedChunk, setHighlightedChunk] = useState<number | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setHighlightedChunk(null);

    try {
      const response = await queryRAG(query);
      setResults(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCitationClick = useCallback((chunkIndex: number) => {
    setHighlightedChunk(chunkIndex);

    const el = document.getElementById(`chunk-${chunkIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Clear highlight after a few seconds
    setTimeout(() => setHighlightedChunk(null), 3000);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background pattern */}
      <DotPattern
        width={20}
        height={20}
        cr={1}
        className="fill-text-muted/10 [mask-image:linear-gradient(to_bottom,white_20%,transparent_80%)]"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Hero section */}
        <div className="text-center mb-12 sm:mb-16">
          <BlurFade delay={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Retrieval-Augmented Generation
            </div>
          </BlurFade>

          <BlurFade delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight">
              RAG Query System
            </h1>
          </BlurFade>

          <BlurFade delay={0.2}>
            <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
              Ask questions about your documents and get grounded, citation-backed answers
            </p>
          </BlurFade>

          <BlurFade delay={0.3}>
            <div className="mt-8">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>
          </BlurFade>
        </div>

        {/* Error state */}
        {error && (
          <BlurFade delay={0}>
            <div className="max-w-3xl mx-auto mb-8">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-status-red/10 border border-status-red/20">
                <AlertCircle className="h-5 w-5 text-status-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-status-red">
                    Query failed
                  </p>
                  <p className="text-sm text-text-secondary mt-1">{error}</p>
                </div>
              </div>
            </div>
          </BlurFade>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6 space-y-3 animate-pulse">
                <div className="h-4 bg-card-hover rounded w-1/4" />
                <div className="h-3 bg-card-hover rounded w-full" />
                <div className="h-3 bg-card-hover rounded w-5/6" />
                <div className="h-3 bg-card-hover rounded w-3/4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="glass-card rounded-xl p-4 space-y-3 animate-pulse">
                    <div className="h-3 bg-card-hover rounded w-1/3" />
                    <div className="h-3 bg-card-hover rounded w-full" />
                    <div className="h-2 bg-card-hover rounded w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            {/* Left column - Retrieved Chunks */}
            <div className="lg:col-span-2 space-y-4">
              <BlurFade delay={0.05}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Retrieved Chunks
                  <span className="ml-2 text-accent font-mono">
                    ({results.citations.length})
                  </span>
                </h2>
              </BlurFade>

              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                {results.citations.map((chunk, i) => (
                  <BlurFade key={chunk.chunk_index} delay={0.1 + i * 0.05}>
                    <ChunkCard
                      chunk={chunk}
                      index={i}
                      isHighlighted={highlightedChunk === chunk.chunk_index}
                      id={`chunk-${chunk.chunk_index}`}
                    />
                  </BlurFade>
                ))}
              </div>
            </div>

            {/* Right column - Answer + Latency */}
            <div className="lg:col-span-3 space-y-6">
              <BlurFade delay={0.15}>
                <AnswerPanel
                  answer={results.answer}
                  citations={results.citations}
                  grounding={results.grounding}
                  onCitationClick={handleCitationClick}
                />
              </BlurFade>

              <BlurFade delay={0.25}>
                <LatencyBar latency={results.latency} />
              </BlurFade>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!results && !isLoading && !error && (
          <BlurFade delay={0.45}>
            <div className="text-center mt-16 sm:mt-24">
              <div
                className={cn(
                  "inline-flex items-center justify-center",
                  "h-16 w-16 rounded-2xl",
                  "bg-accent/10 text-accent mb-5"
                )}
              >
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed">
                Enter a query above to search your document collection and receive AI-generated answers with citations
              </p>
            </div>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
