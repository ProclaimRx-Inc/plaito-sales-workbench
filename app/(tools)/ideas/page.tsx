import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IDEAS, TAXONOMY } from "@/lib/taxonomy"
import { cn } from "@/lib/utils"

export default function IdeasPage() {
  const asked = TAXONOMY.filter((t) => t.asked)
  const unasked = TAXONOMY.filter((t) => !t.asked)
  return (
    <>
      <PageHeader title="Product ideas" description="Distilled from PLAiTO_Sales_Prompt_Taxonomy.xlsx — 20 categories, 13 asked in production, 7 not yet" />
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="rounded-xl border bg-card p-4 text-sm leading-relaxed">
          <p className="font-medium">The thesis</p>
          <p className="mt-1 text-muted-foreground">
            Most production prompts are not open-ended analysis. They are the same dozen reports with different parameters, asked in chat because there is no button for them, and re-asked because the chat answer changed. Each tool here fixes one report's definition in code, prints that definition next to the number, and hands the user an export. The chat agent stays for the genuinely novel question — and the Definition drawer gives it the right starting point.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {IDEAS.map((i) => (
            <div key={i.name} className="flex flex-col rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold leading-tight">{i.name}</h3>
                <Badge variant={i.status === "Prototyped" ? "default" : i.status === "Cross-cutting" ? "secondary" : "outline"} className="shrink-0 text-[10px]">{i.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Problem. </span>{i.problem}</p>
              <ul className="mt-2 space-y-1">
                {i.quotes.map((q) => <li key={q} className="border-l-2 pl-2 text-[11px] italic text-muted-foreground">“{q}”</li>)}
              </ul>
              <p className="mt-2 text-xs"><span className="font-medium">Tool. </span>{i.tool}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {i.categories.map((c) => <Badge key={c} variant="outline" className={cn("text-[10px]", !TAXONOMY.find((t) => t.category === c)?.asked && "border-dashed")}>{c}</Badge>)}
              </div>
              {i.href && <Link href={i.href} className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline">Open the prototype <ArrowUpRight className="h-3 w-3" /></Link>}
            </div>
          ))}
        </div>

        <Section title="Taxonomy coverage" description="Row counts from the workbook. Dashed badges above are the categories no production user has asked yet.">
          <div className="grid gap-6 lg:grid-cols-2">
            {[{ label: "Asked in production", rows: asked }, { label: "Not yet asked (seeded by ops)", rows: unasked }].map((g) => (
              <div key={g.label}>
                <div className="mb-2 text-xs font-medium text-muted-foreground">{g.label} · {g.rows.reduce((a, r) => a + r.prompts, 0)} prompts</div>
                <div className="rounded-md border">
                  <Table className="text-xs">
                    <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Prompts</TableHead><TableHead>Covered by</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {g.rows.map((t) => (
                        <TableRow key={t.category}>
                          <TableCell className="py-1.5">{t.category}</TableCell>
                          <TableCell className="py-1.5 text-right tabular-nums">{t.prompts}</TableCell>
                          <TableCell className="py-1.5">{t.tool ? t.tool.startsWith("/") ? <Link href={t.tool} className="font-mono underline-offset-4 hover:underline">{t.tool}</Link> : <span className="text-muted-foreground">{t.tool}</span> : <span className="text-muted-foreground">proposed</span>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}
