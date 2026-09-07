"use client"

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"
import { PageHeader } from "@/components/page-header"
import { Kpi } from "@/components/kpi"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { Freshness } from "@/components/freshness"
import { Badge } from "@/components/ui/badge"
import { headline, weeklyTrend, wowBridge } from "@/lib/queries"
import { fmtDelta, fmtInt, fmtWeek, fmtDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function PulsePage() {
  const h = headline()
  const trend = weeklyTrend()
  const bridge = wowBridge()
  const bridgeTotal = bridge.buckets.reduce((a, b) => a + b.delta, 0)

  return (
    <>
      <PageHeader title="Launch Pulse" description={`EXXUA national view · Rx data through ${fmtDate(h.last.week)}`} />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi label="fTRx, latest week" value={fmtInt(h.last.exxTrx)} delta={h.wowPct} sub={`${fmtDelta(h.wow)} vs ${fmtWeek(h.prev.week)}`} def={trend.def} />
          <Kpi label="4-week average" value={fmtInt(h.avg4)} delta={h.avg4Growth} sub="vs the prior 4 weeks" def={trend.def} />
          <Kpi label="fTRx since launch" value={fmtInt(h.sinceLaunch)} sub={`${fmtInt(h.sinceLaunchNrx)} NRx`} def={trend.def} />
          <Kpi label="Writers ever" value={fmtInt(h.writersEver)} sub={`${fmtInt(h.active4)} wrote in the last 4 weeks`} def={trend.def} />
          <Kpi label="New writers this week" value={fmtInt(h.last.newWriters)} sub={`${fmtInt(h.last.writers)} writers this week`} def={trend.def} />
          <Kpi label="Best week" value={fmtInt(h.best.exxTrx)} sub={fmtWeek(h.best.week)} def={trend.def} />
        </div>

        <Section title="Weekly fTRx since launch" description="Titration (starts) vs continuing, with distinct writers" def={trend.def}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend.rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 11 }} interval={3} />
                <YAxis yAxisId="l" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} labelFormatter={(v) => fmtWeek(String(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar isAnimationActive={false} yAxisId="l" dataKey="starts" name="Titration fTRx" stackId="a" fill="var(--chart-2)" />
                <Bar isAnimationActive={false} yAxisId="l" dataKey="cont" name="Continuing fTRx" stackId="a" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                <Line isAnimationActive={false} yAxisId="r" type="monotone" dataKey="writers" name="Writers" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2" title="Why did fTRx move this week?" description={`${fmtWeek(h.prev.week)} → ${fmtWeek(h.last.week)}: ${fmtDelta(bridgeTotal)}`} def={bridge.def}>
            <div className="space-y-2">
              {bridge.buckets.map((b) => {
                const max = Math.max(...bridge.buckets.map((x) => Math.abs(x.delta)), 1)
                return (
                  <div key={b.bucket} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{b.bucket} <span className="text-muted-foreground">· {b.hcps} HCPs</span></span>
                      <span className={cn("tabular-nums font-semibold", b.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : b.delta < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>{fmtDelta(b.delta)}</span>
                    </div>
                    <div className="relative h-2 rounded bg-muted">
                      <div className={cn("absolute top-0 h-2 rounded", b.delta >= 0 ? "bg-emerald-500 left-1/2" : "bg-rose-500 right-1/2")} style={{ width: `${(Math.abs(b.delta) / max) * 50}%` }} />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{b.description}</div>
                  </div>
                )
              })}
              <div className="pt-2 text-[11px] text-muted-foreground">Buckets sum to the national change ({fmtDelta(bridgeTotal)} = {fmtDelta(h.wow)}). Same decomposition every week.</div>
            </div>
          </Section>

          <Section className="lg:col-span-3" title="Biggest HCP movers this week" description="Absolute change in tunits_exx, all HCPs" def={bridge.def}>
            <DataTable
              rows={bridge.movers}
              limit={12}
              dense
              filename={`exxua_movers_${h.last.week}.csv`}
              rowKey={(r) => r.npi}
              columns={[
                { key: "name", header: "HCP", value: (r) => r.name },
                { key: "npi", header: "NPI", value: (r) => r.npi, className: "font-mono text-[11px]" },
                { key: "territory", header: "Territory", value: (r) => r.territory },
                { key: "bucket", header: "Bucket", value: (r) => r.bucket, render: (r) => <Badge variant="secondary" className="text-[10px]">{r.bucket}</Badge> },
                { key: "prev", header: "Prior wk", value: (r) => r.prev, align: "right" },
                { key: "cur", header: "This wk", value: (r) => r.cur, align: "right" },
                { key: "delta", header: "Δ", value: (r) => r.delta, align: "right", render: (r) => <span className={r.delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{fmtDelta(r.delta)}</span> },
              ]}
            />
          </Section>
        </div>

        <Section title="Data freshness" description="The 'what is the most recent week of data' question, answered per source">
          <Freshness />
        </Section>
      </div>
    </>
  )
}
