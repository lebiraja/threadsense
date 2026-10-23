"use client";

import { useEffect, useState } from "react";
import type { z } from "zod";
import { fetchApi } from "./api";

export type ApiState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; data: T };

// GET a contract endpoint once per path. The settled result is keyed by its path, so a
// path change reads as "loading" until its own response lands.
export function useApi<T>(path: string, schema: z.ZodType<T>): ApiState<T> {
  const [settled, setSettled] = useState<{ path: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    let live = true;
    fetchApi(path, schema)
      .then((data) => live && setSettled({ path, state: { status: "ready", data } }))
      .catch((e: unknown) => live && setSettled({ path, state: { status: "error", error: String(e) } }));
    return () => {
      live = false;
    };
  }, [path, schema]);

  return settled?.path === path ? settled.state : { status: "loading" };
}
