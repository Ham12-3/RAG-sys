import {
  mockQueryRAG,
  mockIngestDocument,
  mockEvaluate,
  mockCheckHealth,
} from "./mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

let _demoMode: boolean | null = null;

/** Check once whether the backend is reachable. Cache the result. */
async function isDemoMode(): Promise<boolean> {
  if (_demoMode !== null) return _demoMode;

  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    _demoMode = !res.ok;
  } catch {
    _demoMode = true;
  }

  if (_demoMode) {
    console.info(
      "%c[RAG System] Backend unreachable — running in demo mode with mock data",
      "color: #F59E0B; font-weight: bold"
    );
  }
  return _demoMode;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Types
export interface Citation {
  chunk_index: number;
  source: string;
  text: string;
  relevance_score: number;
}

export interface Grounding {
  grounding_score: number;
  total_sentences: number;
  grounded_sentences: number;
  ungrounded_claims: string[];
}

export interface Latency {
  embedding_ms: number;
  retrieval_ms: number;
  generation_ms: number;
  hallucination_check_ms: number;
  total_ms: number;
}

export interface QueryResponse {
  answer: string;
  citations: Citation[];
  grounding: Grounding;
  latency: Latency;
}

export interface IngestChunk {
  chunk_index: number;
  text_preview: string;
  char_count: number;
}

export interface IngestResponse {
  document_id: string;
  source: string;
  total_chunks: number;
  chunks: IngestChunk[];
  embedding_provider: string;
  processing_time_ms: number;
}

export interface EvalQuery {
  query: string;
  relevant_doc_ids: string[];
}

export interface EvalPerQuery {
  query: string;
  recall_at_k: number;
  reciprocal_rank: number;
  ndcg: number;
}

export interface EvalResponse {
  per_query: EvalPerQuery[];
  aggregate_recall_at_k: number;
  aggregate_mrr: number;
  aggregate_ndcg: number;
  total_queries: number;
  top_k: number;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  services: {
    api: boolean;
    weaviate: boolean;
  };
}

// API functions — try real backend first, fallback to mock data

export async function queryRAG(
  query: string,
  top_k: number = 5,
  collection_name?: string
): Promise<QueryResponse> {
  if (await isDemoMode()) return mockQueryRAG(query, top_k);

  return apiFetch<QueryResponse>("/query", {
    method: "POST",
    body: JSON.stringify({ query, top_k, collection_name }),
  });
}

export async function ingestDocument(
  file: File,
  chunking_strategy: string = "recursive_character",
  chunk_size: number = 512,
  chunk_overlap: number = 50,
  collection_name?: string
): Promise<IngestResponse> {
  if (await isDemoMode())
    return mockIngestDocument(file, chunking_strategy, chunk_size, chunk_overlap);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("chunking_strategy", chunking_strategy);
  formData.append("chunk_size", chunk_size.toString());
  formData.append("chunk_overlap", chunk_overlap.toString());
  if (collection_name) formData.append("collection_name", collection_name);

  const res = await fetch(`${API_BASE}/ingest`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function evaluate(
  queries: EvalQuery[],
  top_k: number = 5,
  collection_name?: string
): Promise<EvalResponse> {
  if (await isDemoMode()) return mockEvaluate(queries, top_k);

  return apiFetch<EvalResponse>("/evaluate", {
    method: "POST",
    body: JSON.stringify({ queries, top_k, collection_name }),
  });
}

export async function checkHealth(): Promise<HealthResponse> {
  if (await isDemoMode()) return mockCheckHealth();

  return apiFetch<HealthResponse>("/health");
}
