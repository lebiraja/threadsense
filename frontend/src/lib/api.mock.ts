import type { Categories, Examples, Graph, Overview, PipelineStep, Recommend, Results, SubredditDetail } from "./api";

// Contract-shaped fixtures so `tsc` catches drift between docs/API.md and the schemas.
// Not imported by the UI: every number on the page comes from the API.

export const mockOverview = {
  posts_raw: 1013000,
  posts_clean: 1009412,
  train: 908471,
  test: 100941,
  subreddits: 1013,
  indexed_words: 214388,
  word_subreddit_counts: 9312774,
} satisfies Overview;

export const mockPipeline = [
  {
    step: "01_clean",
    finished: "2026-10-23T08:14:02Z",
    duration_s: 412.6,
    records_in: 1013000,
    records_out: 1009412,
    dropped: 3588,
    notes: "lowercase, strip markup, drop empty and duplicate posts",
    log: "cleaned 1009412 posts\n",
  },
] satisfies PipelineStep[];

export const mockResults = {
  eval: {
    n_test: 5000,
    k: 5,
    top1_accuracy: 0.41,
    hit_rate_at_5: 0.63,
    baseline_top1: 0.001,
    baseline_hit_rate_at_5: 0.005,
  },
  timing: [
    { method: "mapReduce", indexed: true, seconds: 48.2, input_posts: 44812, output_docs: 912004 },
    { method: "aggregation", indexed: true, seconds: 9.7, input_posts: 44812, output_docs: 912004 },
  ],
} satisfies Results;

export const mockCategories = [{ category: "video_game", subreddits: 100, posts: 100000 }] satisfies Categories;

export const mockSubreddit = {
  name: "Sourdough",
  category: "food/drink",
  posts: 1000,
  neighbours: [{ subreddit: "Breadit", sim: 0.71 }],
  top_words: [{ word: "starter", weight: 0.42 }],
} satisfies SubredditDetail;

export const mockGraph = {
  nodes: [
    { id: "Sourdough", category: "food/drink", posts: 1000 },
    { id: "Breadit", category: "food/drink", posts: 1000 },
  ],
  edges: [{ source: "Sourdough", target: "Breadit", sim: 0.71 }],
} satisfies Graph;

export const mockExamples = [
  { text: "my starter smells like acetone", true_subreddit: "Sourdough", preview: "my starter smells..." },
] satisfies Examples;

export const mockRecommend = {
  recommendations: [
    { subreddit: "Sourdough", category: "food/drink", score: 0.38, matched_words: [{ word: "starter", weight: 0.42 }] },
  ],
  n_known_words: 4,
} satisfies Recommend;
