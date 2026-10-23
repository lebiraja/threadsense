import { API_URL } from "@/lib/api";
import type { ApiState } from "@/lib/use-api";

// Terminal-style line for the loading/error states of a section's data; nothing once ready.
export function ApiNotice<T>({ state, what }: { state: ApiState<T>; what: string }) {
  if (state.status === "ready") return null;
  if (state.status === "loading") {
    return <p className="cursor font-mono text-sm text-muted">loading {what} </p>;
  }
  return (
    <p role="alert" className="font-mono text-sm text-muted">
      <span className="text-amber">ERR</span> could not load {what} from {API_URL}
      <span className="mt-1 block text-faint">{state.error}</span>
    </p>
  );
}
