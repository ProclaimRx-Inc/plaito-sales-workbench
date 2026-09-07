"use client"

import { useMemo, useState } from "react"
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ReferenceLine, ZAxis } from "recharts"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { TierBadge } from "@/components/tier-badge"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getData } from "@/lib/data"
import { hcpOpportunity, type OpportunityRow, type Quadrant } from "@/lib/queries"
import { fmtInt, fmtPct } from "@/lib/format"

const QUADRANTS: { key: Quadrant | "All"; color: string; hint: string }[] = [
  { key: "All", color: "", hint: "" },
  { key: "Convert", color: "var(--chart-1)", hint: "High potential, little or no EXXUA — the white-space look-alike list" },
  { key: "Grow", color: "var(--chart-2)", hint: "High potential and already writing" },
  { key: "Defend", color: "var(--chart-4)", hint: "Writing EXXUA but small market" },
  { key: "Deprioritize", color: "var(--chart-5)", hint: "Small market, no EXXUA" },
]

export default function OpportunitiesPage() {
  const data = getData()
  const opp = useMemo(() => hcpOpportunity(), [])
  const [quadrant, setQuadrant] = useState<Quadrant | "All">("Convert")
  const [territory, setTerritory] = useState<string>("all")
  const [wsOnly, setWsOnly] = useState(false)
  const [uncalledOnly, setUncalledOnly] = useState(false)

  const rows = opp.rows.filter((r) => (quadrant === "All" || r.quadrant === quadrant) && (territory === "all" || r.territoryCode === territory) && (!wsOnly || r.whiteSpace) && (!uncalledOnly || r.calls13 === 0))
  const counts = Object.fromEntries(QUADRANTS.map((q) => [q.key, opp.rows.filter((r) => (q.key === "All" || r.quadrant === q.key) && (territory === "all" || r.territoryCode === territory) && (!wsOnly || r.whiteSpace)).length]))
  const scatter = opp.rows.filter((r) => territory === "all" || r.territoryCode === territory).filter((r) => !wsOnly || r.whiteSpace)

  return (
    <>
      <PageHeader title="HCP Opportunities" description="A visible score, four quadrants, and a rule-based next best action per HCP" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
          <Tabs value={quadrant} onValueChange={(v) => setQuadrant(v as Quadrant | "All")}>
            <TabsList className="h-8">
              {QUADRANTS.map((q) => <TabsTrigger key={q.key} value={q.key} className="gap-1.5 text-xs">{q.color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: q.color }} />}{q.key} <span className="text-muted-foreground">{counts[q.key]}</span></TabsTrigger>)}
            </TabsList>
          </Tabs>
          <Select value={territory} onValueChange={setTerritory}>
            <SelectTrigger size="sm" className="w-[220px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All territories</SelectItem>
              {data.territories.map((t) => <SelectItem key={t.code} value={t.code} className="text-xs">{t.code} · {t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2"><Switch id="ws" checked={wsOnly} onCheckedChange={setWsOnly} /><Label htmlFor="ws" className="text-xs">White Space only</Label></div>
          <div className="flex items-center gap-2"><Switch id="uc" checked={uncalledOnly} onCheckedChange={setUncalledOnly} /><Label htmlFor="uc" className="text-xs">Zero calls in 13 weeks</Label></div>
          <div className="ml-auto text-xs text-muted-foreground">{QUADRANTS.find((q) => q.key === quadrant)?.hint}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section className="lg:col-span-2" title="Value × potential" description="x = potential score (0–1), y = EXXUA fTRx trailing 13 weeks. Lines are the medians." def={opp.def}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="potential" type="number" domain={[0, 1]} tick={{ fontSize: 10 }} name="Potential" />
                  <YAxis dataKey="current" type="number" tick={{ fontSize: 10 }} name="fTRx 13 wk" />
                  <ZAxis range={[14, 14]} />
                  <ReferenceLine x={opp.medians.potential} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <ReferenceLine y={opp.medians.current} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} formatter={(v: number, n: string) => [typeof v === "number" ? (n === "Potential" ? v.toFixed(2) : fmtInt(v)) : v, n]} />
                  {QUADRANTS.filter((q) => q.key !== "All").map((q) => (
                    <Scatter isAnimationActive={false} key={q.key} name={q.key} data={scatter.filter((r) => r.quadrant === q.key)} fill={q.color} fillOpacity={quadrant === "All" || quadrant === q.key ? 0.8 : 0.15} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Section>
          <Section className="lg:col-span-3" title="How the score works" description="Deliberately simple and printed on the page" def={opp.def}>
            <div className="space-y-3 text-sm">
              <p className="whitespace-normal break-words rounded-md bg-muted p-3 font-mono text-[12px]">potential = 0.50 · rank(MDD market TRx) + 0.25 · rank(branded MDD TRx) + 0.15 · rank(buspirone TRx) + 0.10 · rank(Auvelity TRx)</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Ranks are percentile ranks across every HCP in the master over the trailing 13 weeks, so the score is stable week to week.</li>
                <li>Buspirone and Auvelity are in because the chat users asked, repeatedly, whether those writers were more likely to adopt EXXUA. Here the weights are explicit and editable rather than rediscovered by an LLM each time.</li>
                <li>Quadrants split at the median potential and the median non-zero fTRx (currently {opp.medians.potential.toFixed(2)} and {fmtInt(opp.medians.current)}).</li>
                <li>The action column is a small rule table: white space + high potential → alignment review; convert + zero calls → first call; lapsed writer → re-engage; and so on.</li>
              </ul>
            </div>
          </Section>
        </div>

        <Section title={`${quadrant === "All" ? "All HCPs" : `${quadrant} list`}${territory !== "all" ? ` · ${data.territories.find((t) => t.code === territory)?.name}` : ""}`} description="Sorted by potential. Export gives the rep a call list with the reason attached." def={opp.def}>
          <DataTable
            rows={rows}
            dense
            limit={40}
            filename={`hcp_opportunities_${quadrant.toLowerCase()}_${data.latestWeek.end}.csv`}
            rowKey={(r) => r.npi}
            columns={[
              { key: "name", header: "HCP", value: (r) => r.name },
              { key: "npi", header: "NPI", value: (r) => r.npi, className: "font-mono text-[11px]" },
              { key: "spec", header: "Specialty", value: (r) => r.specialty },
              { key: "loc", header: "City, ST", value: (r) => `${r.city}, ${r.state}` },
              { key: "terr", header: "Territory", value: (r) => r.territory, render: (r) => <span className={r.whiteSpace ? "text-rose-600 dark:text-rose-400" : ""}>{r.territory}</span> },
              { key: "tier", header: "Priority", value: (r) => r.tier ?? "Untargeted", render: (r) => <TierBadge tier={r.tier} /> },
              { key: "status", header: "Status", value: (r) => r.status },
              { key: "pot", header: "Potential", value: (r) => r.potential.toFixed(2), align: "right" },
              { key: "mkt", header: "MDD TRx", value: (r) => r.mkt13, align: "right" },
              { key: "busp", header: "Buspirone", value: (r) => r.buspirone13, align: "right" },
              { key: "exx", header: "EXXUA fTRx", value: (r) => r.exx13, align: "right" },
              { key: "share", header: "Share", value: (r) => fmtPct(r.share13), align: "right" },
              { key: "calls", header: "Calls 13 wk", value: (r) => r.calls13, align: "right" },
              { key: "last", header: "Wks since call", value: (r) => (r.weeksSinceCall === null ? "never" : r.weeksSinceCall), align: "right" },
              { key: "action", header: "Next best action", value: (r) => r.action, render: (r) => <Badge variant="secondary" className="text-[10px]">{r.action}</Badge> },
              { key: "reason", header: "Why", value: (r) => r.reason, className: "max-w-[360px] whitespace-normal text-muted-foreground" },
            ] satisfies import("@/components/data-table").TableColumn<OpportunityRow>[]}
          />
        </Section>
      </div>
    </>
  )
}
