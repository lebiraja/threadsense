"use client";

import { ResultsSchema, type Results, type TimingRow } from "@/lib/api";
import { fmtInt, fmtPct, fmtSecs } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { ApiNotice } from "./api-notice";
import { Section } from "./section";

export function ResultsSection() {
  const results = useApi("/api/results", ResultsSchema);

  return (
    <Section
      id="results"
      ordinal="04"
      title="Results"
      lede="Held-out evaluation against a most-popular-subreddit baseline, and the cost of mapReduce against MongoDB's aggregation pipeline on the same job."
    >
      {results.status === "ready" ? (
        <>
          <Evaluation ev={results.data.eval} />
          <Timing rows={results.data.timing} />
        </>
      ) : (
        <ApiNotice state={results} what="results" />
      )}
    </Section>
  );
}

function Evaluation({ ev }: { ev: Results["eval"] }) {
  const metrics = [
    { label: "top-1 accuracy", model: ev.top1_accuracy, baseline: ev.baseline_top1 },
    { label: `hit rate @ ${ev.k}`, model: ev.hit_rate_at_5, baseline: ev.baseline_hit_rate_at_5 },
  ];

  return (
    <div>
      <div className="grid gap-12 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-rule">
        {metrics.map((m) => (
          <div key={m.label} className="sm:px-8 sm:first:pl-0">
            <p className="font-mono text-xs text-muted">{m.label}</p>
            <p className="mt-3 font-mono text-7xl leading-none tracking-tighter text-amber tabular-nums sm:text-8xl">
              {fmtPct(m.model)}
            </p>
            <p className="mt-4 font-mono text-sm text-muted">
              baseline <span className="text-ink tabular-nums">{fmtPct(m.baseline)}</span>
              {m.baseline > 0 && (
                <>
                  {" · "}
                  <span className="text-ink">{(m.model / m.baseline).toFixed(1)}x</span> better
                </>
              )}
            </p>
            <div className="mt-5 grid gap-1.5" aria-hidden>
              <span className="h-2 bg-amber" style={{ width: `${m.model * 100}%` }} />
              <span className="h-2 bg-faint" style={{ width: `${m.baseline * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 font-mono text-xs text-faint">
        {fmtInt(ev.n_test)} held-out test posts · baseline always predicts the {ev.k} largest subreddits in the
        training split
      </p>
    </div>
  );
}

function Timing({ rows }: { rows: TimingRow[] }) {
  const max = Math.max(...rows.map((r) => r.seconds), Number.EPSILON);
  const fastest = Math.min(...rows.map((r) => r.seconds));

  return (
    <div className="mt-24">
      <h3 className="font-mono text-sm text-muted">mapReduce vs aggregation pipeline · word counts per subreddit</h3>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs text-faint">
              <th className="py-2 font-normal">method</th>
              <th className="py-2 font-normal">index on subreddit</th>
              <th className="w-2/5 py-2 font-normal">time</th>
              <th className="py-2 text-right font-normal">input posts</th>
              <th className="py-2 text-right font-normal">output docs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.method}-${r.indexed}`} className="border-b border-rule">
                <td className="py-4">{r.method}</td>
                <td className="py-4 text-muted">{r.indexed ? "yes" : "no"}</td>
                <td className="py-4 pr-6">
                  <span className="flex items-center gap-3">
                    <span className="h-2 flex-1 bg-rule">
                      <span
                        className={`block h-full ${r.seconds === fastest ? "bg-amber" : "bg-muted"}`}
                        style={{ width: `${(r.seconds / max) * 100}%` }}
                      />
                    </span>
                    <span className={`w-16 text-right tabular-nums ${r.seconds === fastest ? "text-amber" : ""}`}>
                      {fmtSecs(r.seconds)}
                    </span>
                  </span>
                </td>
                <td className="py-4 text-right tabular-nums">{fmtInt(r.input_posts)}</td>
                <td className="py-4 text-right tabular-nums">{fmtInt(r.output_docs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
