"use client"

import { useMemo, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { TierBadge } from "@/components/tier-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getData } from "@/lib/data"
import { cohortRetention, newWriterReport, writerLifecycle, type WriterSegment } from "@/lib/queries"
import { fmtInt, fmtMonth, fmtPct, fmtWeek } from "@/lib/format"
import { cn } from "@/lib/utils"

const SEGMENTS: { key: WriterSegment; tone: string; hint: string }[] = [
  { key: "New", tone: "border-emerald-500/50", hint: "First EXXUA Rx this week" },
  { key: "Repeat", tone: "border-sky-500/50", hint: "Wrote again, not yet every week" },
  { key: "Consistent", tone: "border-violet-500/50", hint: "≥3 of the last 4 weeks" },
  { key: "At risk", tone: "border-amber-500/50", hint: "Nothing in 4–7 weeks" },
  { key: "Lapsed", tone: "border-rose-500/50", hint: "Nothing in 8+ weeks" },
]

export default function WritersPage() {
  const data = getData()
  const weeks = data.weeks.slice(data.launchWeekIndex).slice().reverse()
  const [weekIndex, setWeekIndex] = useState(data.latestWeek.index)
  const [segment, setSegment] = useState<WriterSegment | "All">("All")

  const life = useMemo(() => writerLifecycle(), [])
  const report = useMemo(() => newWriterReport(weekIndex), [weekIndex])
  const cohorts = useMemo(() => cohortRetention(), [])
  const filtered = segment === "All" ? life.rows : life.rows.filter((r) => r.segment === segment)

  return (
    <>
      <PageHeader title="Writer Lifecycle" description="Who started, who kept going, who stopped — with the Monday new-writer report" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SEGMENTS.map((s) => (
            <button key={s.key} onClick={() => setSegment(segment === s.key ? "All" : s.key)} className={cn("rounded-xl border-l-4 border bg-card px-4 py-3 text-left transition hover:bg-accent", s.tone, segment === s.key && "ring-2 ring-ring")}>
              <div className="text-xs font-medium text-muted-foreground">{s.key} writers</div>
              <div className="text-2xl font-semibold tabular-nums">{fmtInt(life.counts[s.key])}</div>
              <div className="text-[11px] text-muted-foreground">{s.hint}</div>
            </button>
          ))}
        </div>

        <Section
          title="New EXXUA prescribers report"
          description="Fixed columns, one row per NPI, exportable. Pick the week."
          def={report.def}
          actions={
            <Select value={String(weekIndex)} onValueChange={(v) => setWeekIndex(Number(v))}>
              <SelectTrigger size="sm" className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {weeks.map((w) => <SelectItem key={w.index} value={String(w.index)} className="text-xs">{fmtWeek(w.end)}{w.holiday ? " ★" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        >
          <DataTable
            rows={report.rows}
            dense
            filename={`exxua_new_writers_${data.weeks[weekIndex].end}.csv`}
            rowKey={(r) => r.npi}
            emptyText="No first-time writers in this week"
            columns={[
              { key: "terr", header: "Terr #", value: (r) => r.territoryCode, className: "font-mono text-[11px]" },
              { key: "tname", header: "Territory", value: (r) => r.territory },
              { key: "region", header: "Region", value: (r) => r.region },
              { key: "npi", header: "NPI", value: (r) => r.npi, className: "font-mono text-[11px]" },
              { key: "name", header: "HCP", value: (r) => r.name },
              { key: "spec", header: "Specialty", value: (r) => r.specialty },
              { key: "tier", header: "Priority", value: (r) => r.tier ?? "Untargeted", render: (r) => <TierBadge tier={r.tier} /> },
              { key: "tunits", header: "tunits", value: (r) => r.tunits, align: "right" },
              { key: "starts", header: "Titration", value: (r) => r.starts, align: "right" },
              { key: "channel", header: "Payer of first scripts", value: (r) => r.channel },
              { key: "calls", header: "In-person calls before", value: (r) => r.callsBeforeFirst, align: "right" },
            ]}
          />
        </Section>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2" title="Do new writers write again?" description="Repeat rate by the month of the first EXXUA Rx" def={cohorts.def}>
            <DataTable
              rows={cohorts.rows}
              dense
              rowKey={(r) => r.month}
              columns={[
                { key: "month", header: "First-write month", value: (r) => fmtMonth(r.month) },
                { key: "n", header: "New writers", value: (r) => r.newWriters, align: "right" },
                { key: "w4", header: "Again ≤4 wk", value: (r) => fmtPct(r.within4), align: "right" },
                { key: "w8", header: "≤8 wk", value: (r) => fmtPct(r.within8), align: "right" },
                { key: "w13", header: "≤13 wk", value: (r) => fmtPct(r.within13), align: "right" },
              ]}
            />
          </Section>
          <Section
            className="lg:col-span-3"
            title={segment === "All" ? "All EXXUA writers" : `${segment} writers`}
            description="Click a segment tile above to filter. Sorted by fTRx in the last 13 weeks."
            def={life.def}
            actions={segment !== "All" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSegment("All")}>Clear</Button>}
          >
            <DataTable
              rows={[...filtered].sort((a, b) => b.last13 - a.last13)}
              dense
              limit={25}
              filename={`exxua_writers_${segment.toLowerCase().replace(" ", "_")}.csv`}
              rowKey={(r) => r.npi}
              columns={[
                { key: "name", header: "HCP", value: (r) => r.name },
                { key: "spec", header: "Specialty", value: (r) => r.specialty },
                { key: "tier", header: "Priority", value: (r) => r.tier ?? "Untargeted", render: (r) => <TierBadge tier={r.tier} /> },
                { key: "terr", header: "Territory", value: (r) => r.territory },
                { key: "seg", header: "Segment", value: (r) => r.segment, render: (r) => <Badge variant="outline" className="text-[10px]">{r.segment}</Badge> },
                { key: "first", header: "First Rx", value: (r) => fmtWeek(r.firstWeekEnd) },
                { key: "since", header: "Wks since last", value: (r) => r.weeksSinceLast, align: "right" },
                { key: "l13", header: "fTRx 13 wk", value: (r) => r.last13, align: "right" },
                { key: "tot", header: "fTRx launch-to-date", value: (r) => r.sinceLaunch, align: "right" },
              ]}
            />
          </Section>
        </div>
      </main>
    </>
  )
}
