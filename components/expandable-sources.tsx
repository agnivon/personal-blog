"use client";

import React, { useId, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export type SourceItem = {
  _key: string;
  name: string;
  uri: string;
};

export interface ExpandableSourcesProps {
  sources: SourceItem[];
  initialCount?: number;
}

export default function ExpandableSources({
  sources,
  initialCount = 10,
}: ExpandableSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputId = useId();

  if (!sources || sources.length === 0) {
    return null;
  }

  const hasMore = sources.length > initialCount;

  // When expanded, support optional searching across source titles, citation numbers, and URLs
  const filteredSources = isExpanded
    ? sources.filter((src) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase().trim();
        return (
          src.name.toLowerCase().includes(q) ||
          src.uri.toLowerCase().includes(q)
        );
      })
    : sources.slice(0, initialCount);

  return (
    <section
      aria-labelledby="sources-heading"
      className="mt-16 border-t border-border/40 pt-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h3
            id="sources-heading"
            className="font-serif text-2xl font-bold tracking-tight"
          >
            Sources & Grounding
          </h3>
          <span className="rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {sources.length}
          </span>
        </div>

        {isExpanded && sources.length > initialCount && (
          <div className="relative w-full sm:w-64">
            <label htmlFor={searchInputId} className="sr-only">
              Filter sources by title, number, or URL
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              id={searchInputId}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter sources by title or URL..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border/60 bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredSources.map((src) => (
          <a
            key={src._key}
            href={src.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-foreground/20 hover:shadow-xs transition-all"
          >
            <div className="flex flex-col min-w-0 pr-4">
              <span
                className="text-sm font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
                title={src.name}
              >
                {src.name}
              </span>
              <span
                className="text-xs text-muted-foreground truncate"
                title={src.uri}
              >
                {src.uri}
              </span>
            </div>
            <span
              className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sm shrink-0"
              aria-hidden="true"
            >
              ↗
            </span>
          </a>
        ))}
      </div>

      {isExpanded && filteredSources.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No sources match &ldquo;{query}&rdquo;.
        </p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setIsExpanded((prev) => !prev);
              if (isExpanded) {
                setQuery("");
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/60 bg-card/80 hover:bg-card text-sm font-medium text-foreground hover:border-foreground/20 shadow-xs transition-all cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </>
            ) : (
              <>
                <span>Show all {sources.length} sources</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
