export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US")
export const fmtPct = (n: number, digits = 1) => (Number.isFinite(n) ? `${(n * 100).toFixed(digits)}%` : "—")
export const fmtDelta = (n: number) => (n > 0 ? `+${fmtInt(n)}` : fmtInt(n))
export const fmtDeltaPct = (n: number) => (Number.isFinite(n) ? `${n > 0 ? "+" : ""}${(n * 100).toFixed(1)}%` : "—")
export const fmtUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}
export const fmtWeek = (iso: string) => `w/e ${iso.slice(5).replace("-", "/")}`
export const fmtMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" })
}
