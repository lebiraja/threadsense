"use client";

import { useState, type FormEvent } from "react";
import { ExamplesSchema, RecommendSchema, fetchApi, type Recommend } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { ApiNotice } from "./api-notice";
import { Section } from "./section";

type Run =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; data: Recommend; expected: string | null };

export function TrySection() {
  const examples = useApi("/api/examples", ExamplesSchema);
  const [text, setText] = useState("");
  const [run, setRun] = useState<Run>({ status: "idle" });

  async function recommend(input: string, expected: string | null) {
    setRun({ status: "loading" });
    try {
      const data = await fetchApi("/api/recommend", RecommendSchema, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      setRun({ status: "ready", data, expected });
    } catch (e: unknown) {
      setRun({ status: "error", error: String(e) });
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void recommend(text, null);
  }

  return (
    <Section
      id="try"
      ordinal="03"
      title="Try it"
      lede="Paste any Reddit-style post. ThreadSense scores it against every community's TF-IDF profile and returns the five where it fits best."
    >
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <form onSubmit={onSubmit}>
            <label htmlFor="post" className="font-mono text-xs text-muted">
              paste a post
            </label>
            <textarea
              id="post"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              placeholder="My sourdough starter smells like nail polish remover after three days, is it ruined?"
              className="mt-2 block w-full resize-y border border-rule bg-raised p-4 font-mono text-sm leading-relaxed text-ink placeholder:text-faint focus:border-amber focus:outline-none"
            />
            <button
              type="submit"
              disabled={text.trim() === "" || run.status === "loading"}
              className="mt-4 bg-amber px-5 py-2.5 font-mono text-sm text-paper transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {run.status === "loading" ? "scoring..." : "recommend communities ->"}
            </button>
          </form>

          <h3 className="mt-12 border-b border-rule pb-2 font-mono text-xs text-muted">
            or try a held-out post the model never trained on
          </h3>
          {examples.status === "ready" ? (
            <ul>
              {examples.data.map((ex) => (
                <li key={ex.text}>
                  <button
                    type="button"
                    onClick={() => {
                      setText(ex.text);
                      void recommend(ex.text, ex.true_subreddit);
                    }}
                    className="group grid w-full grid-cols-[1fr_auto] gap-4 border-b border-rule py-3 text-left"
                  >
                    <span className="line-clamp-2 text-sm text-ink/80 group-hover:text-ink">{ex.preview}</span>
                    <span className="font-mono text-xs text-faint group-hover:text-amber">r/{ex.true_subreddit}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="pt-3">
              <ApiNotice state={examples} what="examples" />
            </div>
          )}
        </div>

        <div aria-live="polite">
          <RunOutput run={run} />
        </div>
      </div>

      <p className="mt-14 max-w-3xl border-t border-rule pt-4 text-xs leading-relaxed text-faint">
        <span className="text-amber">*</span> Results come from precomputed TF-IDF weights built offline by the
        MapReduce jobs (word counts, then TF-IDF per subreddit). This page does not run MapReduce live: the API only
        scores your text against the stored index.
      </p>
    </Section>
  );
}

function RunOutput({ run }: { run: Run }) {
  if (run.status === "idle") {
    return <p className="font-mono text-sm text-faint">Top five communities will appear here.</p>;
  }
  if (run.status === "loading") return <p className="cursor font-mono text-sm text-muted">scoring </p>;
  if (run.status === "error") {
    return <ApiNotice state={{ status: "error", error: run.error }} what="recommendations" />;
  }

  const { recommendations, n_known_words } = run.data;
  if (recommendations.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        None of these words are in the index, so there is nothing to score. Try a longer post.
      </p>
    );
  }
  const top = Math.max(recommendations[0].score, Number.EPSILON);
  const hitRank = run.expected === null ? -1 : recommendations.findIndex((r) => r.subreddit === run.expected);

  return (
    <div>
      <p className="mb-4 font-mono text-xs text-muted">
        {n_known_words} of your words are in the index
        {run.expected !== null && (
          <>
            {" · "}actual: r/{run.expected}{" "}
            <span className={hitRank >= 0 ? "text-amber" : "text-ink"}>
              {hitRank >= 0 ? `found at rank ${hitRank + 1}` : "not in top 5"}
            </span>
          </>
        )}
      </p>
      <ol className="border-t border-rule">
        {recommendations.map((r, i) => {
          const wordMax = Math.max(...r.matched_words.map((w) => w.weight), Number.EPSILON);
          return (
            <li key={r.subreddit} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-rule py-5">
              <span className={`font-mono text-3xl leading-none ${i === 0 ? "text-amber" : "text-faint"}`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`truncate font-mono text-lg ${r.subreddit === run.expected ? "text-amber" : ""}`}>
                    r/{r.subreddit}
                  </span>
                  <span className="font-mono text-sm tabular-nums">{r.score.toFixed(3)}</span>
                </div>
                <p className="font-mono text-xs text-muted">{r.category}</p>
                <span className="mt-2 block h-1.5 bg-rule">
                  <span className="block h-full bg-amber" style={{ width: `${(r.score / top) * 100}%` }} />
                </span>
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="matched words">
                  {r.matched_words.map((w) => (
                    <li
                      key={w.word}
                      title={`weight ${w.weight.toFixed(4)}`}
                      className="border px-1.5 py-0.5 font-mono text-xs"
                      style={{
                        borderColor: `color-mix(in oklab, var(--color-amber) ${Math.round(20 + 80 * (w.weight / wordMax))}%, var(--color-rule))`,
                      }}
                    >
                      {w.word}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
