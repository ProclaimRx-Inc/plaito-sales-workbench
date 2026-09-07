"use client"

import { useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { DataTable } from "@/components/data-table"
import { Kpi } from "@/components/kpi"
import { Progress } from "@/components/ui/progress"
import { goalAttainment } from "@/lib/queries"
import { fmtInt, fmtPct } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function GoalsPage() {
  const g = useMemo(() => goalAttainment(), [])
  const goal = g.rows.reduce((a, r) => a + r.goal, 0)
  const actual = g.rows.reduce((a, r) => a + r.actual, 0)
  const pace = g.elapsed / g.total
  const above = g.rows.filter((r) => r.attainment >= 1).length
  const behind = g.rows.filter((r) => r.attainment < pace * 0.8).length

  return (
    <>
      <PageHeader title="Goal Attainment" description="Quarter-to-date fTRx against territory goals. This one needs a goals table the platform does not have yet." />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="National % of goal, QTD" value={fmtPct(actual / goal, 0)} sub={`${fmtInt(actual)} of ${fmtInt(goal)} fTRx`} def={g.def} />
          <Kpi label="Quarter elapsed" value={fmtPct(pace, 0)} sub={`${g.elapsed} of ${g.total} true weeks`} def={g.def} />
          <Kpi label="Territories at ≥100%" value={fmtInt(above)} sub="already past the quarterly goal" def={g.def} />
          <Kpi label="Territories off pace" value={fmtInt(behind)} sub="below 80% of the elapsed-time pace" def={g.def} />
        </div>
        <Section title="Territory attainment" description="Gap = scripts still needed to reach goal. Pace marker at the elapsed share of the quarter." def={g.def}>
          <DataTable
            rows={g.rows}
            dense
            filename="goal_attainment_qtd.csv"
            rowKey={(r) => r.code}
            columns={[
              { key: "code", header: "Terr #", value: (r) => r.code, className: "font-mono text-[11px]" },
              { key: "name", header: "Territory", value: (r) => r.name },
              { key: "rep", header: "Rep", value: (r) => r.rep },
              { key: "region", header: "Region", value: (r) => r.region },
              { key: "goal", header: "Goal", value: (r) => r.goal, align: "right" },
              { key: "actual", header: "QTD fTRx", value: (r) => r.actual, align: "right" },
              { key: "gap", header: "Gap", value: (r) => Math.max(0, r.gap), align: "right" },
              { key: "att", header: "Attainment", value: (r) => fmtPct(r.attainment, 0), align: "right", render: (r) => <span className={cn("font-semibold", r.attainment >= 1 ? "text-emerald-600 dark:text-emerald-400" : r.attainment < pace * 0.8 ? "text-rose-600 dark:text-rose-400" : "")}>{fmtPct(r.attainment, 0)}</span> },
              { key: "bar", header: "", value: () => "", className: "w-[220px]", render: (r) => (
                <div className="relative">
                  <Progress value={Math.min(100, r.attainment * 100)} className="h-2" />
                  <div className="absolute top-[-3px] h-[14px] w-px bg-foreground/60" style={{ left: `${pace * 100}%` }} title="pace" />
                </div>
              ) },
            ]}
          />
        </Section>
      </div>
    </>
  )
}
