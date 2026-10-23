"use client";

import { useEffect, useState } from "react";
import { PipelineSchema, type PipelineStep } from "@/lib/api";
import { fmtInt, fmtSecs, stepLabel } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { ApiNotice } from "./api-notice";
import { Section } from "./section";

export function PipelineSection() {
  const pipeline = useApi("/api/pipeline", PipelineSchema);
  const [open, setOpen] = useState<PipelineStep | null>(null);

  return (
    <Section
      id="pipeline"
      ordinal="01"
      title="Pipeline"
      lede="Every batch step that turned 1,013,000 raw posts into a TF-IDF index, as recorded when it ran. Select a step to read its run record."
    >
      {pipeline.status === "ready" ? (
        <StepFlow steps={pipeline.data} onOpen={setOpen} />
      ) : (
        <ApiNotice state={pipeline} what="pipeline log" />
      )}
      {open && <StepPanel step={open} onClose={() => setOpen(null)} />}
    </Section>
  );
}

function StepFlow({ steps, onOpen }: { steps: PipelineStep[]; onOpen: (s: PipelineStep) => void }) {
  const maxDuration = Math.max(...steps.map((s) => s.duration_s), 1);
  const total = steps.reduce((sum, s) => sum + s.duration_s, 0);

  return (
    <div>
      <div className="hidden grid-cols-[3rem_1fr_9rem_9rem_10rem] gap-4 border-b border-rule pb-2 font-mono text-xs text-faint md:grid">
        <span>#</span>
        <span>step</span>
        <span className="text-right">records in</span>
        <span className="text-right">records out</span>
        <span>duration</span>
      </div>
      <ol className="relative">
        <span aria-hidden className="absolute top-0 bottom-0 left-[0.6rem] w-px bg-rule md:hidden" />
        {steps.map((s) => {
          const { ordinal, name } = stepLabel(s.step);
          return (
            <li key={s.step}>
              <button
                type="button"
                onClick={() => onOpen(s)}
                className="group relative grid w-full grid-cols-[1.5rem_1fr] gap-x-4 gap-y-1 border-b border-rule py-5 pl-0 text-left transition-colors hover:bg-raised focus-visible:bg-raised focus-visible:outline-none md:grid-cols-[3rem_1fr_9rem_9rem_10rem] md:items-center md:gap-4 md:px-0"
              >
                <span className="relative z-10 font-mono text-sm text-amber">
                  <span className="bg-paper group-hover:bg-raised md:bg-transparent">{ordinal}</span>
                </span>
                <span>
                  <span className="font-mono text-lg group-hover:text-amber">{name}</span>
                  <span className="mt-1 block text-sm text-muted">{s.notes}</span>
                </span>
                <span className="col-start-2 font-mono text-sm tabular-nums md:col-start-auto md:text-right">
                  <span className="text-faint md:hidden">in </span>
                  {fmtInt(s.records_in)}
                </span>
                <span className="col-start-2 font-mono text-sm tabular-nums md:col-start-auto md:text-right">
                  <span className="text-faint md:hidden">out </span>
                  {fmtInt(s.records_out)}
                </span>
                <span className="col-start-2 flex items-center gap-3 font-mono text-sm tabular-nums md:col-start-auto">
                  <span className="h-1.5 w-16 bg-rule">
                    <span
                      className="block h-full bg-amber"
                      style={{ width: `${(s.duration_s / maxDuration) * 100}%` }}
                    />
                  </span>
                  {fmtSecs(s.duration_s)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 font-mono text-xs text-muted">
        {steps.length} steps · {fmtSecs(total)} total wall time
      </p>
    </div>
  );
}

function StepPanel({ step, onClose }: { step: PipelineStep; onClose: () => void }) {
  const { ordinal, name } = stepLabel(step.step);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`Log for ${name}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-rule bg-paper">
        <header className="flex items-start justify-between gap-4 border-b border-rule px-6 py-5">
          <div>
            <p className="font-mono text-xs text-amber">step {ordinal}</p>
            <h3 className="mt-1 font-mono text-2xl">{name}</h3>
            <p className="mt-2 text-sm text-muted">{step.notes}</p>
          </div>
          <button type="button" onClick={onClose} className="font-mono text-sm text-muted hover:text-amber">
            [esc]
          </button>
        </header>
        <dl className="grid grid-cols-2 gap-4 border-b border-rule px-6 py-5 font-mono sm:grid-cols-4">
          {(
            [
              ["in", fmtInt(step.records_in)],
              ["out", fmtInt(step.records_out)],
              ["dropped", fmtInt(step.dropped)],
              ["duration", fmtSecs(step.duration_s)],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 text-xl tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="px-6 pt-4 font-mono text-xs text-faint">
          finished {new Date(step.finished).toLocaleString("en-GB", { timeZone: "UTC" })} UTC · stored run record
        </p>
        <pre className="m-6 mt-3 flex-1 overflow-auto border border-rule bg-raised p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-ink/90">
          {step.log || "(no output captured)"}
        </pre>
      </aside>
    </div>
  );
}
