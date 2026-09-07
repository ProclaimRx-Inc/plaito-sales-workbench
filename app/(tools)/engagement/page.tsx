"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { Kpi } from "@/components/kpi"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getData } from "@/lib/data"
import { callEmailLift, callsBeforeFirstRx, eventPrePost, targetCoverage, writerLifecycle } from "@/lib/queries"
import { fmtInt, fmtPct } from "@/lib/format"

export default function EngagementPage() {
  const data = getData()
  const quarters = [...new Set(data.weeks.filter((w) => w.index >= data.launchWeekIndex).map((w) => w.quarter))].reverse()
  const [quarter, setQuarter] = useState(data.latestWeek.quarter)
  const cov = useMemo(() => targetCoverage(quarter), [quarter])
  const cbf = useMemo(() => callsBeforeFirstRx(), [])
  const lift = useMemo(() => callEmailLift(), [])

  const sample = useMemo(() => {
    const w = writerLifecycle().rows.filter((r) => r.firstWeek > data.launchWeekIndex + 6).slice(0, 5)
    return w.map((r) => `${r.npi} ${data.weeks[Math.max(0, r.firstWeek - 3)].end}`).join("\n")
  }, [data])
  const [paste, setPaste] = useState(sample)
  const [entries, setEntries] = useState<{ npi: string; date: string }[]>(() => parse(sample))
  const pp = useMemo(() => eventPrePost(entries), [entries])
  const totals = cov.rows.reduce((a, r) => ({ hcps: a.hcps + r.hcps, called: a.called + r.called }), { hcps: 0, called: 0 })

  return (
    <>
      <PageHeader title="Engagement → Rx" description="Did the field reach the targets, and did the reach turn into scripts" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label={`Targets reached, ${quarter}`} value={fmtPct(cov.rows.filter((r) => r.tier).reduce((a, r) => a + r.called, 0) / Math.max(1, cov.rows.filter((r) => r.tier).reduce((a, r) => a + r.hcps, 0)), 0)} sub="targets with ≥1 call" def={cov.def} />
          <Kpi label="Priority targets never called" value={fmtInt(cov.uncalledPriority.length)} sub={`of ${fmtInt(cov.rows[0].hcps)} Priority (A) targets this quarter`} def={cov.def} />
          <Kpi label="HCPs reached" value={fmtInt(totals.called)} sub={`of ${fmtInt(totals.hcps)} HCPs in territory`} def={cov.def} />
          <Kpi label="Called but never wrote" value={fmtInt(cbf.calledNeverWrote)} sub="HCPs with in-person calls, zero EXXUA ever" def={cbf.def} />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section
            className="lg:col-span-3"
            title="Target coverage by tier"
            description="Calls and writing in the quarter, by the tier active that quarter"
            def={cov.def}
            actions={
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger size="sm" className="w-[120px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{quarters.map((q) => <SelectItem key={q} value={q} className="text-xs">{q}</SelectItem>)}</SelectContent>
              </Select>
            }
          >
            <DataTable
              rows={cov.rows}
              dense
              rowKey={(r) => r.label}
              columns={[
                { key: "tier", header: "Tier", value: (r) => r.label },
                { key: "hcps", header: "HCPs", value: (r) => r.hcps, align: "right" },
                { key: "called", header: "Called", value: (r) => r.called, align: "right" },
                { key: "cov", header: "Coverage", value: (r) => fmtPct(r.hcps ? r.called / r.hcps : 0, 0), align: "right" },
                { key: "avg", header: "Avg calls / reached", value: (r) => r.avgCalls.toFixed(1), align: "right" },
                { key: "wrote", header: "Wrote EXXUA", value: (r) => r.wrote, align: "right" },
                { key: "wc", header: "Wrote · called", value: (r) => r.called ? fmtPct(r.wroteCalled / r.called, 0) : "—", align: "right" },
                { key: "wu", header: "Wrote · not called", value: (r) => r.uncalled ? fmtPct(r.wroteUncalled / r.uncalled, 0) : "—", align: "right" },
              ]}
            />
            <div className="mt-4">
              <div className="mb-1 text-xs font-medium">Priority (A) targets with zero calls in {quarter}</div>
              <DataTable
                rows={cov.uncalledPriority}
                dense
                limit={8}
                filename={`uncalled_priority_targets_${quarter}.csv`}
                rowKey={(r) => r.npi}
                columns={[
                  { key: "name", header: "HCP", value: (r) => r.name },
                  { key: "spec", header: "Specialty", value: (r) => r.specialty },
                  { key: "loc", header: "City, ST", value: (r) => `${r.city}, ${r.state}` },
                  { key: "terr", header: "Territory", value: (r) => r.territory },
                  { key: "rep", header: "Rep", value: (r) => r.rep },
                ]}
              />
            </div>
          </Section>

          <div className="space-y-6 lg:col-span-2">
            <Section title="In-person calls before the first EXXUA Rx" description="Distribution across all writers since launch" def={cbf.def}>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cbf.rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="calls" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} />
                    <Bar isAnimationActive={false} dataKey="writers" name="Writers" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="Writer rate by promotional exposure" description="Call + opened email vs call alone. Descriptive, not causal." def={lift.def}>
              <DataTable
                rows={lift.rows}
                dense
                rowKey={(r) => r.group}
                columns={[
                  { key: "g", header: "Exposure", value: (r) => r.group },
                  { key: "h", header: "HCPs", value: (r) => r.hcps, align: "right" },
                  { key: "w", header: "Writers", value: (r) => r.writers, align: "right" },
                  { key: "r", header: "Rate", value: (r) => fmtPct(r.rate), align: "right", className: "font-semibold" },
                ]}
              />
            </Section>
          </div>
        </div>

        <Section title="Speaker program pre/post" description="Paste NPI and program date per line. Same ±8-week windows every time, no re-explaining the rules." def={pp.def}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={8} className="font-mono text-xs" placeholder={"1234567890 2026-06-17\n…"} />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setEntries(parse(paste))}>Run</Button>
                <span className="text-xs text-muted-foreground">{entries.length} attendees · accepts YYYY-MM-DD or M/D/YY</span>
              </div>
            </div>
            <div className="lg:col-span-2">
              <DataTable
                rows={pp.rows}
                dense
                filename="speaker_program_pre_post.csv"
                rowKey={(r) => `${r.npi}-${r.date}`}
                columns={[
                  { key: "npi", header: "NPI", value: (r) => r.npi, className: "font-mono text-[11px]" },
                  { key: "name", header: "HCP", value: (r) => r.name, render: (r) => <span className={r.found ? "" : "text-rose-600 dark:text-rose-400"}>{r.name}</span> },
                  { key: "date", header: "Program", value: (r) => r.date },
                  { key: "pre", header: "fTRx 8 wk before", value: (r) => (Number.isNaN(r.pre) ? "" : r.pre), align: "right" },
                  { key: "post", header: "fTRx 8 wk after", value: (r) => (Number.isNaN(r.post) ? "" : r.post), align: "right" },
                  { key: "d", header: "Δ", value: (r) => (Number.isNaN(r.delta) ? "" : r.delta), align: "right", render: (r) => Number.isNaN(r.delta) ? "—" : <span className={r.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : r.delta < 0 ? "text-rose-600 dark:text-rose-400" : ""}>{r.delta > 0 ? "+" : ""}{r.delta}</span> },
                  { key: "fc", header: "First call after (days)", value: (r) => (r.firstCallAfterDays === null ? "none" : r.firstCallAfterDays), align: "right" },
                ]}
              />
            </div>
          </div>
        </Section>
      </main>
    </>
  )
}

function parse(text: string): { npi: string; date: string }[] {
  const out: { npi: string; date: string }[] = []
  for (const line of text.split(/\n/)) {
    const m = line.trim().match(/^(\d{10})[\s,;\t]+(\S+)/)
    if (!m) continue
    let date = m[2]
    const us = date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
    if (us) date = `${us[3].length === 2 ? "20" + us[3] : us[3]}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) out.push({ npi: m[1], date })
  }
  return out
}
