"use client"

import type { ReactNode } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toCsv, downloadCsv, type Column } from "@/lib/csv"
import { cn } from "@/lib/utils"

export type TableColumn<T> = Column<T> & { align?: "left" | "right"; render?: (row: T) => ReactNode; className?: string }

/** Exportable table. The CSV has exactly the columns on screen, in order. */
export function DataTable<T>({ rows, columns, filename, rowKey, limit, emptyText = "No rows", onRowClick, dense }: {
  rows: T[]; columns: TableColumn<T>[]; filename?: string; rowKey: (row: T) => string; limit?: number; emptyText?: string; onRowClick?: (row: T) => void; dense?: boolean
}) {
  const shown = limit ? rows.slice(0, limit) : rows
  return (
    <div className="space-y-2">
      {filename && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{rows.length.toLocaleString()} rows{limit && rows.length > limit ? `, showing ${limit}` : ""}</span>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => downloadCsv(filename, toCsv(rows, columns))}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table className={dense ? "text-xs" : "text-sm"}>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={cn("whitespace-nowrap", c.align === "right" && "text-right", c.className)}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">{emptyText}</TableCell></TableRow>
            )}
            {shown.map((r) => (
              <TableRow key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn(onRowClick && "cursor-pointer")}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={cn("whitespace-nowrap", c.align === "right" && "text-right tabular-nums", dense && "py-1.5", c.className)}>
                    {c.render ? c.render(r) : (c.value(r) ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
