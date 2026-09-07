import type { LucideIcon } from "lucide-react"
import { Activity, Users, Map, Target, Radio, Landmark, Flag, Lightbulb } from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon; blurb: string; categories: string[] }

export const TOOLS: NavItem[] = [
  { href: "/pulse", label: "Launch Pulse", icon: Activity, blurb: "How did we do last week, and why", categories: ["Rx Performance & Trends", "Launch Performance & Readiness", "Business Drivers & Anomaly Detection"] },
  { href: "/writers", label: "Writer Lifecycle", icon: Users, blurb: "New, repeat, at-risk and lapsed EXXUA writers", categories: ["HCP / Prescriber Analysis", "HCP Adoption, Retention & Lapse"] },
  { href: "/territories", label: "Territory Scorecard", icon: Map, blurb: "Alignment, payer split, coverage and ZIP lookup", categories: ["Territory & Rep Performance", "Sales Goal & Attainment"] },
  { href: "/opportunities", label: "HCP Opportunities", icon: Target, blurb: "Value × potential quadrants and next best action", categories: ["HCP Targeting & White Space", "HCP Segmentation & Prioritization", "Opportunity & Next-Best-Action", "Market & Competitive Intelligence"] },
  { href: "/engagement", label: "Engagement → Rx", icon: Radio, blurb: "Target coverage, calls before first Rx, event pre/post", categories: ["Call Activity & Field Engagement", "Promotional Effectiveness", "Digital & Omnichannel Engagement"] },
  { href: "/payers", label: "Payers & Copay", icon: Landmark, blurb: "Channel mix, Medicaid plan pivot, copay program", categories: ["Payer, Access & Channel", "Patient Support & Pharmacy", "Patient-Level & Rx Journey"] },
  { href: "/goals", label: "Goal Attainment", icon: Flag, blurb: "Quarter-to-date pace against territory goals", categories: ["Sales Goal & Attainment"] },
]

export const IDEAS: NavItem = { href: "/ideas", label: "Product ideas", icon: Lightbulb, blurb: "The backlog, mapped to the prompt taxonomy", categories: [] }
