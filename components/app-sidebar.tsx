"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FlaskConical } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { IDEAS, TOOLS } from "@/lib/nav"
import { getData } from "@/lib/data"
import { fmtDate } from "@/lib/format"

export function AppSidebar() {
  const pathname = usePathname()
  const latest = getData().latestWeek.end
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold">PLAiTO Sales Workbench</div>
            <div className="text-[11px] text-muted-foreground">prototype · synthetic data</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {TOOLS.map((t) => (
                <SidebarMenuItem key={t.href}>
                  <SidebarMenuButton asChild isActive={pathname === t.href} tooltip={t.blurb}>
                    <Link href={t.href}>
                      <t.icon />
                      <span>{t.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>About</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === IDEAS.href}>
                  <Link href={IDEAS.href}>
                    <IDEAS.icon />
                    <span>{IDEAS.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
          <span>Rx data through {fmtDate(latest)}</span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
