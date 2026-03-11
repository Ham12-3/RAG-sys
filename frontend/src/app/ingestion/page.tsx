"use client";

import { useState, useCallback } from "react";
import { Rocket, AlertCircle, Clock, Hash, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BlurFade } from "@/components/ui/blur-fade";
import { UploadZone } from "@/components/ingestion/upload-zone";
import { ConfigPanel } from "@/components/ingestion/config-panel";
import { ChunkPreview } from "@/components/ingestion/chunk-preview";
import { ProgressBar } from "@/components/ingestion/progress-bar";
import { ingestDocument } from "@/lib/api";
import type { IngestResponse, IngestChunk } from "@/lib/api";
import { cn } from "@/lib/utils";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function IngestionPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [strategy, setStrategy] = useState("recursive_character");
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(50);

  const [isIngesting, setIsIngesting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<IngestResponse | null>(null);
  const [allChunks, setAllChunks] = useState<IngestChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onFilesAdded = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const onFileRemove = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleIngest = useCallback(async () => {
    if (files.length === 0) {
      setError("Please select at least one file to ingest.");
      return;
    }

    setIsIngesting(true);
    setError(null);
    setResults(null);
    setAllChunks([]);

    try {
      // Step 1: Parsing
      setCurrentStep(1);
      await delay(400);

      // Step 2: Chunking
      setCurrentStep(2);
      await delay(400);

      // Step 3: Embedding — start actual API calls
      setCurrentStep(3);

      const responses: IngestResponse[] = [];
      for (const file of files) {
        const response = await ingestDocument(
          file,
          strategy,
          chunkSize,
          chunkOverlap
        );
        responses.push(response);
      }

      // Step 4: Storing
      setCurrentStep(4);
      await delay(500);

      // Step 5: Complete
      setCurrentStep(5);

      const lastResponse = responses[responses.length - 1];
      setResults(lastResponse);

      const combined = responses.flatMap((r) => r.chunks);
      setAllChunks(combined);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setCurrentStep(0);
    } finally {
      setIsIngesting(false);
    }
  }, [files, strategy, chunkSize, chunkOverlap]);

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Page header */}
      <BlurFade delay={0}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Document Ingestion
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Upload documents, configure chunking, and ingest into the vector store.
          </p>
        </div>
      </BlurFade>

      {/* Split layout: Upload + Config */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BlurFade delay={0.05}>
          <UploadZone
            files={files}
            onFilesAdded={onFilesAdded}
            onFileRemove={onFileRemove}
          />
        </BlurFade>

        <BlurFade delay={0.1}>
          <ConfigPanel
            strategy={strategy}
            chunkSize={chunkSize}
            chunkOverlap={chunkOverlap}
            onStrategyChange={setStrategy}
            onChunkSizeChange={setChunkSize}
            onChunkOverlapChange={setChunkOverlap}
          />
        </BlurFade>
      </div>

      {/* Ingest button + error */}
      <BlurFade delay={0.15}>
        <div className="mt-6 flex flex-col items-start gap-3">
          <button
            onClick={handleIngest}
            disabled={isIngesting || files.length === 0}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
              isIngesting || files.length === 0
                ? "bg-card text-text-muted cursor-not-allowed"
                : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/25 hover:shadow-accent/40"
            )}
          >
            <Rocket className={cn("h-4 w-4", isIngesting && "animate-pulse")} />
            {isIngesting ? "Ingesting..." : "Ingest Documents"}
          </button>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 rounded-lg bg-status-red/10 border border-status-red/20 px-4 py-2.5"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-status-red" />
                <p className="text-sm text-status-red">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BlurFade>

      {/* Progress bar */}
      {(isIngesting || currentStep > 0) && (
        <BlurFade delay={0}>
          <div className="mt-6">
            <ProgressBar currentStep={currentStep} isActive={isIngesting} />
          </div>
        </BlurFade>
      )}

      {/* Result summary */}
      <AnimatePresence>
        {results && !isIngesting && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-status-green mb-3 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-status-green" />
                Ingestion Complete
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">Document ID</p>
                    <p className="text-sm font-mono text-text-primary truncate max-w-[140px]">
                      {results.document_id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">Total Chunks</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {results.total_chunks}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">Processing Time</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {results.processing_time_ms.toLocaleString()} ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">Embeddings</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {results.embedding_provider}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chunk preview */}
      <BlurFade delay={0.2}>
        <div className="mt-6">
          <ChunkPreview chunks={allChunks} isLoading={isIngesting} />
        </div>
      </BlurFade>
    </div>
  );
}
