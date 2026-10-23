"use client";

import { OverviewSchema } from "@/lib/api";
import { fmtInt } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { ApiNotice } from "./api-notice";

const NAV = [
  { href: "#pipeline", ordinal: "01", label: "pipeline" },
  { href: "#insights", ordinal: "02", label: "insights" },
  { href: "#try", ordinal: "03", label: "try it" },
  { href: "#results", ordinal: "04", label: "results" },
];

export function Masthead() {
  const overview = useApi("/api/overview", OverviewSchema);

  return (
    <>
      <nav className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-5 py-3 font-mono text-xs sm:px-8">
          <a href="#top" className="shrink-0 text-amber">
            threadsense
          </a>
          <ul className="flex gap-5">
            {NAV.map((n) => (
              <li key={n.href} className="shrink-0">
                <a href={n.href} className="text-muted transition-colors hover:text-ink">
                  <span className="text-faint">{n.ordinal}</span> {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <header id="top" className="mx-auto max-w-6xl px-5 pt-16 pb-14 sm:px-8 sm:pt-28 sm:pb-20">
        <p className="font-mono text-xs tracking-widest text-muted uppercase">
          IA3 / Big Data / MongoDB + MapReduce
        </p>
        <h1 className="mt-6 font-mono text-5xl leading-none tracking-tighter sm:text-8xl">
          Thread<span className="text-amber">Sense</span>
        </h1>
        <p className="mt-6 max-w-2xl text-xl text-ink/80 sm:text-2xl">
          Discovering which Reddit communities you belong in.
        </p>

        <div className="mt-12 border-t border-rule pt-6">
          {overview.status === "ready" ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 font-mono sm:grid-cols-4">
              {(
                [
                  ["raw posts", overview.data.posts_raw],
                  ["after cleaning", overview.data.posts_clean],
                  ["subreddits", overview.data.subreddits],
                  ["indexed words", overview.data.indexed_words],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-1 text-2xl tabular-nums sm:text-3xl">{fmtInt(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <ApiNotice state={overview} what="overview" />
          )}
        </div>
      </header>
    </>
  );
}
