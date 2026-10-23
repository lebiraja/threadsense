import { z } from "zod";

// Schemas mirror docs/API.md, the contract with the FastAPI service.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const OverviewSchema = z.object({
  posts_raw: z.number(),
  posts_clean: z.number(),
  train: z.number(),
  test: z.number(),
  subreddits: z.number(),
  indexed_words: z.number(),
  word_subreddit_counts: z.number(),
});

export const PipelineStepSchema = z.object({
  step: z.string(),
  finished: z.string(),
  duration_s: z.number(),
  records_in: z.number(),
  records_out: z.number(),
  dropped: z.number(),
  notes: z.string(),
  log: z.string(),
});
export const PipelineSchema = z.array(PipelineStepSchema);

export const TimingRowSchema = z.object({
  method: z.string(),
  indexed: z.boolean(),
  seconds: z.number(),
  input_posts: z.number(),
  output_docs: z.number(),
});

export const ResultsSchema = z.object({
  eval: z.object({
    n_test: z.number(),
    k: z.number(),
    top1_accuracy: z.number(),
    hit_rate_at_5: z.number(),
    baseline_top1: z.number(),
    baseline_hit_rate_at_5: z.number(),
  }),
  timing: z.array(TimingRowSchema),
});

export const CategoriesSchema = z.array(
  z.object({ category: z.string(), subreddits: z.number(), posts: z.number() }),
);

const WeightedWordSchema = z.object({ word: z.string(), weight: z.number() });

export const SubredditDetailSchema = z.object({
  name: z.string(),
  category: z.string(),
  posts: z.number(),
  neighbours: z.array(z.object({ subreddit: z.string(), sim: z.number() })),
  top_words: z.array(WeightedWordSchema),
});

export const GraphSchema = z.object({
  nodes: z.array(z.object({ id: z.string(), category: z.string(), posts: z.number() })),
  edges: z.array(z.object({ source: z.string(), target: z.string(), sim: z.number() })),
});

export const ExamplesSchema = z.array(
  z.object({ text: z.string(), true_subreddit: z.string(), preview: z.string() }),
);

export const RecommendSchema = z.object({
  recommendations: z.array(
    z.object({
      subreddit: z.string(),
      category: z.string(),
      score: z.number(),
      matched_words: z.array(WeightedWordSchema),
    }),
  ),
  n_known_words: z.number(),
});

export type Overview = z.infer<typeof OverviewSchema>;
export type PipelineStep = z.infer<typeof PipelineStepSchema>;
export type Results = z.infer<typeof ResultsSchema>;
export type TimingRow = z.infer<typeof TimingRowSchema>;
export type Categories = z.infer<typeof CategoriesSchema>;
export type SubredditDetail = z.infer<typeof SubredditDetailSchema>;
export type Graph = z.infer<typeof GraphSchema>;
export type Examples = z.infer<typeof ExamplesSchema>;
export type Recommend = z.infer<typeof RecommendSchema>;

export async function fetchApi<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} -> HTTP ${res.status}`);
  return schema.parse(await res.json());
}
