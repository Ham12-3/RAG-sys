"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface UploadZoneProps {
  files: File[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (index: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED_TYPES = [".pdf", ".md", ".txt"];
const ACCEPT_STRING = ACCEPTED_TYPES.join(",");

export function UploadZone({ files, onFilesAdded, onFileRemove }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const accepted = Array.from(fileList).filter((f) => {
        const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
        return ACCEPTED_TYPES.includes(ext);
      });
      if (accepted.length > 0) {
        onFilesAdded(accepted);
      }
    },
    [onFilesAdded]
  );

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <motion.div
        animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors duration-200",
          isDragOver
            ? "border-accent bg-accent/10"
            : "border-border hover:border-text-muted bg-inset/50"
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-200",
            isDragOver ? "bg-accent/20 text-accent" : "bg-card text-text-secondary"
          )}
        >
          <Upload className="h-8 w-8" />
        </div>

        <div className="text-center">
          <p className="text-lg font-medium text-text-primary">
            Drag & drop files here
          </p>
          <p className="mt-1 text-sm text-text-muted">
            PDF, MD, TXT supported
          </p>
        </div>

        <span
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
            isDragOver
              ? "bg-accent text-white"
              : "bg-card text-text-secondary hover:bg-card-hover"
          )}
        >
          Browse files
        </span>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          onChange={onInputChange}
          className="hidden"
        />
      </motion.div>

      {/* File list */}
      <AnimatePresence mode="popLayout">
        {files.map((file, index) => (
          <motion.div
            key={`${file.name}-${file.size}-${index}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="glass-card flex items-center gap-3 rounded-lg px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-4 w-4 text-accent" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {file.name}
              </p>
              <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove(index);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-status-red/10 hover:text-status-red transition-colors duration-150"
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
