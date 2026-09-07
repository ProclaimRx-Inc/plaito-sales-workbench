"use client"

import { useState } from "react"
import { Info, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { definitionToPrompt, type Definition } from "@/lib/definition"

/**
 * The "how is this number computed" drawer. Every tile and table gets one.
 * It also produces a paste-ready PLAiTO prompt so the chat agent starts from
 * the same definition instead of guessing.
 */
export function DefinitionDrawer({ def, compact }: { def: Definition; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(definitionToPrompt(def))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <Sheet>
      <SheetTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="How is this computed?">
            <Info className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Info className="h-4 w-4" /> Definition
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[420px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{def.title}</SheetTitle>
          <SheetDescription>Same inputs, same answer, every time.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6 text-sm">
          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source tables</h4>
            <div className="flex flex-wrap gap-1.5">
              {def.sources.map((s) => (
                <Badge key={s} variant="secondary" className="font-mono text-[11px]">{s}</Badge>
              ))}
            </div>
          </section>
          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Window</h4>
            <p>{def.window}</p>
          </section>
          {def.filters.length > 0 && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</h4>
              <ul className="list-disc space-y-1 pl-5">
                {def.filters.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </section>
          )}
          <section>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Formula</h4>
            <p className="whitespace-normal break-words rounded-md bg-muted p-3 font-mono text-[12px] leading-relaxed">{def.formula}</p>
          </section>
          {def.notes && (
            <section>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</h4>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {def.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </section>
          )}
          <section className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Take it further in PLAiTO chat</h4>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy prompt"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{definitionToPrompt(def)}</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
