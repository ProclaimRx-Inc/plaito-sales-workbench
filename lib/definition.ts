/**
 * Every number on every page carries one of these. It is what the chat users
 * kept asking for after the fact — "which table did you use", "what date
 * range", "is that net of reversals" — surfaced up front and identical on
 * every run.
 */
export type Definition = {
  title: string
  /** Source tables, named the way the warehouse names them. */
  sources: string[]
  window: string
  filters: string[]
  formula: string
  notes?: string[]
}

/** Text a user can paste into PLAiTO chat to reproduce/extend the same number. */
export function definitionToPrompt(d: Definition): string {
  return [
    `Using ${d.sources.join(", ")}, compute "${d.title}".`,
    `Window: ${d.window}.`,
    d.filters.length ? `Filters: ${d.filters.join("; ")}.` : "",
    `Definition: ${d.formula}.`,
    `Return a table and state the exact source table and date range used.`,
  ]
    .filter(Boolean)
    .join(" ")
}
