/** The 20 categories from PLAiTO_Sales_Prompt_Taxonomy.xlsx with prompt counts (rows in the sheet). */
export type TaxonomyRow = { category: string; prompts: number; asked: boolean; tool: string | null }

export const TAXONOMY: TaxonomyRow[] = [
  { category: "Market & Competitive Intelligence", prompts: 335, asked: true, tool: "/opportunities" },
  { category: "Rx Performance & Trends", prompts: 194, asked: true, tool: "/pulse" },
  { category: "Territory & Rep Performance", prompts: 166, asked: true, tool: "/territories" },
  { category: "HCP Targeting & White Space", prompts: 147, asked: true, tool: "/opportunities" },
  { category: "Patient Support & Pharmacy", prompts: 105, asked: true, tool: "/payers" },
  { category: "Payer, Access & Channel", prompts: 101, asked: true, tool: "/payers" },
  { category: "Call Activity & Field Engagement", prompts: 92, asked: true, tool: "/engagement" },
  { category: "Patient-Level & Rx Journey", prompts: 70, asked: true, tool: null },
  { category: "HCP / Prescriber Analysis", prompts: 65, asked: true, tool: "/writers" },
  { category: "Digital & Omnichannel Engagement", prompts: 63, asked: true, tool: "/engagement" },
  { category: "Promotional Effectiveness", prompts: 24, asked: true, tool: "/engagement" },
  { category: "Data, Reporting & Methodology", prompts: 20, asked: true, tool: "every page (Definition drawer + freshness)" },
  { category: "Forecasting & Planning", prompts: 3, asked: true, tool: null },
  { category: "Sales Goal & Attainment", prompts: 50, asked: false, tool: "/goals" },
  { category: "Opportunity & Next-Best-Action", prompts: 50, asked: false, tool: "/opportunities" },
  { category: "Launch Performance & Readiness", prompts: 50, asked: false, tool: "/pulse" },
  { category: "HCP Segmentation & Prioritization", prompts: 50, asked: false, tool: "/opportunities" },
  { category: "HCP Adoption, Retention & Lapse", prompts: 50, asked: false, tool: "/writers" },
  { category: "Business Drivers & Anomaly Detection", prompts: 50, asked: false, tool: "/pulse" },
  { category: "Account / Health System Performance", prompts: 50, asked: false, tool: null },
]

export type Idea = {
  name: string
  href: string | null
  status: "Prototyped" | "Proposed" | "Cross-cutting"
  problem: string
  quotes: string[]
  tool: string
  categories: string[]
}

export const IDEAS: Idea[] = [
  {
    name: "Launch Pulse with a week-over-week bridge",
    href: "/pulse",
    status: "Prototyped",
    problem: "The most common prompts are the simplest — how did we do last week, what is fTRx since launch, which week was best — and the follow-up is always 'why'. Each answer today is a fresh SQL guess with a fresh narrative.",
    quotes: ["how did we do last week", "which week was our best ever for exxua ftrx", "What is the most recent week of Rx data available?", "Why did EXXUA prescriptions decline this week?"],
    tool: "Fixed KPI tiles, the weekly trend, and a deterministic bridge that assigns every HCP's change to one of five buckets (new, returning, up, down, went to zero) so the buckets always sum to the national change. Data freshness per source is on the page.",
    categories: ["Rx Performance & Trends", "Launch Performance & Readiness", "Business Drivers & Anomaly Detection", "Data, Reporting & Methodology"],
  },
  {
    name: "Writer Lifecycle and the Monday new-writer report",
    href: "/writers",
    status: "Prototyped",
    problem: "One user asked for the same 'new prescribers for week ending X' table with the same nine columns at least eight times, correcting the definition (tunits, not TRx; territory from current alignment) along the way. The unasked categories want retention and lapse, which are the same data.",
    quotes: ["Provide a listing of new prescribers of EXXUA for the week ending 3/6/26 … defined purely on TRx units (tunits)", "How many HCPs have written EXXUA in 10 or more separate weeks?", "Which new writers have not written a second prescription?"],
    tool: "Five lifecycle segments with printed rules, a week picker that renders the exact report with export, and a cohort table showing what share of each month's new writers wrote again within 4/8/13 weeks.",
    categories: ["HCP / Prescriber Analysis", "HCP Adoption, Retention & Lapse"],
  },
  {
    name: "Territory Scorecard with ZIP lookup",
    href: "/territories",
    status: "Prototyped",
    problem: "Alignment questions dominate the territory category: how many active territories, which territory owns this ZIP, who is the rep, and a 13-week market TRx table with payer splits that was refined over six successive prompts.",
    quotes: ["Can you tell me where zip 43215 is aligned?", "Provide 13 week MDD Market TRx, Commercial TRx, Medicare TRx, Medicaid TRx, Medicaid Branded TRx, Medicaid Generic TRx, Tricare TRx, Medicaid EXXUA fTRx by territory number", "How many active territories do we have?"],
    tool: "One scorecard row per territory (White Space kept separate), the exact payer-split columns, coverage and QTD attainment, a click-through detail sheet, and a ZIP box that reads the current alignment row and says 'not aligned' rather than guessing.",
    categories: ["Territory & Rep Performance"],
  },
  {
    name: "HCP Opportunity quadrants with a visible score",
    href: "/opportunities",
    status: "Prototyped",
    problem: "The biggest category by volume. Users asked six different ways for a white-space look-alike list built from the 'characteristics of current writers', and repeatedly whether buspirone or Auvelity writers are more likely to adopt. Every run produced a different model and a different list.",
    quotes: ["identify non-EXXUA writers in white space that may have a higher likelihood of prescribing EXXUA", "Is there a corrrelation between our top writers and their Buspar volume?", "Which 10 HCPs should I prioritize this week and why?"],
    tool: "A four-term weighted percentile score printed on the page, four quadrants split at medians, and a rule-based next-best-action with the reason in plain text. Filters for territory, White Space and 'zero calls in 13 weeks'. Export is a call list.",
    categories: ["HCP Targeting & White Space", "Market & Competitive Intelligence", "HCP Segmentation & Prioritization", "Opportunity & Next-Best-Action"],
  },
  {
    name: "Engagement → Rx",
    href: "/engagement",
    status: "Prototyped",
    problem: "Did the field reach the targets, how many in-person calls precede a first Rx, does call + email beat call alone, and a recurring pre/post analysis for speaker programs where the NPI list is pasted into the chat box.",
    quotes: ["How many current Priority (Exxua_A) targets received zero EXXUA calls in Q2 2026?", "number of calls prior to the 1st EXXUA fTRx being written", "Here are the NPIs and speaker program dates. I will provide instructions once you confirm your ability to read in the data."],
    tool: "Coverage by tier per quarter with an exportable uncalled-Priority list, the calls-before-first-Rx histogram, an exposure-group writer-rate table, and a paste box for NPI + date that runs the same ±8-week pre/post every time.",
    categories: ["Call Activity & Field Engagement", "Promotional Effectiveness", "Digital & Omnichannel Engagement"],
  },
  {
    name: "Payers & Copay",
    href: "/payers",
    status: "Prototyped",
    problem: "Channel mix (Commercial / Medicaid / Medicare / TriCare) with starts vs continuing was asked for four windows in a row; the Medicaid 'plans as rows, weeks as columns' pivot was requested three times; copay questions revolve around network share, blended rate and net-of-reversals.",
    quotes: ["Break down EXXUA TRx and NRx by payer channel … in the latest true week, splitting starts versus continuing", "plans should be listed in the first column with the weeks going across the top", "which exxua network pharmacy has the lowest blended copay rate"],
    tool: "A window switcher over one channel definition, the plan × week heat table, and copay KPIs plus a pharmacy table with blended rate — all net of reversals by default and labelled as such.",
    categories: ["Payer, Access & Channel", "Patient Support & Pharmacy"],
  },
  {
    name: "Goal Attainment",
    href: "/goals",
    status: "Prototyped",
    problem: "Never asked in production because the platform has no goals table, so the chat agent cannot answer 'how am I tracking against goal'. The 50 synthetic prompts in the taxonomy are all variations of the same table.",
    quotes: ["Show actual sales, goal, and variance for each territory.", "Which territories are currently below 80% of goal?", "How many additional EXXUA prescriptions does each territory need to reach goal?"],
    tool: "A QTD attainment table with gap-to-goal and a pace marker. The product ask hiding behind this page is a goals upload in the admin console.",
    categories: ["Sales Goal & Attainment"],
  },
  {
    name: "Definition drawer and data freshness on every number",
    href: null,
    status: "Cross-cutting",
    problem: "Across all categories users ask 'which table', 'what date range', 'is that net of reversals', and 'what is the most recent week' after receiving an answer — and push back when a number looks wrong. The Data & Methodology category is entirely this.",
    quotes: ["What exact table stores the TRx data? … can you advise to the 3 month period represented?", "Can you provide the actual sql code being used? The numbers are incorrect.", "Can you tell me the most recent week used for this analysis?"],
    tool: "Every tile and table carries a Definition (sources, window, filters, formula, caveats) and a 'copy as PLAiTO prompt' so the chat agent starts from the tool's definition when the user wants to go further. Freshness per source is a first-class panel.",
    categories: ["Data, Reporting & Methodology"],
  },
  {
    name: "Account / health-system roll-up",
    href: null,
    status: "Proposed",
    problem: "Unasked so far, but 50 taxonomy prompts want accounts ranked by EXXUA volume, writers added/lost in 90 days, and share vs market volume. The HCP master carries an account id, so this is the territory scorecard grouped differently.",
    quotes: ["Which accounts have high market volume but low EXXUA share?", "Which health systems have added new EXXUA prescribers in the last 90 days?"],
    tool: "Reuse the scorecard and lifecycle queries keyed on account instead of territory; add an account detail sheet listing its writers and their segments.",
    categories: ["Account / Health System Performance"],
  },
  {
    name: "Patient journey and switching",
    href: null,
    status: "Proposed",
    problem: "Seventy asked prompts on Symphony patient data — new-to-brand, switching, concomitant therapy, multiple fills per patient — and the definitions are subtle (broad member id, net of reversals). A chat answer is easy to get wrong without noticing.",
    quotes: ["can you show me the patients that have had multiple fills of any exxua NDC based on broad member ID field?", "Which products do switching MDD patients most often switch FROM?"],
    tool: "A journey funnel (new to market → new to product → second fill → continuing) with a switch-from/switch-to matrix, patient counts on the documented id, and no patient-level export.",
    categories: ["Patient-Level & Rx Journey"],
  },
  {
    name: "Saved report templates and scheduled delivery",
    href: null,
    status: "Proposed",
    problem: "The recurring column-spec tables ('please add back the original weekly columns', 'can I print this', 'help me set up the dashboard') are users asking for a report they can rerun, not a conversation.",
    quotes: ["Yes, please add back the original weekly columns to the table. Thanks!", "can i print this?", "help me set up the dashboard"],
    tool: "Let a user save any tool view with its parameters as a named report, export XLSX, and schedule Monday delivery by email. The report carries its Definition in a footer.",
    categories: ["Rx Performance & Trends", "Territory & Rep Performance", "Data, Reporting & Methodology"],
  },
  {
    name: "Forecast band on the launch curve",
    href: null,
    status: "Proposed",
    problem: "Only one forecasting prompt so far, but it was detailed (current footprint plus eight new territories from 8/1, conservative/base/aggressive). This is a model, not a query, and belongs in code with stated assumptions.",
    quotes: ["can you project EXXUA fTRx by week through the end of 2026 with conservative, base, and aggressive case scenarios"],
    tool: "A projection overlay on Launch Pulse driven by per-territory ramp curves and a territory-add schedule the user edits, with the assumptions printed next to the chart.",
    categories: ["Forecasting & Planning", "Launch Performance & Readiness"],
  },
]
