"use client";

import { useMemo, useState } from "react";
import { CategoriesSchema, GraphSchema, SubredditDetailSchema, type Categories } from "@/lib/api";
import { categoryColour, fmtInt } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { ApiNotice } from "./api-notice";
import { NetworkGraph } from "./network-graph";
import { Section } from "./section";

const COLLAPSED_ROWS = 12;

export function InsightsSection() {
  const categories = useApi("/api/categories", CategoriesSchema);
  const graph = useApi("/api/graph?limit=150", GraphSchema);
  const [selected, setSelected] = useState<string | null>(null);
  const categoryOrder = useMemo(
    () => (categories.status === "ready" ? categories.data.map((c) => c.category) : []),
    [categories],
  );

  return (
    <Section
      id="insights"
      ordinal="02"
      title="Insights"
      lede="What the corpus is made of, and how communities relate. Similarity is the cosine between subreddits' TF-IDF vectors (job 3)."
    >
      <h3 className="mb-6 font-mono text-sm text-muted">posts and subreddits per category</h3>
      {categories.status === "ready" ? (
        <CategoryBars rows={categories.data} order={categoryOrder} />
      ) : (
        <ApiNotice state={categories} what="categories" />
      )}

      <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <h3 className="mb-4 font-mono text-sm text-muted">
            community network · top 150 subreddits by posts · select a node
          </h3>
          <div className="border-y border-rule">
            {graph.status === "ready" ? (
              <NetworkGraph
                graph={graph.data}
                categoryOrder={categoryOrder}
                selected={selected}
                onSelect={setSelected}
              />
            ) : (
              <div className="py-10">
                <ApiNotice state={graph} what="graph" />
              </div>
            )}
          </div>
        </div>
        {selected === null ? (
          <p className="font-mono text-sm text-faint lg:pt-10">
            No community selected. Click a node to see its nearest neighbours and the words that define it.
          </p>
        ) : (
          <SubredditDetail name={selected} order={categoryOrder} onSelect={setSelected} />
        )}
      </div>
    </Section>
  );
}

function CategoryBars({ rows, order }: { rows: Categories; order: readonly string[] }) {
  const [expanded, setExpanded] = useState(false);
  const maxPosts = Math.max(...rows.map((r) => r.posts), 1);
  const maxSubs = Math.max(...rows.map((r) => r.subreddits), 1);
  const shown = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  return (
    <div>
      <div className="mb-3 flex gap-6 font-mono text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-2 w-4 bg-amber" /> posts
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-4 bg-muted" /> subreddits
        </span>
      </div>
      <ul className="border-t border-rule">
        {shown.map((r) => (
          <li
            key={r.category}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-b border-rule py-3 sm:grid-cols-[12rem_1fr_6rem] sm:items-center"
          >
            <span className="flex items-center gap-2 font-mono text-sm">
              <span className="size-2 shrink-0 rounded-full" style={{ background: categoryColour(r.category, order) }} />
              {r.category}
            </span>
            <span className="col-span-2 row-start-2 grid gap-1 sm:col-span-1 sm:row-start-auto">
              <span className="h-2 bg-amber" style={{ width: `${(r.posts / maxPosts) * 100}%` }} />
              <span className="h-1 bg-muted" style={{ width: `${(r.subreddits / maxSubs) * 100}%` }} />
            </span>
            <span className="text-right font-mono text-xs tabular-nums">
              {fmtInt(r.posts)}
              <span className="block text-muted">{r.subreddits} subs</span>
            </span>
          </li>
        ))}
      </ul>
      {rows.length > COLLAPSED_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 font-mono text-xs text-amber hover:underline"
        >
          {expanded ? "show fewer" : `show all ${rows.length} categories`}
        </button>
      )}
    </div>
  );
}

type SubredditDetailProps = { name: string; order: readonly string[]; onSelect: (name: string) => void };

function SubredditDetail({ name, order, onSelect }: SubredditDetailProps) {
  const detail = useApi(`/api/subreddits/${encodeURIComponent(name)}`, SubredditDetailSchema);

  if (detail.status !== "ready") return <ApiNotice state={detail} what={`r/${name}`} />;
  const d = detail.data;
  const maxWeight = Math.max(...d.top_words.map((w) => w.weight), Number.EPSILON);

  return (
    <aside className="font-mono">
      <p className="flex items-center gap-2 text-xs text-muted">
        <span className="size-2 rounded-full" style={{ background: categoryColour(d.category, order) }} />
        {d.category}
      </p>
      <h4 className="mt-2 text-2xl break-all text-amber">r/{d.name}</h4>
      <p className="mt-1 text-sm text-muted">{fmtInt(d.posts)} posts</p>

      <h5 className="mt-8 border-b border-rule pb-2 text-xs text-muted">nearest communities · cosine</h5>
      <ol>
        {d.neighbours.map((n) => (
          <li key={n.subreddit}>
            <button
              type="button"
              onClick={() => onSelect(n.subreddit)}
              className="flex w-full justify-between gap-3 border-b border-rule py-2 text-left text-sm hover:text-amber"
            >
              <span className="truncate">r/{n.subreddit}</span>
              <span className="tabular-nums text-muted">{n.sim.toFixed(3)}</span>
            </button>
          </li>
        ))}
      </ol>

      <h5 className="mt-8 border-b border-rule pb-2 text-xs text-muted">top words · tf-idf</h5>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {d.top_words.map((w) => (
          <li
            key={w.word}
            style={{ fontSize: `${0.75 + 0.6 * (w.weight / maxWeight)}rem`, opacity: 0.45 + 0.55 * (w.weight / maxWeight) }}
          >
            {w.word}
          </li>
        ))}
      </ul>
    </aside>
  );
}
