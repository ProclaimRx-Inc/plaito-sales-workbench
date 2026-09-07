import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DefinitionDrawer } from "@/components/definition-drawer"
import type { Definition } from "@/lib/definition"
import { cn } from "@/lib/utils"

export function Kpi({ label, value, sub, delta, def, className }: { label: string; value: ReactNode; sub?: ReactNode; delta?: number; def?: Definition; className?: string }) {
  return (
    <Card className={cn("gap-0 py-4", className)}>
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          {def && <DefinitionDrawer def={def} compact />}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
          {delta !== undefined && Number.isFinite(delta) && (
            <span className={cn("text-xs font-medium tabular-nums", delta > 0 ? "text-emerald-600 dark:text-emerald-400" : delta < 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {(Math.abs(delta) * 100).toFixed(1)}%
            </span>
          )}
        </div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}
