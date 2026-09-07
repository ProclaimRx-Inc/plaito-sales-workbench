import { generate } from "./generate"
import type { Dataset } from "./model"

let cached: Dataset | null = null

/** The one dataset every page reads. Built once per process/tab. */
export function getData(): Dataset {
  if (!cached) cached = generate()
  return cached
}

export * from "./model"
