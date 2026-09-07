import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
        <div className="mt-auto border-t px-6 py-2 text-center text-[11px] text-muted-foreground">
          Every number on this site is generated from a seeded synthetic dataset. No real HCP, patient, rep or Aytu data is present.
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
