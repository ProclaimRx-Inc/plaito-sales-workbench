import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DefinitionDrawer } from "@/components/definition-drawer"
import type { Definition } from "@/lib/definition"
import { cn } from "@/lib/utils"

export function Section({ title, description, def, actions, children, className }: { title: string; description?: string; def?: Definition; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("gap-4", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {def && <DefinitionDrawer def={def} compact />}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
