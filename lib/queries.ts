/**
 * Deterministic metric functions. Each exported query returns rows plus a
 * Definition describing exactly how the rows were computed.
 */
import { getData } from "./data"
import type { Definition } from "./definition"
import type { Hcp, PayerChannel, RxWeek, Territory, Tier } from "./data"

const d = () => getData()

export const CHANNELS: PayerChannel[] = ["Commercial", "Medicaid", "Medicare", "TriCare", "Cash"]
export const TIERS: Exclude<Tier, null>[] = ["Exxua_A", "Exxua_A_Colocated", "Exxua_B", "Exxua_Plus"]
export const tierLabel = (t: Tier) => (t === "Exxua_A" ? "Priority (A)" : t === "Exxua_A_Colocated" ? "Co-located" : t === "Exxua_B" ? "B" : t === "Exxua_Plus" ? "Plus" : "Untargeted")

// ---- indexes (built once) -----------------------------------------------------
let idx: {
  hcpByNpi: Map<string, Hcp>
  terrByCode: Map<string, Territory>
  repById: Map<string, { name: string; role: string }>
  rxByNpi: Map<string, RxWeek[]>
  rxByWeek: Map<number, RxWeek[]>
  firstWriteWeek: Map<string, number>
  inPersonCallsByNpi: Map<string, number[]>
} | null = null

function ix() {
  if (idx) return idx
  const data = d()
  const hcpByNpi = new Map(data.hcps.map((h) => [h.npi, h]))
  const terrByCode = new Map(data.territories.map((t) => [t.code, t]))
  const repById = new Map(data.reps.map((r) => [r.id, { name: r.name, role: r.role }]))
  const rxByNpi = new Map<string, RxWeek[]>()
  const rxByWeek = new Map<number, RxWeek[]>()
  const firstWriteWeek = new Map<string, number>()
  for (const r of data.rx) {
    ;(rxByNpi.get(r.npi) ?? rxByNpi.set(r.npi, []).get(r.npi)!).push(r)
    ;(rxByWeek.get(r.weekIndex) ?? rxByWeek.set(r.weekIndex, []).get(r.weekIndex)!).push(r)
    if (r.exxTrx > 0 && !firstWriteWeek.has(r.npi)) firstWriteWeek.set(r.npi, r.weekIndex)
  }
  const inPersonCallsByNpi = new Map<string, number[]>()
  for (const c of data.calls) {
    if (c.type === "Virtual") continue
    ;(inPersonCallsByNpi.get(c.npi) ?? inPersonCallsByNpi.set(c.npi, []).get(c.npi)!).push(c.weekIndex)
  }
  idx = { hcpByNpi, terrByCode, repById, rxByNpi, rxByWeek, firstWriteWeek, inPersonCallsByNpi }
  return idx
}

export const hcp = (npi: string) => ix().hcpByNpi.get(npi)!
export const territory = (code: string) => ix().terrByCode.get(code)!
export const repName = (id: string | null) => (id ? ix().repById.get(id)?.name ?? "—" : "Vacant")
export const hcpName = (h: Hcp) => `${h.last}, ${h.first}`

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const pctRank = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b)
  return xs.map((x) => sorted.findIndex((v) => v >= x) / Math.max(1, sorted.length - 1))
}

// ---- weekly trend ---------------------------------------------------------------
export type TrendRow = { week: string; weekIndex: number; exxTrx: number; exxNrx: number; starts: number; cont: number; writers: number; newWriters: number; holiday?: string }

export function weeklyTrend(): { rows: TrendRow[]; def: Definition } {
  const data = d()
  const { rxByWeek, firstWriteWeek } = ix()
  const rows: TrendRow[] = []
  for (const w of data.weeks.slice(data.launchWeekIndex)) {
    const rs = rxByWeek.get(w.index) ?? []
    let exx = 0, nrx = 0, starts = 0, cont = 0, writers = 0, nw = 0
    for (const r of rs) {
      exx += r.exxTrx; nrx += r.exxNrx; starts += r.exxStarts; cont += r.exxCont
      if (r.exxTrx > 0) { writers++; if (firstWriteWeek.get(r.npi) === w.index) nw++ }
    }
    rows.push({ week: w.end, weekIndex: w.index, exxTrx: exx, exxNrx: nrx, starts, cont, writers, newWriters: nw, holiday: w.holiday })
  }
  return {
    rows,
    def: {
      title: "Weekly EXXUA fTRx since launch",
      sources: ["rpt_allhcp_sha_rx_weekly"],
      window: `Launch week (w/e ${data.weeks[data.launchWeekIndex].end}) through latest loaded week (w/e ${data.latestWeek.end})`,
      filters: ["All HCPs, including White Space", "Sat–Fri true weeks"],
      formula: "fTRx = SUM(tunits_exx); writers = COUNT DISTINCT npi WHERE tunits_exx > 0; new writers = writers whose first week with tunits_exx > 0 is this week",
    },
  }
}

export function headline() {
  const { rows } = weeklyTrend()
  const data = d()
  const last = rows[rows.length - 1]
  const prev = rows[rows.length - 2]
  const last4 = rows.slice(-4)
  const prior4 = rows.slice(-8, -4)
  const avg4 = sum(last4.map((r) => r.exxTrx)) / 4
  const avgPrior4 = sum(prior4.map((r) => r.exxTrx)) / 4
  const best = rows.reduce((a, b) => (b.exxTrx > a.exxTrx ? b : a))
  const sinceLaunch = sum(rows.map((r) => r.exxTrx))
  const sinceLaunchNrx = sum(rows.map((r) => r.exxNrx))
  const writersEver = new Set(data.rx.filter((r) => r.exxTrx > 0).map((r) => r.npi)).size
  const active4 = new Set(data.rx.filter((r) => r.exxTrx > 0 && r.weekIndex > data.latestWeek.index - 4).map((r) => r.npi)).size
  return { last, prev, wow: last.exxTrx - prev.exxTrx, wowPct: (last.exxTrx - prev.exxTrx) / prev.exxTrx, avg4, avg4Growth: (avg4 - avgPrior4) / avgPrior4, best, sinceLaunch, sinceLaunchNrx, writersEver, active4 }
}

// ---- week-over-week bridge -----------------------------------------------------
export type BridgeBucket = { bucket: string; hcps: number; delta: number; description: string }

export function wowBridge(weekIndex = d().latestWeek.index): { buckets: BridgeBucket[]; movers: { npi: string; name: string; territory: string; prev: number; cur: number; delta: number; bucket: string }[]; def: Definition } {
  const { rxByWeek, firstWriteWeek, hcpByNpi, terrByCode } = ix()
  const cur = new Map((rxByWeek.get(weekIndex) ?? []).map((r) => [r.npi, r.exxTrx]))
  const prev = new Map((rxByWeek.get(weekIndex - 1) ?? []).map((r) => [r.npi, r.exxTrx]))
  const acc: Record<string, { hcps: number; delta: number }> = {}
  const movers: ReturnType<typeof wowBridge>["movers"] = []
  const bump = (b: string, delta: number) => { acc[b] = acc[b] ?? { hcps: 0, delta: 0 }; acc[b].hcps++; acc[b].delta += delta }
  for (const [npi, c] of cur) {
    const p = prev.get(npi) ?? 0
    if (c === p) continue
    const first = firstWriteWeek.get(npi)
    let bucket: string
    if (c > 0 && first === weekIndex) bucket = "New writers"
    else if (c > 0 && p === 0) bucket = "Returning writers"
    else if (c > p) bucket = "Existing writers up"
    else if (c === 0) bucket = "Writers at zero this week"
    else bucket = "Existing writers down"
    bump(bucket, c - p)
    const h = hcpByNpi.get(npi)!
    movers.push({ npi, name: hcpName(h), territory: terrByCode.get(h.territoryCode)!.name, prev: p, cur: c, delta: c - p, bucket })
  }
  const order = ["New writers", "Returning writers", "Existing writers up", "Existing writers down", "Writers at zero this week"]
  const desc: Record<string, string> = {
    "New writers": "First week ever with tunits_exx > 0",
    "Returning writers": "Wrote before, zero last week, > 0 this week",
    "Existing writers up": "Wrote both weeks, higher this week",
    "Existing writers down": "Wrote both weeks, lower this week",
    "Writers at zero this week": "Wrote last week, zero this week",
  }
  const buckets = order.map((b) => ({ bucket: b, hcps: acc[b]?.hcps ?? 0, delta: acc[b]?.delta ?? 0, description: desc[b] }))
  movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return {
    buckets,
    movers,
    def: {
      title: "Week-over-week fTRx bridge",
      sources: ["rpt_allhcp_sha_rx_weekly"],
      window: `w/e ${d().weeks[weekIndex - 1].end} → w/e ${d().weeks[weekIndex].end}`,
      filters: ["HCP-level tunits_exx, all HCPs"],
      formula: "Each HCP's change in tunits_exx is assigned to exactly one bucket; bucket deltas sum to the national week-over-week change",
      notes: ["This answers 'why did fTRx move this week' the same way every week, instead of an ad-hoc narrative."],
    },
  }
}

// ---- writer lifecycle ------------------------------------------------------------
export type WriterSegment = "New" | "Repeat" | "Consistent" | "At risk" | "Lapsed"
export type WriterRow = {
  npi: string; name: string; specialty: string; tier: Tier; territoryCode: string; territory: string; region: string
  firstWeek: number; firstWeekEnd: string; lastWeek: number; weeksWritten: number; last4: number; last13: number; sinceLaunch: number; segment: WriterSegment
  callsBeforeFirst: number; weeksSinceLast: number
}

export function writerLifecycle(asOf = d().latestWeek.index): { rows: WriterRow[]; counts: Record<WriterSegment, number>; def: Definition } {
  const data = d()
  const { rxByNpi, hcpByNpi, terrByCode, inPersonCallsByNpi } = ix()
  const rows: WriterRow[] = []
  for (const [npi, rs] of rxByNpi) {
    const written = rs.filter((r) => r.exxTrx > 0 && r.weekIndex <= asOf)
    if (written.length === 0) continue
    const first = written[0].weekIndex
    const last = written[written.length - 1].weekIndex
    const last4 = written.filter((r) => r.weekIndex > asOf - 4).length
    const last13 = sum(written.filter((r) => r.weekIndex > asOf - 13).map((r) => r.exxTrx))
    const weeksSinceLast = asOf - last
    let segment: WriterSegment
    if (first === asOf) segment = "New"
    else if (weeksSinceLast >= 8) segment = "Lapsed"
    else if (weeksSinceLast >= 4) segment = "At risk"
    else if (last4 >= 3) segment = "Consistent"
    else segment = "Repeat"
    const h = hcpByNpi.get(npi)!
    const t = terrByCode.get(h.territoryCode)!
    rows.push({
      npi, name: hcpName(h), specialty: h.specialty, tier: h.tier, territoryCode: t.code, territory: t.name, region: t.region,
      firstWeek: first, firstWeekEnd: data.weeks[first].end, lastWeek: last, weeksWritten: written.length, last4, last13, sinceLaunch: sum(written.map((r) => r.exxTrx)), segment,
      callsBeforeFirst: (inPersonCallsByNpi.get(npi) ?? []).filter((w) => w < first).length, weeksSinceLast,
    })
  }
  const counts: Record<WriterSegment, number> = { New: 0, Repeat: 0, Consistent: 0, "At risk": 0, Lapsed: 0 }
  for (const r of rows) counts[r.segment]++
  return {
    rows,
    counts,
    def: {
      title: "EXXUA writer lifecycle segments",
      sources: ["rpt_allhcp_sha_rx_weekly", "fct_calls_list"],
      window: `Launch through w/e ${data.weeks[asOf].end}`,
      filters: ["HCPs with at least one week of tunits_exx > 0"],
      formula: "New = first week with tunits_exx > 0 is the as-of week; Lapsed = no tunits_exx in the last 8 weeks; At risk = none in the last 4–7 weeks; Consistent = wrote in ≥3 of the last 4 weeks; Repeat = everyone else",
      notes: ["'Calls before first Rx' counts in-person calls (face-to-face, HCP meal, office visit) in weeks strictly before the first writing week."],
    },
  }
}

export function newWriterReport(weekIndex: number) {
  const data = d()
  const { rxByWeek, firstWriteWeek } = ix()
  const life = writerLifecycle(weekIndex)
  const rows = life.rows
    .filter((r) => r.firstWeek === weekIndex)
    .map((r) => {
      const wk = (rxByWeek.get(weekIndex) ?? []).find((x) => x.npi === r.npi)!
      return { ...r, tunits: wk.exxTrx, starts: wk.exxStarts, channel: (Object.keys(wk.channel) as PayerChannel[]).filter((c) => wk.channel[c] > 0).map((c) => `${c} ${wk.channel[c]}`).join(", ") }
    })
    .sort((a, b) => a.territoryCode.localeCompare(b.territoryCode) || b.tunits - a.tunits)
  void firstWriteWeek
  const def: Definition = {
    title: `New EXXUA prescribers, w/e ${data.weeks[weekIndex].end}`,
    sources: ["rpt_allhcp_sha_rx_weekly", "scd_zipterr", "hcp_targets", "fct_calls_list"],
    window: `Single week ending ${data.weeks[weekIndex].end}; history back to launch for the 'never before' test`,
    filters: ["tunits_exx > 0 in this week", "tunits_exx = 0 in every prior week", "Territory from current ZIP alignment (end_date = current)", "Tier from the target list active this quarter"],
    formula: "One row per NPI; columns fixed: territory number, territory name, region, NPI, HCP, specialty, priority, tunits this week, titration tunits, payer channel of the first-week scripts, in-person calls before this week",
    notes: ["This is the report the sales-ops team asked for by hand every Monday, with the same columns every time."],
  }
  return { rows, def }
}

export function cohortRetention() {
  const data = d()
  const life = writerLifecycle()
  const byMonth = new Map<string, WriterRow[]>()
  for (const r of life.rows) { const m = data.weeks[r.firstWeek].month; (byMonth.get(m) ?? byMonth.set(m, []).get(m)!).push(r) }
  const { rxByNpi } = ix()
  const wroteAgainWithin = (r: WriterRow, weeks: number) => (rxByNpi.get(r.npi) ?? []).some((x) => x.exxTrx > 0 && x.weekIndex > r.firstWeek && x.weekIndex <= r.firstWeek + weeks)
  const rows = [...byMonth.entries()].sort().map(([month, rs]) => {
    const matured = (weeks: number) => rs.filter((r) => r.firstWeek + weeks <= data.latestWeek.index)
    const rate = (weeks: number) => { const m = matured(weeks); return m.length ? m.filter((r) => wroteAgainWithin(r, weeks)).length / m.length : NaN }
    return { month, newWriters: rs.length, within4: rate(4), within8: rate(8), within13: rate(13) }
  })
  const def: Definition = {
    title: "New-writer repeat rate by first-write month",
    sources: ["rpt_allhcp_sha_rx_weekly"],
    window: "Launch through latest loaded week; a cohort only reports a horizon once every member has had that many weeks",
    filters: [],
    formula: "within N = share of the cohort with tunits_exx > 0 in any week 1..N after the first writing week",
  }
  return { rows, def }
}

// ---- territories ---------------------------------------------------------------------
export type TerritoryRow = {
  code: string; name: string; district: string; region: string; state: string; rep: string; vacant: boolean; whiteSpace: boolean
  hcps: number; targets: number; priorityA: number; mktTrx13: number; exxTrx13: number; share13: number; channel13: Record<PayerChannel, number>
  writers13: number; newWriters13: number; calls13: number; targetsCalled13: number; goalQ: number; actualQ: number; attainment: number; zips: number
}

export function territoryScorecard(weeks = 13): { rows: TerritoryRow[]; def: Definition } {
  const data = d()
  const { firstWriteWeek } = ix()
  const asOf = data.latestWeek.index
  const from = asOf - weeks + 1
  const q = data.latestWeek.quarter
  const qWeeks = new Set(data.weeks.filter((w) => w.quarter === q).map((w) => w.index))
  const byT = new Map<string, TerritoryRow>()
  for (const t of data.territories) {
    byT.set(t.code, {
      code: t.code, name: t.name, district: t.district, region: t.region, state: t.state, rep: repName(t.repId), vacant: !t.whiteSpace && !t.repId, whiteSpace: !!t.whiteSpace,
      hcps: 0, targets: 0, priorityA: 0, mktTrx13: 0, exxTrx13: 0, share13: 0, channel13: { Commercial: 0, Medicaid: 0, Medicare: 0, TriCare: 0, Cash: 0 },
      writers13: 0, newWriters13: 0, calls13: 0, targetsCalled13: 0, goalQ: data.goals[t.code]?.[q] ?? 0, actualQ: 0, attainment: 0, zips: t.zips.length,
    })
  }
  const writers = new Map<string, Set<string>>()
  const calledTargets = new Map<string, Set<string>>()
  for (const h of data.hcps) {
    const row = byT.get(h.territoryCode)!
    row.hcps++
    if (h.tier) row.targets++
    if (h.tier === "Exxua_A") row.priorityA++
  }
  for (const r of data.rx) {
    const h = ix().hcpByNpi.get(r.npi)!
    const row = byT.get(h.territoryCode)!
    if (r.weekIndex >= from) {
      row.mktTrx13 += r.mktTrx; row.exxTrx13 += r.exxTrx
      for (const c of CHANNELS) row.channel13[c] += r.channel[c]
      if (r.exxTrx > 0) {
        ;(writers.get(row.code) ?? writers.set(row.code, new Set()).get(row.code)!).add(r.npi)
        if (firstWriteWeek.get(r.npi) === r.weekIndex) row.newWriters13++
      }
    }
    if (qWeeks.has(r.weekIndex)) row.actualQ += r.exxTrx
  }
  for (const c of data.calls) {
    if (c.weekIndex < from) continue
    const h = ix().hcpByNpi.get(c.npi)!
    const row = byT.get(h.territoryCode)!
    row.calls13++
    if (h.tier) (calledTargets.get(row.code) ?? calledTargets.set(row.code, new Set()).get(row.code)!).add(h.npi)
  }
  for (const row of byT.values()) {
    row.writers13 = writers.get(row.code)?.size ?? 0
    row.targetsCalled13 = calledTargets.get(row.code)?.size ?? 0
    row.share13 = row.mktTrx13 ? row.exxTrx13 / row.mktTrx13 : 0
    row.attainment = row.goalQ ? row.actualQ / row.goalQ : NaN
  }
  const rows = [...byT.values()].sort((a, b) => (a.whiteSpace ? 1 : 0) - (b.whiteSpace ? 1 : 0) || b.exxTrx13 - a.exxTrx13)
  return {
    rows,
    def: {
      title: `Territory scorecard, trailing ${weeks} weeks`,
      sources: ["rpt_allhcp_sha_rx_weekly", "scd_zipterr", "sales_rep_roster", "hcp_targets", "fct_calls_list"],
      window: `${weeks} weeks ending w/e ${data.latestWeek.end}; goal attainment is quarter-to-date for ${q}`,
      filters: ["Current alignment only (scd_zipterr.end_date = current)", "Active roster rows only", "White Space shown as its own row, never mixed into a territory"],
      formula: "MDD market TRx = SUM(trx_exx_mkt_total); EXXUA fTRx = SUM(tunits_exx); share = fTRx / market TRx; payer split from the claim payment type; target coverage = targets with ≥1 call / targets",
    },
  }
}

export function zipLookup(zip: string) {
  const data = d()
  const t = data.territories.find((x) => x.zips.includes(zip))
  if (!t) return null
  const hcps = data.hcps.filter((h) => h.zip === zip)
  return { territory: t, rep: repName(t.repId), hcps }
}

export function territoryTrend(code: string) {
  const data = d()
  const npis = new Set(data.hcps.filter((h) => h.territoryCode === code).map((h) => h.npi))
  const byWeek = new Map<number, { exx: number; mkt: number }>()
  for (const r of data.rx) {
    if (!npis.has(r.npi) || r.weekIndex < data.launchWeekIndex) continue
    const v = byWeek.get(r.weekIndex) ?? { exx: 0, mkt: 0 }
    v.exx += r.exxTrx; v.mkt += r.mktTrx
    byWeek.set(r.weekIndex, v)
  }
  return data.weeks.slice(data.launchWeekIndex).map((w) => ({ week: w.end, exxTrx: byWeek.get(w.index)?.exx ?? 0, mktTrx: byWeek.get(w.index)?.mkt ?? 0 }))
}

export function territoryTopHcps(code: string, n = 10) {
  const data = d()
  const from = data.latestWeek.index - 12
  const acc = new Map<string, { exx: number; mkt: number }>()
  for (const r of data.rx) {
    if (r.weekIndex < from) continue
    const h = ix().hcpByNpi.get(r.npi)!
    if (h.territoryCode !== code) continue
    const v = acc.get(r.npi) ?? { exx: 0, mkt: 0 }
    v.exx += r.exxTrx; v.mkt += r.mktTrx
    acc.set(r.npi, v)
  }
  return [...acc.entries()].map(([npi, v]) => ({ npi, name: hcpName(hcp(npi)), specialty: hcp(npi).specialty, tier: hcp(npi).tier, ...v })).sort((a, b) => b.exx - a.exx || b.mkt - a.mkt).slice(0, n)
}

// ---- HCP opportunity ----------------------------------------------------------------------
export type Quadrant = "Grow" | "Defend" | "Convert" | "Deprioritize"
export type OpportunityRow = {
  npi: string; name: string; specialty: string; tier: Tier; territoryCode: string; territory: string; whiteSpace: boolean; state: string; city: string
  exx13: number; mkt13: number; branded13: number; buspirone13: number; auvelity13: number; share13: number
  potential: number; current: number; quadrant: Quadrant; status: "Writer" | "Lapsed writer" | "Non-writer"
  calls13: number; weeksSinceCall: number | null; emailsOpened13: number; action: string; reason: string
}

export function hcpOpportunity(): { rows: OpportunityRow[]; medians: { potential: number; current: number }; def: Definition } {
  const data = d()
  const asOf = data.latestWeek.index
  const from = asOf - 12
  const acc = new Map<string, { exx: number; mkt: number; br: number; bu: number; au: number }>()
  for (const r of data.rx) {
    if (r.weekIndex < from) continue
    const v = acc.get(r.npi) ?? { exx: 0, mkt: 0, br: 0, bu: 0, au: 0 }
    v.exx += r.exxTrx; v.mkt += r.mktTrx; v.br += r.mktBranded; v.bu += r.buspirone; v.au += r.auvelity
    acc.set(r.npi, v)
  }
  const calls13 = new Map<string, number>()
  const lastCall = new Map<string, number>()
  for (const c of data.calls) {
    lastCall.set(c.npi, Math.max(lastCall.get(c.npi) ?? -1, c.weekIndex))
    if (c.weekIndex >= from) calls13.set(c.npi, (calls13.get(c.npi) ?? 0) + 1)
  }
  const opened13 = new Map<string, number>()
  for (const e of data.emails) if (e.opened && e.weekIndex >= from) opened13.set(e.npi, (opened13.get(e.npi) ?? 0) + 1)
  const life = writerLifecycle()
  const seg = new Map(life.rows.map((r) => [r.npi, r.segment]))

  const hcps = data.hcps
  const mkt = hcps.map((h) => acc.get(h.npi)!.mkt)
  const br = hcps.map((h) => acc.get(h.npi)!.br)
  const bu = hcps.map((h) => acc.get(h.npi)!.bu)
  const au = hcps.map((h) => acc.get(h.npi)!.au)
  const pr = { mkt: pctRank(mkt), br: pctRank(br), bu: pctRank(bu), au: pctRank(au) }
  const potentials = hcps.map((_, i) => 0.5 * pr.mkt[i] + 0.25 * pr.br[i] + 0.15 * pr.bu[i] + 0.1 * pr.au[i])
  const currents = hcps.map((h) => acc.get(h.npi)!.exx)
  const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }
  const medPot = median(potentials)
  const medCur = Math.max(1, median(currents.filter((x) => x > 0)))

  const rows: OpportunityRow[] = hcps.map((h, i) => {
    const v = acc.get(h.npi)!
    const t = territory(h.territoryCode)
    const s = seg.get(h.npi)
    const status = s === undefined ? "Non-writer" : s === "Lapsed" || s === "At risk" ? "Lapsed writer" : "Writer"
    const potential = potentials[i]
    const current = v.exx
    const hiPot = potential >= medPot
    const hiCur = current >= medCur
    const quadrant: Quadrant = hiPot && hiCur ? "Grow" : !hiPot && hiCur ? "Defend" : hiPot && !hiCur ? "Convert" : "Deprioritize"
    const lc = lastCall.get(h.npi)
    const weeksSinceCall = lc === undefined ? null : asOf - lc
    const c13 = calls13.get(h.npi) ?? 0
    let action: string, reason: string
    if (t.whiteSpace && hiPot) { action = "Flag for alignment review"; reason = "High-potential HCP sits in White Space; no rep can call" }
    else if (quadrant === "Convert" && c13 === 0) { action = "Schedule first call"; reason = `Top-half market volume (${v.mkt} MDD TRx / 13 wk), no EXXUA, zero calls in 13 weeks` }
    else if (quadrant === "Convert" && status === "Lapsed writer") { action = "Re-engage lapsed writer"; reason = `Wrote EXXUA before, none in ${s === "Lapsed" ? "8+" : "4–7"} weeks; market volume still high` }
    else if (quadrant === "Convert") { action = "Add copay/titration detail"; reason = `Called ${c13}× in 13 weeks but no EXXUA; ${v.bu > 0 ? "buspirone writer" : "branded writer"} profile matches current EXXUA writers` }
    else if (quadrant === "Grow") { action = "Maintain frequency"; reason = `Writing ${v.exx} fTRx / 13 wk with share ${((v.exx / Math.max(1, v.mkt)) * 100).toFixed(1)}% of a large market` }
    else if (quadrant === "Defend") { action = "Protect: check access"; reason = "Writing EXXUA but small total market; watch for lapse" }
    else { action = "Deprioritize"; reason = "Bottom-half market volume and no EXXUA activity" }
    return {
      npi: h.npi, name: hcpName(h), specialty: h.specialty, tier: h.tier, territoryCode: t.code, territory: t.name, whiteSpace: !!t.whiteSpace, state: h.state, city: h.city,
      exx13: v.exx, mkt13: v.mkt, branded13: v.br, buspirone13: v.bu, auvelity13: v.au, share13: v.mkt ? v.exx / v.mkt : 0,
      potential, current, quadrant, status, calls13: c13, weeksSinceCall, emailsOpened13: opened13.get(h.npi) ?? 0, action, reason,
    }
  })
  rows.sort((a, b) => b.potential - a.potential)
  return {
    rows,
    medians: { potential: medPot, current: medCur },
    def: {
      title: "HCP opportunity score and quadrant",
      sources: ["rpt_allhcp_sha_rx_weekly", "fct_calls_list", "fct_emails", "scd_zipterr", "hcp_targets"],
      window: `Trailing 13 weeks ending w/e ${data.latestWeek.end}`,
      filters: ["All HCPs in the HCP master, including White Space"],
      formula: "Potential = 0.50·pct-rank(MDD market TRx) + 0.25·pct-rank(branded MDD TRx) + 0.15·pct-rank(buspirone TRx) + 0.10·pct-rank(Auvelity TRx). Current = EXXUA fTRx. Quadrants split at the median potential and the median non-zero fTRx.",
      notes: [
        "The weights are a starting point, deliberately simple and visible; the chat users asked for this correlation-based look-alike list at least six different ways and got a different answer each time.",
        "Next-best-action is rule-based text, not a model, so a rep can read exactly why an HCP is on the list.",
      ],
    },
  }
}

// ---- engagement → Rx -------------------------------------------------------------------------
export function targetCoverage(quarter = d().latestWeek.quarter) {
  const data = d()
  const weeks = new Set(data.weeks.filter((w) => w.quarter === quarter).map((w) => w.index))
  const calledBy = new Map<string, number>()
  for (const c of data.calls) if (weeks.has(c.weekIndex)) calledBy.set(c.npi, (calledBy.get(c.npi) ?? 0) + 1)
  const wrote = new Set(data.rx.filter((r) => weeks.has(r.weekIndex) && r.exxTrx > 0).map((r) => r.npi))
  const rows = [...TIERS, null].map((tier) => {
    const hs = data.hcps.filter((h) => h.tier === tier && h.territoryCode !== "N999999")
    const called = hs.filter((h) => calledBy.has(h.npi))
    return {
      tier, label: tierLabel(tier), hcps: hs.length, called: called.length, uncalled: hs.length - called.length,
      avgCalls: called.length ? sum(called.map((h) => calledBy.get(h.npi)!)) / called.length : 0,
      wrote: hs.filter((h) => wrote.has(h.npi)).length, wroteCalled: called.filter((h) => wrote.has(h.npi)).length,
      wroteUncalled: hs.filter((h) => !calledBy.has(h.npi) && wrote.has(h.npi)).length,
    }
  })
  const uncalledPriority = data.hcps.filter((h) => h.tier === "Exxua_A" && !calledBy.has(h.npi)).map((h) => ({ npi: h.npi, name: hcpName(h), specialty: h.specialty, territory: territory(h.territoryCode).name, rep: repName(territory(h.territoryCode).repId), city: h.city, state: h.state }))
  const def: Definition = {
    title: `Target coverage, ${quarter}`,
    sources: ["hcp_targets", "fct_calls_list", "rpt_allhcp_sha_rx_weekly"],
    window: `Calendar ${quarter}`,
    filters: ["Targets from the list active this quarter", "White Space excluded (no rep to call)", "All call types count as a call"],
    formula: "called = COUNT DISTINCT npi with ≥1 call in the quarter; wrote = tunits_exx > 0 in any week of the quarter",
  }
  return { rows, uncalledPriority, def }
}

export function callsBeforeFirstRx() {
  const life = writerLifecycle()
  const bins = ["0", "1", "2", "3", "4", "5", "6+"]
  const counts = bins.map(() => 0)
  for (const r of life.rows) counts[Math.min(6, r.callsBeforeFirst)]++
  const { inPersonCallsByNpi } = ix()
  const writers = new Set(life.rows.map((r) => r.npi))
  const calledNeverWrote = [...inPersonCallsByNpi.keys()].filter((npi) => !writers.has(npi)).length
  const def: Definition = {
    title: "In-person calls before first EXXUA Rx",
    sources: ["fct_calls_list", "rpt_allhcp_sha_rx_weekly"],
    window: "Launch through latest loaded week",
    filters: ["In-person = Face-to-face with HCP, HCP Meal, Office Visit (no prescriber contact)", "Calls in weeks strictly before the first week with tunits_exx > 0"],
    formula: "One writer per row; histogram of the count of qualifying calls",
  }
  return { rows: bins.map((b, i) => ({ calls: b, writers: counts[i] })), calledNeverWrote, def }
}

export function callEmailLift() {
  const data = d()
  const inPerson = new Set(data.calls.filter((c) => c.type !== "Virtual").map((c) => c.npi))
  const opened = new Set(data.emails.filter((e) => e.opened).map((e) => e.npi))
  const writers = new Set(ix().firstWriteWeek.keys())
  const groups = [
    { group: "In-person call + opened email", npis: [...inPerson].filter((n) => opened.has(n)) },
    { group: "In-person call only", npis: [...inPerson].filter((n) => !opened.has(n)) },
    { group: "Opened email only", npis: [...opened].filter((n) => !inPerson.has(n)) },
    { group: "Neither", npis: data.hcps.map((h) => h.npi).filter((n) => !inPerson.has(n) && !opened.has(n)) },
  ]
  const rows = groups.map((g) => ({ group: g.group, hcps: g.npis.length, writers: g.npis.filter((n) => writers.has(n)).length, rate: g.npis.length ? g.npis.filter((n) => writers.has(n)).length / g.npis.length : 0 }))
  const def: Definition = {
    title: "Writer rate by promotional exposure",
    sources: ["fct_calls_list", "fct_emails", "rpt_allhcp_sha_rx_weekly"],
    window: "Launch through latest loaded week",
    filters: ["Exposure is any-time, not sequenced before the first Rx"],
    formula: "rate = writers / HCPs in the exposure group",
    notes: ["Descriptive, not causal. Reps call likely writers more, so the lift is an upper bound."],
  }
  return { rows, def }
}

export function eventPrePost(entries: { npi: string; date: string }[], horizon = 8) {
  const data = d()
  const { rxByNpi, hcpByNpi } = ix()
  const rows = entries.map((e) => {
    const h = hcpByNpi.get(e.npi)
    const wk = data.weeks.findIndex((w) => w.end >= e.date)
    if (!h || wk < 0) return { npi: e.npi, name: h ? hcpName(h) : "not in HCP master", date: e.date, pre: NaN, post: NaN, delta: NaN, firstCallAfterDays: null as number | null, found: false }
    const rs = rxByNpi.get(e.npi) ?? []
    const pre = sum(rs.filter((r) => r.weekIndex < wk && r.weekIndex >= wk - horizon).map((r) => r.exxTrx))
    const post = sum(rs.filter((r) => r.weekIndex >= wk && r.weekIndex < wk + horizon).map((r) => r.exxTrx))
    const after = data.calls.filter((c) => c.npi === e.npi && c.date >= e.date).sort((a, b) => a.date.localeCompare(b.date))[0]
    const firstCallAfterDays = after ? Math.round((Date.parse(after.date) - Date.parse(e.date)) / 86400000) : null
    return { npi: e.npi, name: hcpName(h), date: e.date, pre, post, delta: post - pre, firstCallAfterDays, found: true }
  })
  const def: Definition = {
    title: `Speaker program pre/post, ±${horizon} weeks`,
    sources: ["rpt_allhcp_sha_rx_weekly", "fct_calls_list"],
    window: `${horizon} true weeks before the program week vs the program week plus ${horizon - 1} after`,
    filters: ["Program week = the Sat–Fri week containing the program date"],
    formula: "pre = SUM(tunits_exx) in the pre window; post = SUM in the post window; first call after = days from program date to the first CRM call on/after it",
  }
  return { rows, def }
}

// ---- payers & copay ---------------------------------------------------------------------------
export type WindowKey = "latestWeek" | "latestMonth" | "trailing12m" | "sinceLaunch"
export const WINDOW_LABEL: Record<WindowKey, string> = { latestWeek: "Latest true week", latestMonth: "Latest full month", trailing12m: "Trailing 12 months", sinceLaunch: "Since launch" }

function windowWeeks(key: WindowKey): Set<number> {
  const data = d()
  const w = data.weeks
  const latest = data.latestWeek
  if (key === "latestWeek") return new Set([latest.index])
  if (key === "latestMonth") {
    // latest month with a full set of weeks
    const months = [...new Set(w.map((x) => x.month))]
    const lastFull = months[months.length - 1] === latest.month && w.filter((x) => x.month === latest.month).length < 4 ? months[months.length - 2] : months[months.length - 1]
    return new Set(w.filter((x) => x.month === lastFull).map((x) => x.index))
  }
  if (key === "trailing12m") return new Set(w.filter((x) => x.index > latest.index - 52).map((x) => x.index))
  return new Set(w.filter((x) => x.index >= data.launchWeekIndex).map((x) => x.index))
}

export function channelSplit(key: WindowKey) {
  const data = d()
  const weeks = windowWeeks(key)
  const acc: Record<PayerChannel, { trx: number; starts: number; cont: number; nrx: number }> = Object.fromEntries(CHANNELS.map((c) => [c, { trx: 0, starts: 0, cont: 0, nrx: 0 }])) as never
  for (const r of data.rx) {
    if (!weeks.has(r.weekIndex) || r.exxTrx === 0) continue
    for (const c of CHANNELS) {
      const n = r.channel[c]
      if (!n) continue
      const f = n / r.exxTrx
      acc[c].trx += n; acc[c].starts += r.exxStarts * f; acc[c].cont += r.exxCont * f; acc[c].nrx += r.exxNrx * f
    }
  }
  const total = sum(CHANNELS.map((c) => acc[c].trx))
  const rows = CHANNELS.map((c) => ({ channel: c, trx: acc[c].trx, share: total ? acc[c].trx / total : 0, starts: Math.round(acc[c].starts), cont: Math.round(acc[c].cont), nrx: Math.round(acc[c].nrx) }))
  const ws = [...weeks].sort((a, b) => a - b)
  const def: Definition = {
    title: `EXXUA fTRx by payer channel — ${WINDOW_LABEL[key]}`,
    sources: ["rpt_allhcp_sha_rx_weekly"],
    window: `w/e ${data.weeks[ws[0]].end} through w/e ${data.weeks[ws[ws.length - 1]].end} (${ws.length} weeks)`,
    filters: ["Payment type collapsed to Commercial / Medicaid / Medicare / TriCare / Cash"],
    formula: "starts = titration-pack tunits; continuing = all other tunits; NRx allocated to channels pro rata within each HCP-week",
  }
  return { rows, total, def }
}

export function medicaidPlanPivot(weeks = 12) {
  const data = d()
  const cols = data.weeks.slice(-weeks)
  const rows = data.medicaidPlans
    .map((p) => {
      const cells = cols.map((w) => data.medicaidPlanRx[p.id][w.index] ?? 0)
      return { plan: p.name, mco: p.mco, state: p.state, cells, total: sum(cells) }
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
  const def: Definition = {
    title: `Medicaid / Managed Medicaid plans × week, EXXUA TRx`,
    sources: ["fct_sha_prescriber_rx_weekly", "dim_managed_care"],
    window: `Last ${weeks} weeks ending w/e ${data.latestWeek.end}`,
    filters: ["payment_type IN (Medicaid, Managed Medicaid)", "Plans with zero volume in the window hidden"],
    formula: "Plans as rows, week ending dates as columns, EXXUA TRx in the cells, sorted by window total",
    notes: ["This exact layout was requested three times in chat with slightly different wording."],
  }
  return { cols: cols.map((c) => c.end), rows, def }
}

export function copaySummary() {
  const data = d()
  const claims = data.copay
  const net = claims.filter((c) => !c.reversal)
  const reversals = claims.length - net.length
  const network = net.filter((c) => c.network).length
  const patients = new Set(net.map((c) => c.memberId)).size
  const multiFill = [...net.reduce((m, c) => m.set(c.memberId, (m.get(c.memberId) ?? 0) + 1), new Map<string, number>()).values()].filter((n) => n > 1).length
  const byPharmacy = new Map<string, { claims: number; copay: number; network: boolean; oop: number }>()
  for (const c of net) {
    const v = byPharmacy.get(c.pharmacy) ?? { claims: 0, copay: 0, network: c.network, oop: 0 }
    v.claims++; v.copay += c.copay; v.oop += c.oop
    byPharmacy.set(c.pharmacy, v)
  }
  const pharmacies = [...byPharmacy.entries()].map(([pharmacy, v]) => ({ pharmacy, network: v.network, claims: v.claims, blended: v.copay / v.claims, avgOop: v.oop / v.claims, spend: v.copay })).sort((a, b) => b.claims - a.claims)
  const weekly = data.weeks.slice(data.launchWeekIndex).map((w) => ({ week: w.end, net: net.filter((c) => c.weekIndex === w.index).length, reversals: claims.filter((c) => c.weekIndex === w.index && c.reversal).length }))
  const titration = net.filter((c) => c.product === "EXXUA T").length
  const def: Definition = {
    title: "EXXUA copay program summary",
    sources: ["rpt_copay_detail_bc"],
    window: `Program start through ${data.freshness[1].asOf}`,
    filters: ["Net of reversals unless labelled otherwise", "Network = is_exxua_network_pharmacy = 1", "Patients counted on claim_broad_member_id"],
    formula: "blended copay rate = program copay $ / non-reversed transactions per pharmacy",
  }
  return { totals: { claims: claims.length, net: net.length, reversals, network, networkShare: network / net.length, patients, multiFill, titration, spend: sum(net.map((c) => c.copay)), avgOop: sum(net.map((c) => c.oop)) / net.length }, pharmacies, weekly, def }
}

/** Number of Sat–Fri true weeks (Friday week-ends) that fall inside a calendar quarter. */
function fridaysInQuarter(q: string) {
  const [y, qq] = q.split("-Q").map(Number)
  const start = Date.UTC(y, (qq - 1) * 3, 1)
  const end = Date.UTC(y, qq * 3, 0)
  let n = 0
  for (let t = start; t <= end; t += 86400000) if (new Date(t).getUTCDay() === 5) n++
  return n
}

// ---- goals -----------------------------------------------------------------------------------------
export function goalAttainment() {
  const sc = territoryScorecard()
  const rows = sc.rows.filter((r) => !r.whiteSpace).map((r) => ({ code: r.code, name: r.name, rep: r.rep, region: r.region, goal: r.goalQ, actual: r.actualQ, gap: r.goalQ - r.actualQ, attainment: r.attainment })).sort((a, b) => b.attainment - a.attainment)
  const data = d()
  const q = data.latestWeek.quarter
  const elapsed = data.weeks.filter((w) => w.quarter === q && w.index <= data.latestWeek.index).length
  const total = fridaysInQuarter(q)
  const def: Definition = {
    title: `Goal attainment, ${q} quarter-to-date`,
    sources: ["rpt_allhcp_sha_rx_weekly", "sales_goals (new — does not exist yet)"],
    window: `${elapsed} of ${total} true weeks elapsed`,
    filters: ["Field territories only"],
    formula: "attainment = QTD fTRx / quarterly goal; pace = elapsed weeks / weeks in quarter",
    notes: ["Goals are synthetic here. In production this needs a goals table the platform does not have today — that is the product ask."],
  }
  return { rows, elapsed, total, def }
}
