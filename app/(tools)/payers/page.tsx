"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { Kpi } from "@/components/kpi"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { channelSplit, copaySummary, medicaidPlanPivot, WINDOW_LABEL, type WindowKey } from "@/lib/queries"
import { fmtInt, fmtPct, fmtUsd, fmtWeek } from "@/lib/format"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export default function PayersPage() {
  const [win, setWin] = useState<WindowKey>("latestMonth")
  const split = useMemo(() => channelSplit(win), [win])
  const pivot = useMemo(() => medicaidPlanPivot(12), [])
  const copay = useMemo(() => copaySummary(), [])

  return (
    <>
      <PageHeader title="Payers & Copay" description="Channel mix with starts vs continuing, the Medicaid plan × week pivot, and the copay program" />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <Section
          title="EXXUA fTRx by payer channel"
          description="The four windows the chat users asked about, side by side with one definition"
          def={split.def}
          actions={
            <Tabs value={win} onValueChange={(v) => setWin(v as WindowKey)}>
              <TabsList className="h-8">{(Object.keys(WINDOW_LABEL) as WindowKey[]).map((k) => <TabsTrigger key={k} value={k} className="text-xs">{WINDOW_LABEL[k]}</TabsTrigger>)}</TabsList>
            </Tabs>
          }
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={split.rows.filter((r) => r.trx > 0)} dataKey="trx" nameKey="channel" innerRadius={50} outerRadius={85} paddingAngle={2} stroke="var(--background)">
                    {split.rows.filter((r) => r.trx > 0).map((r, i) => <Cell key={r.channel} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} formatter={(v: number, n: string) => [`${fmtInt(v)} (${fmtPct(v / split.total)})`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="lg:col-span-2">
              <DataTable
                rows={split.rows}
                dense
                filename={`exxua_channel_split_${win}.csv`}
                rowKey={(r) => r.channel}
                columns={[
                  { key: "c", header: "Channel", value: (r) => r.channel, render: (r) => <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[split.rows.indexOf(r) % COLORS.length] }} />{r.channel}</span> },
                  { key: "trx", header: "fTRx", value: (r) => r.trx, align: "right", className: "font-semibold" },
                  { key: "share", header: "Share", value: (r) => fmtPct(r.share), align: "right" },
                  { key: "nrx", header: "NRx", value: (r) => r.nrx, align: "right" },
                  { key: "starts", header: "Starts (titration)", value: (r) => r.starts, align: "right" },
                  { key: "cont", header: "Continuing", value: (r) => r.cont, align: "right" },
                  { key: "ratio", header: "Titration %", value: (r) => (r.trx ? fmtPct(r.starts / r.trx, 0) : "—"), align: "right" },
                ]}
              />
            </div>
          </div>
        </Section>

        <Section title="Medicaid & Managed Medicaid plans × week" description="Plans down, week-ending dates across, EXXUA TRx in the cells" def={pivot.def}>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium">Plan</th>
                  <th className="px-2 py-2 text-left font-medium">MCO</th>
                  <th className="px-2 py-2 text-left font-medium">ST</th>
                  {pivot.cols.map((c) => <th key={c} className="px-2 py-2 text-right font-medium tabular-nums whitespace-nowrap">{c.slice(5)}</th>)}
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {pivot.rows.map((r) => {
                  const max = Math.max(...r.cells, 1)
                  return (
                    <tr key={r.plan} className="border-t">
                      <td className="sticky left-0 bg-background px-3 py-1.5 font-medium whitespace-nowrap">{r.plan}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-muted-foreground">{r.mco}</td>
                      <td className="px-2 py-1.5">{r.state}</td>
                      {r.cells.map((v, i) => <td key={i} className="px-2 py-1.5 text-right tabular-nums" style={{ background: v ? `color-mix(in oklch, var(--chart-1) ${Math.round((v / max) * 45)}%, transparent)` : undefined }}>{v || ""}</td>)}
                      <td className="px-3 py-1.5 text-right font-semibold tabular-nums">{r.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Kpi label="Copay claims, net" value={fmtInt(copay.totals.net)} sub={`${fmtInt(copay.totals.reversals)} reversals removed`} def={copay.def} />
          <Kpi label="Network pharmacy share" value={fmtPct(copay.totals.networkShare, 0)} sub="is_exxua_network_pharmacy" def={copay.def} />
          <Kpi label="Unique patients" value={fmtInt(copay.totals.patients)} sub={`${fmtInt(copay.totals.multiFill)} with multiple fills`} def={copay.def} />
          <Kpi label="Titration packs" value={fmtInt(copay.totals.titration)} sub={fmtPct(copay.totals.titration / copay.totals.net, 0) + " of net claims"} def={copay.def} />
          <Kpi label="Program spend" value={fmtUsd(copay.totals.spend)} sub={`${fmtUsd(copay.totals.spend / copay.totals.net)} blended per claim`} def={copay.def} />
          <Kpi label="Avg patient OOP" value={fmtUsd(copay.totals.avgOop)} sub="non-reversed claims" def={copay.def} />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-3" title="Pharmacies by claims" description="Blended copay rate = program $ / non-reversed transactions" def={copay.def}>
            <DataTable
              rows={copay.pharmacies}
              dense
              filename="exxua_copay_pharmacies.csv"
              rowKey={(r) => r.pharmacy}
              columns={[
                { key: "p", header: "Pharmacy", value: (r) => r.pharmacy },
                { key: "n", header: "Network", value: (r) => (r.network ? "Yes" : "No"), render: (r) => r.network ? <Badge className="text-[10px]">Network</Badge> : <Badge variant="outline" className="text-[10px]">Retail</Badge> },
                { key: "c", header: "Claims", value: (r) => r.claims, align: "right" },
                { key: "b", header: "Blended copay", value: (r) => fmtUsd(r.blended), align: "right" },
                { key: "o", header: "Avg OOP", value: (r) => fmtUsd(r.avgOop), align: "right" },
                { key: "s", header: "Spend", value: (r) => fmtUsd(r.spend), align: "right" },
              ]}
            />
          </Section>
          <Section className="lg:col-span-2" title="Weekly copay claims" description="Net claims and reversals by submission week" def={copay.def}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={copay.weekly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10 }} interval={5} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} labelFormatter={(v) => fmtWeek(String(v))} />
                  <Bar isAnimationActive={false} dataKey="net" name="Net claims" stackId="a" fill="var(--chart-2)" />
                  <Bar isAnimationActive={false} dataKey="reversals" name="Reversals" stackId="a" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
      </main>
    </>
  )
}
