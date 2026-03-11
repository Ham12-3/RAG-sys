import type {
  QueryResponse,
  IngestResponse,
  EvalResponse,
  EvalQuery,
  HealthResponse,
} from "./api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Query mock
// ---------------------------------------------------------------------------

const MOCK_ANSWERS: Record<string, QueryResponse> = {
  default: {
    answer:
      "Retrieval-Augmented Generation (RAG) is a technique that enhances large language model outputs by grounding them in retrieved evidence from an external knowledge base [1]. The process works in three stages: first, the user query is embedded into a vector representation; second, a similarity search retrieves the most relevant document chunks from a vector store [2]; and third, the retrieved chunks are passed as context to an LLM which generates a grounded answer [3]. This approach significantly reduces hallucinations compared to purely parametric generation because the model can reference specific source material [4]. RAG systems are evaluated using metrics such as Recall@K, Mean Reciprocal Rank (MRR), and Normalized Discounted Cumulative Gain (NDCG) to measure retrieval quality [5].",
    citations: [
      {
        chunk_index: 0,
        source: "rag_overview.pdf",
        text: "Retrieval-Augmented Generation (RAG) combines information retrieval with text generation. By retrieving relevant passages from a corpus before generating a response, RAG models produce more factual and verifiable outputs than standalone language models.",
        relevance_score: 0.94,
      },
      {
        chunk_index: 1,
        source: "vector_search_guide.md",
        text: "Vector similarity search works by converting text into dense embeddings using a neural encoder. These embeddings capture semantic meaning, enabling nearest-neighbor searches that find passages with similar meaning rather than just lexical overlap.",
        relevance_score: 0.87,
      },
      {
        chunk_index: 2,
        source: "rag_overview.pdf",
        text: "The generation stage of RAG passes retrieved context chunks along with the original query to a large language model. The model is instructed to base its answer on the provided context, citing specific sources where possible.",
        relevance_score: 0.82,
      },
      {
        chunk_index: 3,
        source: "hallucination_detection.txt",
        text: "Grounding verification checks each sentence in the generated answer against the retrieved evidence. Sentences that cannot be supported by any retrieved chunk are flagged as potential hallucinations. This reduces the rate of unsupported claims significantly.",
        relevance_score: 0.71,
      },
      {
        chunk_index: 4,
        source: "evaluation_metrics.md",
        text: "Standard retrieval evaluation metrics include Recall@K (fraction of relevant documents in top K results), Mean Reciprocal Rank (inverse rank of the first relevant result), and NDCG (a graded relevance measure that accounts for position in the ranked list).",
        relevance_score: 0.65,
      },
    ],
    grounding: {
      grounding_score: 0.85,
      total_sentences: 5,
      grounded_sentences: 4,
      ungrounded_claims: [
        "The exact reduction rate of hallucinations compared to purely parametric generation varies by domain and model.",
      ],
    },
    latency: {
      embedding_ms: 42,
      retrieval_ms: 18,
      generation_ms: 1247,
      hallucination_check_ms: 156,
      total_ms: 1463,
    },
  },
};

export async function mockQueryRAG(
  query: string,
  _top_k: number = 5
): Promise<QueryResponse> {
  // Simulate network + processing delay
  await sleep(randomBetween(800, 1800));

  const base = MOCK_ANSWERS.default;

  // Slightly randomize latency values to feel real
  return {
    ...base,
    latency: {
      embedding_ms: Math.round(randomBetween(28, 65)),
      retrieval_ms: Math.round(randomBetween(10, 35)),
      generation_ms: Math.round(randomBetween(900, 1600)),
      hallucination_check_ms: Math.round(randomBetween(100, 250)),
      total_ms: Math.round(randomBetween(1100, 1900)),
    },
  };
}

// ---------------------------------------------------------------------------
// Ingest mock
// ---------------------------------------------------------------------------

const SAMPLE_CHUNKS = [
  "Retrieval-Augmented Generation (RAG) combines information retrieval with text generation to produce more factual outputs.",
  "Vector databases store document embeddings and enable fast approximate nearest-neighbor search for semantic retrieval.",
  "Chunking strategies determine how documents are split into smaller passages. Common approaches include recursive character splitting, sentence-based splitting, and semantic splitting.",
  "Embedding models convert text into dense vector representations that capture semantic meaning, enabling similarity comparisons.",
  "The generation stage passes retrieved chunks as context to an LLM, which synthesizes a grounded answer from the evidence.",
  "Evaluation metrics such as Recall@K and MRR measure how well the retrieval stage surfaces relevant documents.",
  "Hallucination detection compares generated sentences against retrieved evidence to identify unsupported claims.",
  "Production RAG systems require monitoring of latency, throughput, and retrieval quality to maintain performance.",
];

export async function mockIngestDocument(
  file: File,
  chunking_strategy: string = "recursive_character",
  chunk_size: number = 512,
  _chunk_overlap: number = 50
): Promise<IngestResponse> {
  await sleep(randomBetween(600, 1400));

  // Generate a realistic number of chunks based on file size and chunk size
  const estimatedChunks = Math.max(
    3,
    Math.min(SAMPLE_CHUNKS.length, Math.ceil((file.size || 4096) / chunk_size))
  );

  const chunks = SAMPLE_CHUNKS.slice(0, estimatedChunks).map((text, i) => ({
    chunk_index: i,
    text_preview: text,
    char_count: text.length,
  }));

  return {
    document_id: `doc_${crypto.randomUUID().slice(0, 12)}`,
    source: file.name,
    total_chunks: chunks.length,
    chunks,
    embedding_provider: "sentence-transformers (demo)",
    processing_time_ms: Math.round(randomBetween(320, 980)),
  };
}

// ---------------------------------------------------------------------------
// Evaluate mock
// ---------------------------------------------------------------------------

export async function mockEvaluate(
  queries: EvalQuery[],
  top_k: number = 5
): Promise<EvalResponse> {
  await sleep(randomBetween(500, 1200));

  const per_query = queries.map((q) => {
    const recall = +(randomBetween(0.5, 1.0)).toFixed(3);
    const rr = +(randomBetween(0.4, 1.0)).toFixed(3);
    const ndcg = +(randomBetween(0.55, 0.95)).toFixed(3);
    return {
      query: q.query,
      recall_at_k: recall,
      reciprocal_rank: rr,
      ndcg,
    };
  });

  const n = per_query.length || 1;
  const aggregate_recall_at_k = +(per_query.reduce((s, p) => s + p.recall_at_k, 0) / n).toFixed(3);
  const aggregate_mrr = +(per_query.reduce((s, p) => s + p.reciprocal_rank, 0) / n).toFixed(3);
  const aggregate_ndcg = +(per_query.reduce((s, p) => s + p.ndcg, 0) / n).toFixed(3);

  return {
    per_query,
    aggregate_recall_at_k,
    aggregate_mrr,
    aggregate_ndcg,
    total_queries: queries.length,
    top_k,
  };
}

// ---------------------------------------------------------------------------
// Health mock
// ---------------------------------------------------------------------------

export async function mockCheckHealth(): Promise<HealthResponse> {
  await sleep(randomBetween(50, 200));

  return {
    status: "healthy",
    services: {
      api: true,
      weaviate: true,
    },
  };
}
