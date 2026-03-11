"use client";

import { FileSearch } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { IngestChunk } from "@/lib/api";

interface ChunkPreviewProps {
  chunks: IngestChunk[];
  isLoading: boolean;
}

function SkeletonChunk({ index }: { index: number }) {
  return (
    <div
      className="glass-card rounded-lg p-4 animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-6 w-14 rounded-md bg-card-hover" />
        <div className="h-4 w-24 rounded bg-card-hover" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-card-hover" />
        <div className="h-3 w-4/5 rounded bg-card-hover" />
        <div className="h-3 w-3/5 rounded bg-card-hover" />
      </div>
    </div>
  );
}

export function ChunkPreview({ chunks, isLoading }: ChunkPreviewProps) {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Chunk Preview
      </h3>

      <div className="max-h-[480px] overflow-y-auto pr-1 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonChunk key={i} index={i} />
            ))}
          </div>
        )}

        {!isLoading && chunks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card mb-4">
              <FileSearch className="h-7 w-7 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary">
              Upload and ingest files to see chunk preview
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!isLoading &&
            chunks.map((chunk) => (
              <motion.div
                key={chunk.chunk_index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: chunk.chunk_index * 0.03 }}
                className="glass-card rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent tabular-nums">
                    #{chunk.chunk_index}
                  </span>
                  <span className="text-xs text-text-muted">
                    {chunk.char_count.toLocaleString()} chars
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm leading-relaxed text-text-secondary",
                    "line-clamp-4"
                  )}
                >
                  {chunk.text_preview}
                </p>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
