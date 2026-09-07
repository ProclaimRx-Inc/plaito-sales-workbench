import { getData } from "@/lib/data"
import { fmtDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

/** "What is the most recent week of data?" — asked in chat dozens of times. Answered once, here, per source. */
export function Freshness() {
  const data = getData()
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {data.freshness.map((f) => (
        <div key={f.table} className="rounded-md border px-3 py-2">
          <div className="truncate text-xs font-medium">{f.source}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">{f.table}</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px]">{f.cadence}</Badge>
            <span className="text-[11px] tabular-nums">{fmtDate(f.asOf)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
