/**
 * Synthetic EXXUA sales dataset.
 *
 * Everything on every page is derived from the objects built here. The
 * generator is seeded, so the numbers are identical on every load and on
 * every machine — that is the point of the prototype: the same question
 * always returns the same answer, and each answer can name its definition.
 *
 * None of this is real data. Names, NPIs, territories and volumes are made up.
 */

export type Week = {
  /** ISO date of the Friday that ends the week (Sat–Fri "true week"). */
  end: string
  index: number
  month: string // YYYY-MM
  quarter: string // 2026-Q1
  holiday?: string
}

export type Territory = {
  code: string
  name: string
  district: string
  region: string
  state: string
  repId: string | null
  zips: string[]
  /** true for the unassigned bucket */
  whiteSpace?: boolean
}

export type Rep = {
  id: string
  name: string
  role: "Sales Specialist" | "District Manager" | "Virtual Sales"
  hireDate: string
  territoryCode: string | null
  managerId: string | null
}

export type Specialty = "Psychiatry" | "Family Medicine" | "Internal Medicine" | "Nurse Practitioner" | "Physician Assistant" | "Neurology"

export type Tier = "Exxua_A" | "Exxua_A_Colocated" | "Exxua_B" | "Exxua_Plus" | null

export type Hcp = {
  npi: string
  first: string
  last: string
  specialty: Specialty
  city: string
  state: string
  zip: string
  territoryCode: string
  tier: Tier
  tierPrev: Tier
  canContact: boolean
  canShare: boolean
  /** account / health system id */
  accountId: string
  /** deterministic propensity 0..1 used to seed prescribing behaviour */
  propensity: number
}

export type Account = { id: string; name: string; state: string }

export type PayerChannel = "Commercial" | "Medicaid" | "Medicare" | "TriCare" | "Cash"

export type RxWeek = {
  npi: string
  weekIndex: number
  /** EXXUA fTRx (tunits_exx) */
  exxTrx: number
  exxNrx: number
  exxStarts: number // titration pack
  exxCont: number // continuing
  /** MDD market TRx for this HCP-week */
  mktTrx: number
  mktBranded: number
  buspirone: number
  auvelity: number
  trintellix: number
  channel: Record<PayerChannel, number>
}

export type CallType = "Face-to-face with HCP" | "HCP Meal" | "Office Visit (no prescriber contact)" | "Virtual"

export type Call = {
  id: string
  npi: string
  repId: string
  date: string
  weekIndex: number
  type: CallType
  products: string[]
}

export type Email = {
  id: string
  npi: string
  repId: string
  weekIndex: number
  template: string
  delivered: boolean
  opened: boolean
  clicked: boolean
}

export type CopayClaim = {
  id: string
  npi: string
  weekIndex: number
  pharmacy: string
  pharmacyState: string
  network: boolean
  reversal: boolean
  product: "EXXUA C" | "EXXUA T"
  copay: number
  oop: number
  channel: PayerChannel
  memberId: string
}

export type MedicaidPlan = { id: string; name: string; mco: string; state: string }

export type Dataset = {
  weeks: Week[]
  latestWeek: Week
  launchWeekIndex: number
  territories: Territory[]
  reps: Rep[]
  hcps: Hcp[]
  accounts: Account[]
  rx: RxWeek[]
  calls: Call[]
  emails: Email[]
  copay: CopayClaim[]
  medicaidPlans: MedicaidPlan[]
  /** planId -> weekIndex -> EXXUA TRx */
  medicaidPlanRx: Record<string, Record<number, number>>
  /** goal per territory per quarter (fTRx) */
  goals: Record<string, Record<string, number>>
  freshness: { source: string; table: string; asOf: string; cadence: string }[]
}
