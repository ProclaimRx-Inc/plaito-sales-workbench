# PLAiTO Sales Workbench (prototype)

Deterministic, code-based sales tools distilled from the questions Aytu's production users have asked PLAiTO chat. Each page fixes one recurring report's definition in code, prints that definition next to every number, and gives the user an export — so the answer is the same every time and does not depend on an LLM rediscovering the SQL.

**Everything here runs on a seeded synthetic dataset.** No real HCP, patient, rep, payer or Aytu data is present. The numbers are plausible, not true.

Stack mirrors [noclaim-demo](https://github.com/ProclaimRx-Inc/noclaim-demo): **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind v4**, **shadcn/ui** primitives, **recharts**. No auth and no backend — the whole thing is static and deploys on the Vercel Hobby tier.

## Pages

| Route | Tool | Taxonomy categories it absorbs |
|---|---|---|
| `/pulse` | Launch Pulse — KPIs, weekly trend, week-over-week bridge, data freshness | Rx Performance & Trends · Launch Performance · Business Drivers & Anomaly Detection |
| `/writers` | Writer Lifecycle — segments, the Monday new-writer report, cohort repeat rates | HCP / Prescriber Analysis · HCP Adoption, Retention & Lapse |
| `/territories` | Territory Scorecard — 13/26-week payer-split table, coverage, QTD goal, ZIP lookup | Territory & Rep Performance |
| `/opportunities` | HCP Opportunities — visible potential score, four quadrants, rule-based next best action | HCP Targeting & White Space · Market & Competitive Intelligence · Segmentation · Next-Best-Action |
| `/engagement` | Engagement → Rx — target coverage, calls before first Rx, exposure lift, speaker-program pre/post | Call Activity · Promotional Effectiveness · Digital & Omnichannel |
| `/payers` | Payers & Copay — channel split by window, Medicaid plan × week pivot, copay program | Payer, Access & Channel · Patient Support & Pharmacy |
| `/goals` | Goal Attainment — QTD pace vs territory goals (needs a goals table in production) | Sales Goal & Attainment |
| `/ideas` | The backlog: every idea, the prompts that motivated it, and taxonomy coverage | — |

Cross-cutting: the **Definition drawer** (ⓘ) on every tile and table lists source tables, window, filters, formula and caveats, and copies a paste-ready PLAiTO prompt so chat starts from the tool's definition.

See [docs/PRODUCT_IDEAS.md](docs/PRODUCT_IDEAS.md) for the full brainstorm and the reasoning behind each pick.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # what Vercel runs
npm run typecheck
```

## Deploy on Vercel (Hobby)

1. Import this repository in Vercel (Add New → Project → pick `plaito-sales-workbench`). Framework preset is detected as Next.js; no environment variables are needed.
2. Every push to `main` produces a production deployment; PR branches get preview URLs.

## Where the data comes from

`lib/data/generate.ts` builds the dataset from a fixed seed: 62 Sat–Fri true weeks (launch w/e 2025-12-05 through w/e 2026-08-28), 44 CNS territories plus White Space, ~50 roster rows, 720 HCPs, weekly HCP-level Rx (EXXUA fTRx split into titration/continuing and payer channel, MDD market TRx, buspirone/Auvelity/Trintellix), CRM calls, field emails, copay claims, Medicaid plans and quarterly goals. `lib/queries.ts` holds every metric; each exported query returns its rows **and** the `Definition` shown in the drawer.

Column and table names in the definitions (`rpt_allhcp_sha_rx_weekly`, `scd_zipterr`, `fct_calls_list`, `rpt_copay_detail_bc`, …) are the real warehouse names so the wiring to production is a substitution, not a redesign.

## Not in this prototype

- Authentication (noclaim-demo's Clerk setup drops in unchanged when needed).
- Real data access. Each query would become a parameterised SQL view or core_api endpoint.
- Saved reports, scheduling, XLSX export, account roll-up, patient journey, forecast — all listed on `/ideas` as proposed.
