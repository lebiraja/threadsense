import { InsightsSection } from "@/components/insights-section";
import { Masthead } from "@/components/masthead";
import { PipelineSection } from "@/components/pipeline-section";
import { ResultsSection } from "@/components/results-section";
import { TrySection } from "@/components/try-section";

export default function Home() {
  return (
    <>
      <Masthead />
      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <PipelineSection />
        <InsightsSection />
        <TrySection />
        <ResultsSection />
      </main>
      <footer className="mx-auto max-w-6xl border-t border-rule px-5 py-10 font-mono text-xs text-faint sm:px-8">
        ThreadSense · 1,013,000 Reddit self-posts (Kaggle, reddit-selfposts) · MongoDB 7 mapReduce · all figures read
        from stored pipeline output
      </footer>
    </>
  );
}
