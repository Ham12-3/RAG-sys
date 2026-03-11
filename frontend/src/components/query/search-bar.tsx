"use client";

import { useState, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed && !isLoading) {
        onSearch(trimmed);
      }
    },
    [query, isLoading, onSearch]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed && !isLoading) {
          onSearch(trimmed);
        }
      }
    },
    [query, isLoading, onSearch]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div
        className={cn(
          "glass-card relative flex items-center rounded-2xl transition-all duration-300",
          "px-5 py-3",
          isFocused && "ring-2 ring-accent/50 animate-pulse-glow border-border-glow",
          !isFocused && "hover:bg-card-hover"
        )}
      >
        <Search
          className={cn(
            "h-5 w-5 shrink-0 transition-colors duration-200",
            isFocused ? "text-accent" : "text-text-muted"
          )}
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          disabled={isLoading}
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "mx-4 text-lg text-text-primary placeholder:text-text-muted",
            "disabled:opacity-50"
          )}
        />

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={cn(
            "shrink-0 flex items-center justify-center",
            "h-10 w-10 rounded-xl",
            "bg-accent text-white",
            "transition-all duration-200",
            "hover:bg-accent/80 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  );
}
