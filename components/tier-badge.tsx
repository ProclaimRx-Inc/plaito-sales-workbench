import { Badge } from "@/components/ui/badge"
import type { Tier } from "@/lib/data"
import { tierLabel } from "@/lib/queries"
import { cn } from "@/lib/utils"

export function TierBadge({ tier }: { tier: Tier }) {
  const cls = tier === "Exxua_A" ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" : tier === "Exxua_A_Colocated" ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300" : tier === "Exxua_B" ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300" : tier === "Exxua_Plus" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
  return <Badge variant="outline" className={cn("text-[10px] font-medium", cls)}>{tierLabel(tier)}</Badge>
}
