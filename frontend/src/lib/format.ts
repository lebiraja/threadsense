const intFmt = new Intl.NumberFormat("en-US");

export const fmtInt = (n: number): string => intFmt.format(Math.round(n));

export const fmtPct = (fraction: number, digits = 1): string => `${(fraction * 100).toFixed(digits)}%`;

export const fmtSecs = (s: number): string => (s >= 60 ? `${(s / 60).toFixed(1)}m` : `${s.toFixed(2)}s`);

// Step ids are stored as "03_job1_wordcount"; split into the ordinal and a readable name.
export function stepLabel(step: string): { ordinal: string; name: string } {
  const match = /^(\d+)_(.+)$/.exec(step);
  return match ? { ordinal: match[1], name: match[2].replaceAll("_", " ") } : { ordinal: "--", name: step };
}

// Categories get evenly spread, muted hues (golden angle) so 39 of them stay distinguishable
// without competing with the amber accent, which is reserved for selection.
export function categoryColour(category: string, ordered: readonly string[]): string {
  const i = ordered.indexOf(category);
  if (i < 0) return "hsl(30 6% 45%)";
  return `hsl(${Math.round((i * 137.508) % 360)} 32% 58%)`;
}
