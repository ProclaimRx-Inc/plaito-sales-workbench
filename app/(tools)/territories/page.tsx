"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { TierBadge } from "@/components/tier-badge"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getData } from "@/lib/data"
import { territoryScorecard, territoryTopHcps, territoryTrend, zipLookup, type TerritoryRow } from "@/lib/queries"
import { fmtInt, fmtPct, fmtWeek } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function TerritoriesPage() {
  const data = getData()
  const [weeks, setWeeks] = useState<13 | 26>(13)
  const [zip, setZip] = useState("")
  const [open, setOpen] = useState<TerritoryRow | null>(null)
  const sc = useMemo(() => territoryScorecard(weeks), [weeks])
  const zipHit = zip.length === 5 ? zipLookup(zip) : null
  const exampleZip = data.territories[3].zips[0]

  return (
    <>
      <PageHeader title="Territory Scorecard" description="Current alignment only. White Space is its own row and never leaks into a territory." />
      <main className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Section className="lg:col-span-1" title="Which territory owns this ZIP?" description="Reads the current alignment row (end_date = current)">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder={`5-digit ZIP, e.g. ${exampleZip}`} className="pl-8 font-mono" />
            </div>
            <div className="mt-3 min-h-[88px] text-sm">
              {zip.length < 5 && <p className="text-xs text-muted-foreground">Try <button className="underline" onClick={() => setZip(exampleZip)}>{exampleZip}</button> or <button className="underline" onClick={() => setZip(data.territories[data.territories.length - 1].zips[0])}>a White Space ZIP</button>.</p>}
              {zip.length === 5 && !zipHit && <p className="text-rose-600 dark:text-rose-400">ZIP {zip} is not in scd_zipterr. In production this means "not aligned" — not "White Space".</p>}
              {zipHit && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{zipHit.territory.code}</span><span className="font-semibold">{zipHit.territory.name}</span>{zipHit.territory.whiteSpace && <Badge variant="destructive" className="text-[10px]">White Space</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{zipHit.territory.district} · {zipHit.territory.region}</div>
                  <div className="text-xs">Rep: <span className={cn(zipHit.territory.repId ? "" : "text-amber-600")}>{zipHit.rep}</span></div>
                  <div className="text-xs">{zipHit.hcps.length} HCPs in this ZIP{zipHit.hcps.length ? `: ${zipHit.hcps.slice(0, 3).map((h) => `${h.last} (${h.specialty})`).join(", ")}${zipHit.hcps.length > 3 ? "…" : ""}` : ""}</div>
                </div>
              )}
            </div>
          </Section>
          <Section className="lg:col-span-2" title="Alignment at a glance" description="Counts the chat users asked for every few days">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { l: "Active territories", v: data.territories.filter((t) => !t.whiteSpace).length },
                { l: "Vacant territories", v: data.territories.filter((t) => !t.whiteSpace && !t.repId).length },
                { l: "Sales Specialists", v: data.reps.filter((r) => r.role === "Sales Specialist").length },
                { l: "District Managers", v: data.reps.filter((r) => r.role === "District Manager").length },
                { l: "Mapped ZIPs", v: data.territories.filter((t) => !t.whiteSpace).reduce((a, t) => a + t.zips.length, 0) },
                { l: "White Space ZIPs", v: data.territories.find((t) => t.whiteSpace)!.zips.length },
                { l: "HCPs in territory", v: data.hcps.filter((h) => h.territoryCode !== "N999999").length },
                { l: "HCPs in White Space", v: data.hcps.filter((h) => h.territoryCode === "N999999").length },
              ].map((k) => (
                <div key={k.l} className="rounded-md border px-3 py-2"><div className="text-[11px] text-muted-foreground">{k.l}</div><div className="text-xl font-semibold tabular-nums">{fmtInt(k.v)}</div></div>
              ))}
            </div>
          </Section>
        </div>

        <Section
          title={`Scorecard, trailing ${weeks} weeks`}
          description="MDD market TRx, EXXUA fTRx with payer split, writers, calls, target coverage and QTD goal. Click a row for detail."
          def={sc.def}
          actions={
            <Tabs value={String(weeks)} onValueChange={(v) => setWeeks(Number(v) as 13 | 26)}>
              <TabsList className="h-8"><TabsTrigger value="13" className="text-xs">13 wk</TabsTrigger><TabsTrigger value="26" className="text-xs">26 wk</TabsTrigger></TabsList>
            </Tabs>
          }
        >
          <DataTable
            rows={sc.rows}
            dense
            filename={`territory_scorecard_${weeks}wk_${data.latestWeek.end}.csv`}
            rowKey={(r) => r.code}
            onRowClick={(r) => setOpen(r)}
            columns={[
              { key: "code", header: "Terr #", value: (r) => r.code, className: "font-mono text-[11px]" },
              { key: "name", header: "Territory", value: (r) => r.name, render: (r) => <span className={cn("font-medium", r.whiteSpace && "text-rose-600 dark:text-rose-400")}>{r.name}</span> },
              { key: "district", header: "District", value: (r) => r.district },
              { key: "region", header: "Region", value: (r) => r.region },
              { key: "rep", header: "Sales Specialist", value: (r) => r.rep, render: (r) => <span className={cn(r.vacant && "text-amber-600 dark:text-amber-400")}>{r.rep}</span> },
              { key: "mkt", header: "MDD mkt TRx", value: (r) => r.mktTrx13, align: "right" },
              { key: "exx", header: "EXXUA fTRx", value: (r) => r.exxTrx13, align: "right", className: "font-semibold" },
              { key: "share", header: "Share", value: (r) => fmtPct(r.share13, 2), align: "right" },
              { key: "com", header: "Commercial", value: (r) => r.channel13.Commercial, align: "right" },
              { key: "caid", header: "Medicaid", value: (r) => r.channel13.Medicaid, align: "right" },
              { key: "care", header: "Medicare", value: (r) => r.channel13.Medicare, align: "right" },
              { key: "tri", header: "TriCare", value: (r) => r.channel13.TriCare, align: "right" },
              { key: "writers", header: "Writers", value: (r) => r.writers13, align: "right" },
              { key: "nw", header: "New writers", value: (r) => r.newWriters13, align: "right" },
              { key: "calls", header: "Calls", value: (r) => r.calls13, align: "right" },
              { key: "cov", header: "Targets called", value: (r) => (r.targets ? fmtPct(r.targetsCalled13 / r.targets, 0) : "—"), align: "right" },
              { key: "att", header: "QTD vs goal", value: (r) => (Number.isFinite(r.attainment) ? fmtPct(r.attainment, 0) : "—"), align: "right", render: (r) => Number.isFinite(r.attainment) ? <span className={r.attainment >= 1 ? "text-emerald-600 dark:text-emerald-400" : r.attainment < 0.6 ? "text-rose-600 dark:text-rose-400" : ""}>{fmtPct(r.attainment, 0)}</span> : <span className="text-muted-foreground">—</span> },
            ]}
          />
        </Section>

        <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
          <SheetContent className="w-[560px] overflow-y-auto sm:max-w-[600px]">
            {open && <TerritoryDetail row={open} />}
          </SheetContent>
        </Sheet>
      </main>
    </>
  )
}

function TerritoryDetail({ row }: { row: TerritoryRow }) {
  const trend = territoryTrend(row.code)
  const top = territoryTopHcps(row.code)
  return (
    <>
      <SheetHeader>
        <SheetTitle><span className="font-mono text-sm text-muted-foreground">{row.code}</span> {row.name}</SheetTitle>
        <SheetDescription>{row.district} · {row.region} · {row.rep}{row.vacant ? " (vacant)" : ""} · {row.zips} ZIPs · {row.hcps} HCPs · {row.targets} targets ({row.priorityA} Priority)</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4 pb-6">
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Weekly EXXUA fTRx since launch</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10 }} interval={5} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }} labelFormatter={(v) => fmtWeek(String(v))} />
                <Area isAnimationActive={false} type="monotone" dataKey="exxTrx" name="EXXUA fTRx" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Top HCPs, trailing 13 weeks</div>
          <DataTable
            rows={top}
            dense
            rowKey={(r) => r.npi}
            columns={[
              { key: "name", header: "HCP", value: (r) => r.name },
              { key: "spec", header: "Specialty", value: (r) => r.specialty },
              { key: "tier", header: "Priority", value: (r) => r.tier ?? "", render: (r) => <TierBadge tier={r.tier} /> },
              { key: "exx", header: "fTRx", value: (r) => r.exx, align: "right" },
              { key: "mkt", header: "MDD TRx", value: (r) => r.mkt, align: "right" },
            ]}
          />
        </div>
      </div>
    </>
  )
}
