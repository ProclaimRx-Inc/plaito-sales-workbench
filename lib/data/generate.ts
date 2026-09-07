import { rng } from "./rng"
import type {
  Account,
  Call,
  CallType,
  CopayClaim,
  Dataset,
  Email,
  Hcp,
  MedicaidPlan,
  PayerChannel,
  Rep,
  RxWeek,
  Specialty,
  Territory,
  Tier,
  Week,
} from "./model"

const FIRST_WEEK_END = "2025-06-27" // Friday
const LAST_WEEK_END = "2026-08-28" // Friday — the "latest week of data"
const LAUNCH_WEEK_END = "2025-12-05"

const HOLIDAYS: Record<string, string> = {
  "2025-07-04": "Independence Day",
  "2025-09-05": "Labor Day",
  "2025-11-28": "Thanksgiving",
  "2025-12-26": "Christmas Day",
  "2026-01-02": "New Year's Day",
  "2026-01-23": "MLK Day",
  "2026-02-20": "Presidents Day",
  "2026-05-29": "Memorial Day",
  "2026-07-03": "Independence Day",
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z")
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function quarterOf(iso: string) {
  const m = Number(iso.slice(5, 7))
  return `${iso.slice(0, 4)}-Q${Math.floor((m - 1) / 3) + 1}`
}

export function buildWeeks(): Week[] {
  const weeks: Week[] = []
  let cur = FIRST_WEEK_END
  let i = 0
  while (cur <= LAST_WEEK_END) {
    weeks.push({ end: cur, index: i, month: cur.slice(0, 7), quarter: quarterOf(cur), holiday: HOLIDAYS[cur] })
    cur = addDays(cur, 7)
    i++
  }
  return weeks
}

const REGIONS: Record<string, { district: string; states: string[] }[]> = {
  Northeast: [
    { district: "New England", states: ["MA", "CT", "NH"] },
    { district: "New York Metro", states: ["NY", "NJ"] },
    { district: "Mid-Atlantic", states: ["PA", "MD", "VA"] },
  ],
  Southeast: [
    { district: "Florida", states: ["FL"] },
    { district: "Carolinas", states: ["NC", "SC", "GA"] },
    { district: "Gulf", states: ["TN", "AL", "LA"] },
  ],
  Central: [
    { district: "Great Lakes", states: ["OH", "MI", "IN"] },
    { district: "Midwest", states: ["IL", "WI", "MN"] },
    { district: "Texas", states: ["TX", "OK"] },
  ],
  West: [
    { district: "Mountain", states: ["CO", "AZ", "UT"] },
    { district: "Pacific", states: ["CA", "WA", "OR"] },
  ],
}

const CITY: Record<string, string[]> = {
  MA: ["Boston", "Worcester"], CT: ["Hartford"], NH: ["Manchester"], NY: ["New York", "White Plains", "Buffalo"], NJ: ["Newark", "Princeton"],
  PA: ["Philadelphia", "Pittsburgh"], MD: ["Baltimore"], VA: ["Richmond"], FL: ["Miami", "Tampa", "Orlando", "Jacksonville"],
  NC: ["Charlotte", "Raleigh"], SC: ["Charleston"], GA: ["Atlanta"], TN: ["Nashville"], AL: ["Birmingham"], LA: ["New Orleans"],
  OH: ["Columbus", "Cleveland", "Cincinnati"], MI: ["Detroit", "Grand Rapids"], IN: ["Indianapolis"], IL: ["Chicago"], WI: ["Milwaukee"],
  MN: ["Minneapolis"], TX: ["Houston", "Dallas", "Austin", "San Antonio"], OK: ["Oklahoma City"], CO: ["Denver"], AZ: ["Phoenix"], UT: ["Salt Lake City"],
  CA: ["Los Angeles", "San Diego", "San Francisco", "Sacramento"], WA: ["Seattle"], OR: ["Portland"],
}

const FIRST = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Lisa", "Matthew", "Nancy", "Anthony", "Sandra", "Mark", "Ashley", "Steven", "Emily", "Andrew", "Donna", "Kenneth", "Michelle", "Priya", "Wei", "Aisha", "Carlos", "Yusuf", "Hannah"]
const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts", "Patel", "Kim", "Okafor", "Bright", "Strunk", "Meli"]

const SPECIALTIES: { s: Specialty; w: number; mkt: number }[] = [
  { s: "Psychiatry", w: 0.34, mkt: 42 },
  { s: "Family Medicine", w: 0.22, mkt: 18 },
  { s: "Internal Medicine", w: 0.14, mkt: 14 },
  { s: "Nurse Practitioner", w: 0.2, mkt: 16 },
  { s: "Physician Assistant", w: 0.07, mkt: 9 },
  { s: "Neurology", w: 0.03, mkt: 6 },
]

const PHARMACIES: { name: string; network: boolean }[] = [
  { name: "Tri Star Pharmacy", network: true },
  { name: "BlinkRx", network: true },
  { name: "Carepoint Specialty", network: true },
  { name: "Meijer Pharmacy", network: false },
  { name: "CVS Pharmacy", network: false },
  { name: "Walgreens", network: false },
  { name: "Walmart Pharmacy", network: false },
  { name: "Publix Pharmacy", network: false },
  { name: "Kroger Pharmacy", network: false },
]

const EMAIL_TEMPLATES = ["EXXUA Efficacy Overview", "Titration Made Simple", "Copay Savings Program", "Sexual Function Data", "Weight Neutrality", "Patient Case: First-Line Switch", "Speaker Program Invite"]

const MCO = ["Centene", "UnitedHealth Group", "Molina", "Elevance", "CVS Health (Aetna)", "State FFS"]

export function generate(): Dataset {
  const r = rng(20251205)
  const weeks = buildWeeks()
  const launchWeekIndex = weeks.findIndex((w) => w.end === LAUNCH_WEEK_END)
  const latestWeek = weeks[weeks.length - 1]

  // ---- territories & reps -------------------------------------------------
  const territories: Territory[] = []
  const reps: Rep[] = []
  let tnum = 100
  let repN = 1
  const usedZips = new Set<string>()
  const newZip = () => {
    for (;;) {
      const z = String(r.int(10000, 99950))
      if (!usedZips.has(z)) { usedZips.add(z); return z }
    }
  }
  for (const [region, districts] of Object.entries(REGIONS)) {
    for (const d of districts) {
      const dmId = `E${String(9000 + repN++)}`
      reps.push({ id: dmId, name: `${r.pick(FIRST)} ${r.pick(LAST)}`, role: "District Manager", hireDate: `2025-${String(r.int(7, 10)).padStart(2, "0")}-15`, territoryCode: null, managerId: null })
      const n = 4
      for (let k = 0; k < n; k++) {
        const state = d.states[k % d.states.length]
        const city = CITY[state][k % CITY[state].length]
        const code = `N10${tnum++}`
        const vacant = r.chance(0.08)
        let repId: string | null = null
        if (!vacant) {
          repId = `E${String(9000 + repN++)}`
          const hireMonth = r.int(8, 13)
          const hireDate = hireMonth > 12 ? `2026-0${hireMonth - 12}-0${r.int(1, 9)}` : `2025-${String(hireMonth).padStart(2, "0")}-${String(r.int(1, 28)).padStart(2, "0")}`
          reps.push({ id: repId, name: `${r.pick(FIRST)} ${r.pick(LAST)}`, role: "Sales Specialist", hireDate, territoryCode: code, managerId: dmId })
        }
        const suffix = k === 0 ? "" : ["", " North", " South", " West"][k]
        territories.push({ code, name: `${city}${suffix}`, district: d.district, region, state, repId, zips: Array.from({ length: r.int(6, 10) }, newZip) })
      }
    }
  }
  reps.push({ id: `E${String(9000 + repN++)}`, name: `${r.pick(FIRST)} ${r.pick(LAST)}`, role: "Virtual Sales", hireDate: "2026-02-02", territoryCode: null, managerId: null })
  territories.push({ code: "N999999", name: "White Space", district: "Unassigned", region: "Unassigned", state: "—", repId: null, zips: Array.from({ length: 60 }, newZip), whiteSpace: true })
  const whiteSpace = territories[territories.length - 1]

  // ---- accounts -----------------------------------------------------------
  const accounts: Account[] = []
  const ACCOUNT_WORDS = ["Health", "Medical Center", "Behavioral Health", "Regional Health", "Health Partners", "Clinic"]
  for (let i = 0; i < 40; i++) {
    const t = r.pick(territories.filter((x) => !x.whiteSpace))
    accounts.push({ id: `ACC${String(i + 1).padStart(3, "0")}`, name: `${t.name.split(" ")[0]} ${r.pick(ACCOUNT_WORDS)}`, state: t.state })
  }

  // ---- HCPs -----------------------------------------------------------------
  const hcps: Hcp[] = []
  const pickSpecialty = () => {
    const x = r.next()
    let acc = 0
    for (const s of SPECIALTIES) { acc += s.w; if (x <= acc) return s }
    return SPECIALTIES[0]
  }
  const usedNpi = new Set<string>()
  const newNpi = () => {
    for (;;) {
      const n = `1${String(r.int(100000000, 999999999))}`
      if (!usedNpi.has(n)) { usedNpi.add(n); return n }
    }
  }
  const tierFor = (inTerritory: boolean, propensity: number): Tier => {
    if (!inTerritory) return null
    const x = r.next() + propensity * 0.35
    if (x > 1.05) return "Exxua_A"
    if (x > 0.9) return "Exxua_A_Colocated"
    if (x > 0.7) return "Exxua_B"
    if (x > 0.6) return "Exxua_Plus"
    return null
  }
  for (let i = 0; i < 720; i++) {
    const inWs = r.chance(0.16)
    const t = inWs ? whiteSpace : r.pick(territories.filter((x) => !x.whiteSpace))
    const sp = pickSpecialty()
    const state = inWs ? r.pick(Object.keys(CITY)) : t.state
    const city = r.pick(CITY[state])
    const propensity = Math.min(1, Math.max(0, r.normal(sp.s === "Psychiatry" ? 0.55 : 0.35, 0.22)))
    const tier = tierFor(!inWs, propensity)
    // previous-quarter tier: mostly the same, some churn
    const tierPrev: Tier = r.chance(0.82) ? tier : r.chance(0.5) ? null : tier === "Exxua_A" ? "Exxua_B" : "Exxua_A"
    hcps.push({
      npi: newNpi(), first: r.pick(FIRST), last: r.pick(LAST), specialty: sp.s, city, state, zip: r.pick(t.zips), territoryCode: t.code,
      tier, tierPrev, canContact: r.chance(0.78), canShare: r.chance(0.86), accountId: r.pick(accounts).id, propensity,
    })
  }
  const bySpec = Object.fromEntries(SPECIALTIES.map((s) => [s.s, s]))

  // ---- weekly Rx -------------------------------------------------------------
  const rx: RxWeek[] = []
  const adoptionWeek = new Map<string, number>()
  const lapsedAt = new Map<string, number>()
  const medicaidHeavy = new Set(["NY", "MI", "OH", "TX", "CA", "LA"])
  for (const h of hcps) {
    const spec = bySpec[h.specialty]
    const mktBase = Math.max(2, r.normal(spec.mkt, spec.mkt * 0.45)) * (0.6 + h.propensity)
    const repFactor = h.territoryCode === "N999999" ? 0.35 : 1
    const tierFactor = h.tier === "Exxua_A" ? 1.6 : h.tier === "Exxua_A_Colocated" ? 1.2 : h.tier === "Exxua_B" ? 0.9 : h.tier === "Exxua_Plus" ? 1.0 : 0.55
    const adoptP = 0.02 * h.propensity * repFactor * tierFactor // per-week hazard after launch
    const medicaidSkew = medicaidHeavy.has(h.state) ? 0.34 : 0.18
    const chanW: Record<PayerChannel, number> = { Commercial: 0.5 - medicaidSkew / 2, Medicaid: medicaidSkew, Medicare: 0.2, TriCare: 0.03, Cash: 0.05 }
    const buspAff = r.chance(0.5 + h.propensity * 0.3)
    for (const w of weeks) {
      const seasonal = 1 + 0.05 * Math.sin((w.index / 52) * Math.PI * 2)
      const mkt = Math.max(0, Math.round(mktBase * seasonal * (0.7 + r.next() * 0.6)))
      const branded = Math.round(mkt * (0.12 + h.propensity * 0.1) * (0.6 + r.next() * 0.8))
      const busp = buspAff ? Math.round(mkt * 0.12 * (0.5 + r.next())) : Math.round(mkt * 0.02 * r.next())
      const auv = Math.round(branded * (0.25 + r.next() * 0.3))
      const trin = Math.round(branded * (0.15 + r.next() * 0.2))
      let exx = 0, nrx = 0, starts = 0, cont = 0
      if (w.index >= launchWeekIndex) {
        const adopted = adoptionWeek.get(h.npi)
        if (adopted === undefined) {
          const ramp = Math.min(1, (w.index - launchWeekIndex + 4) / 20)
          if (r.chance(adoptP * ramp * 1.8)) { adoptionWeek.set(h.npi, w.index); exx = r.int(1, 2); nrx = exx; starts = exx }
        } else {
          const since = w.index - adopted
          const lapsed = lapsedAt.get(h.npi)
          if (lapsed === undefined && since > 6 && r.chance(0.012 * (1 - h.propensity))) lapsedAt.set(h.npi, w.index)
          const active = lapsedAt.get(h.npi) === undefined || r.chance(0.08)
          if (active) {
            const mean = (0.5 + h.propensity * 3.2 * tierFactor) * Math.min(1, since / 8 + 0.4)
            const n = Math.max(0, Math.round(r.normal(mean, Math.max(0.6, mean * 0.55))))
            exx = n
            starts = Math.round(n * Math.max(0.25, 0.75 - since * 0.02) * (0.7 + r.next() * 0.6))
            starts = Math.min(exx, starts)
            cont = exx - starts
            nrx = Math.min(exx, starts + Math.round(cont * 0.15))
          }
        }
      }
      const channel: Record<PayerChannel, number> = { Commercial: 0, Medicaid: 0, Medicare: 0, TriCare: 0, Cash: 0 }
      for (let k = 0; k < exx; k++) {
        const x = r.next()
        let acc = 0
        for (const c of Object.keys(chanW) as PayerChannel[]) { acc += chanW[c]; if (x <= acc) { channel[c]++; break } }
      }
      rx.push({ npi: h.npi, weekIndex: w.index, exxTrx: exx, exxNrx: nrx, exxStarts: starts, exxCont: cont, mktTrx: mkt, mktBranded: branded, buspirone: busp, auvelity: auv, trintellix: trin, channel })
    }
  }

  // ---- calls ----------------------------------------------------------------
  const calls: Call[] = []
  const CALL_TYPES: { t: CallType; w: number }[] = [
    { t: "Face-to-face with HCP", w: 0.58 }, { t: "HCP Meal", w: 0.12 }, { t: "Office Visit (no prescriber contact)", w: 0.22 }, { t: "Virtual", w: 0.08 },
  ]
  const pickCallType = () => { const x = r.next(); let a = 0; for (const c of CALL_TYPES) { a += c.w; if (x <= a) return c.t } return CALL_TYPES[0].t }
  const hcpsByTerr = new Map<string, Hcp[]>()
  for (const h of hcps) { const arr = hcpsByTerr.get(h.territoryCode) ?? []; arr.push(h); hcpsByTerr.set(h.territoryCode, arr) }
  const weightedPick = (arr: Hcp[]) => {
    // targets get more calls; a few HCPs never get any
    const weights = arr.map((h) => (h.tier === "Exxua_A" ? 5 : h.tier === "Exxua_A_Colocated" ? 3 : h.tier === "Exxua_B" ? 2 : h.tier === "Exxua_Plus" ? 2 : 0.6) * (h.canContact ? 1 : 0.3))
    const total = weights.reduce((a, b) => a + b, 0)
    let x = r.next() * total
    for (let i = 0; i < arr.length; i++) { x -= weights[i]; if (x <= 0) return arr[i] }
    return arr[arr.length - 1]
  }
  let callN = 0
  for (const rep of reps.filter((x) => x.role === "Sales Specialist" && x.territoryCode)) {
    const pool = hcpsByTerr.get(rep.territoryCode!) ?? []
    if (pool.length === 0) continue
    const hireWeek = weeks.findIndex((w) => w.end >= rep.hireDate)
    const startWeek = Math.max(launchWeekIndex - 4, hireWeek < 0 ? 0 : hireWeek)
    for (const w of weeks.slice(startWeek)) {
      const n = Math.max(0, Math.round(r.normal(w.holiday ? 24 : 34, 7)))
      for (let k = 0; k < n; k++) {
        const h = weightedPick(pool)
        const dow = r.int(0, 4) // Mon..Fri
        const date = addDays(w.end, -(4 - dow))
        calls.push({ id: `C${++callN}`, npi: h.npi, repId: rep.id, date, weekIndex: w.index, type: pickCallType(), products: r.chance(0.3) ? ["EXXUA", "Adzenys XR-ODT"] : ["EXXUA"] })
      }
    }
  }

  // ---- emails ---------------------------------------------------------------
  const emails: Email[] = []
  let emailN = 0
  for (const rep of reps.filter((x) => x.role === "Sales Specialist" && x.territoryCode)) {
    const pool = (hcpsByTerr.get(rep.territoryCode!) ?? []).filter((h) => h.canContact)
    if (pool.length === 0) continue
    for (const w of weeks.slice(launchWeekIndex)) {
      const n = Math.max(0, Math.round(r.normal(9, 4)))
      for (let k = 0; k < n; k++) {
        const h = weightedPick(pool)
        const delivered = r.chance(0.965)
        const opened = delivered && r.chance(0.31 + h.propensity * 0.1)
        emails.push({ id: `M${++emailN}`, npi: h.npi, repId: rep.id, weekIndex: w.index, template: r.pick(EMAIL_TEMPLATES), delivered, opened, clicked: opened && r.chance(0.22) })
      }
    }
  }

  // ---- copay claims ----------------------------------------------------------
  const copay: CopayClaim[] = []
  let claimN = 0
  const members = new Map<string, string[]>()
  for (const row of rx) {
    if (row.exxTrx === 0) continue
    const h = hcps.find((x) => x.npi === row.npi)!
    const eligible = row.channel.Commercial + row.channel.Cash
    for (let k = 0; k < eligible; k++) {
      if (!r.chance(0.72)) continue
      const ph = r.pick(PHARMACIES)
      const isStart = k < row.exxStarts
      const list = members.get(h.npi) ?? []
      let member: string
      if (list.length > 0 && !isStart && r.chance(0.7)) member = r.pick(list)
      else { member = `P${String(r.int(100000, 999999))}`; list.push(member); members.set(h.npi, list) }
      copay.push({
        id: `T${++claimN}`, npi: h.npi, weekIndex: row.weekIndex, pharmacy: ph.name, pharmacyState: h.state, network: ph.network,
        reversal: r.chance(0.045), product: isStart ? "EXXUA T" : "EXXUA C", copay: ph.network ? r.int(180, 260) : r.int(240, 420), oop: ph.network ? 0 : r.pick([0, 0, 10, 25, 35]),
        channel: r.chance(0.9) ? "Commercial" : "Cash", memberId: member,
      })
    }
  }

  // ---- medicaid plans --------------------------------------------------------
  const medicaidPlans: MedicaidPlan[] = []
  const planStates = ["NY", "MI", "OH", "TX", "CA", "FL", "LA", "PA", "IL", "NJ"]
  let pid = 7000
  for (const st of planStates) {
    const n = r.int(2, 3)
    for (let k = 0; k < n; k++) {
      const mco = k === 0 ? "State FFS" : r.pick(MCO.filter((m) => m !== "State FFS"))
      medicaidPlans.push({ id: String(pid++), name: mco === "State FFS" ? `${st} Medicaid FFS` : `${mco} ${st} Managed Medicaid`, mco, state: st })
    }
  }
  const medicaidPlanRx: Record<string, Record<number, number>> = {}
  for (const p of medicaidPlans) medicaidPlanRx[p.id] = {}
  const hcpState = new Map(hcps.map((h) => [h.npi, h.state]))
  for (const row of rx) {
    if (row.channel.Medicaid === 0) continue
    const st = hcpState.get(row.npi)!
    const cands = medicaidPlans.filter((p) => p.state === st)
    const target = cands.length ? cands : medicaidPlans
    for (let k = 0; k < row.channel.Medicaid; k++) {
      const p = r.pick(target)
      medicaidPlanRx[p.id][row.weekIndex] = (medicaidPlanRx[p.id][row.weekIndex] ?? 0) + 1
    }
  }

  // ---- goals ------------------------------------------------------------------
  const goals: Record<string, Record<string, number>> = {}
  for (const t of territories) {
    if (t.whiteSpace) continue
    goals[t.code] = {}
    const base = 28 + Math.round(r.next() * 40)
    for (const q of ["2026-Q1", "2026-Q2", "2026-Q3"]) goals[t.code][q] = Math.round(base * (q === "2026-Q1" ? 1 : q === "2026-Q2" ? 1.35 : 1.6))
  }

  const freshness = [
    { source: "Symphony weekly Rx (all-HCP)", table: "rpt_allhcp_sha_rx_weekly", asOf: latestWeek.end, cadence: "Weekly, Friday week end" },
    { source: "Copay redemption flash", table: "rpt_copay_detail_bc", asOf: addDays(latestWeek.end, 5), cadence: "Daily" },
    { source: "CRM calls", table: "fct_calls_list", asOf: addDays(latestWeek.end, 4), cadence: "Daily" },
    { source: "Field emails", table: "fct_emails", asOf: addDays(latestWeek.end, 4), cadence: "Daily" },
    { source: "ZIP → territory alignment", table: "scd_zipterr", asOf: "2026-07-01", cadence: "On alignment change" },
    { source: "Target list", table: "hcp_targets", asOf: "2026-07-01", cadence: "Quarterly" },
    { source: "Rep roster", table: "sales_rep_roster", asOf: addDays(latestWeek.end, 3), cadence: "Weekly" },
  ]

  return { weeks, latestWeek, launchWeekIndex, territories, reps, hcps, accounts, rx, calls, emails, copay, medicaidPlans, medicaidPlanRx, goals, freshness }
}
