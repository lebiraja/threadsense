import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  ordinal: string;
  title: string;
  lede: string;
  children: ReactNode;
};

export function Section({ id, ordinal, title, lede, children }: SectionProps) {
  return (
    <section id={id} className="border-t border-rule py-16 sm:py-24">
      <header className="mb-10 grid gap-3 sm:mb-14 sm:grid-cols-[8rem_1fr]">
        <p className="font-mono text-sm text-amber">{ordinal} /</p>
        <div>
          <h2 className="font-mono text-3xl tracking-tight sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-muted">{lede}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
