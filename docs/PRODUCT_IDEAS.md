# Product ideas from the PLAiTO Sales prompt taxonomy

Source: `PLAiTO_Sales_Prompt_Taxonomy.xlsx` (SharePoint, ProclaimRx Inc › General › Claude › Claude project - Aytu Sales module exploration), 1,736 prompts in 20 categories. Thirteen categories hold prompts asked in production; seven (50 seeded prompts each) have not been asked yet.

## What the prompts actually are

Reading all 1,386 asked prompts, three patterns cover most of them:

1. **The same report, re-requested with new parameters.** "New prescribers for week ending X" with nine fixed columns appears at least eight times. "13-week MDD market TRx by territory with Commercial / Medicare / Medicaid / TriCare" was refined over six prompts. "Medicaid plans as rows, weeks as columns" three times. "How many active territories" a dozen times. These are buttons, not conversations.
2. **Definition chasing after the answer.** "Which table did you use", "what date range", "is that net of reversals", "can you provide the actual SQL, the numbers are incorrect", "what is the most recent week of data". The Data & Methodology category is entirely this, and it leaks into every other category.
3. **Genuinely analytic asks that a model re-derives each time.** The white-space look-alike list, buspirone/Auvelity affinity, call-before-first-Rx, speaker-program pre/post. Each run picks its own method, so the answer moves.

The seven unasked categories (goal attainment, next-best-action, segmentation, adoption/lapse, launch readiness, anomaly detection, account roll-up) are the questions a sales-ops team asks of a BI tool and has not yet thought to ask a chat box. Several are one GROUP BY away from data the asked categories already touch.

## Design principle

**Fix the definition in code; print it next to the number; make the export one click.** Keep the chat agent for the novel question, and hand it the tool's definition as the starting prompt so it does not start from zero.

## The ideas

Status: **P** prototyped in this repo · **X** cross-cutting, built into every page · **–** proposed.

| # | Idea | Status | Categories absorbed (☆ = not yet asked) | Why this one |
|---|---|---|---|---|
| 1 | **Launch Pulse** with a week-over-week bridge | P `/pulse` | Rx Performance & Trends · Launch Performance ☆ · Business Drivers & Anomaly Detection ☆ · Data & Methodology | "How did we do last week" and "why" are the highest-frequency asks. The bridge assigns every HCP's change to one of five buckets that sum to the national delta — same decomposition every week. Freshness per source answers "latest week of data" once. |
| 2 | **Writer Lifecycle** + Monday new-writer report | P `/writers` | HCP / Prescriber Analysis · HCP Adoption, Retention & Lapse ☆ | The most re-requested table in the corpus, with its column spec frozen. Lifecycle segments (New / Repeat / Consistent / At risk / Lapsed) with printed rules cover the unasked retention category from the same data. Cohort repeat rates answer "do new writers write again". |
| 3 | **Territory Scorecard** + ZIP lookup | P `/territories` | Territory & Rep Performance | Alignment counts, "which territory owns this ZIP", and the six-times-refined payer-split table. White Space is its own row, never mixed in. ZIP lookup returns "not aligned" rather than guessing. |
| 4 | **HCP Opportunity** quadrants with a visible score | P `/opportunities` | HCP Targeting & White Space · Market & Competitive Intelligence · Segmentation ☆ · Next-Best-Action ☆ | The largest category by volume. A four-term weighted percentile score (market TRx, branded, buspirone, Auvelity) replaces an LLM re-running correlations. Quadrants at medians; next best action is a rule table with the reason in plain text. Export is a rep call list. |
| 5 | **Engagement → Rx** | P `/engagement` | Call Activity · Promotional Effectiveness · Digital & Omnichannel | Target coverage per tier per quarter (with the uncalled-Priority export), calls-before-first-Rx histogram, exposure-group writer rate, and a paste box for the speaker-program pre/post so the NPI list never goes through the chat box again. |
| 6 | **Payers & Copay** | P `/payers` | Payer, Access & Channel · Patient Support & Pharmacy | One channel definition switched across the four windows the users asked for; the plan × week heat table; copay KPIs and pharmacy blended rate, net of reversals and labelled. |
| 7 | **Goal Attainment** | P `/goals` | Sales Goal & Attainment ☆ | Unaskable today because there is no goals table. The page shows what it looks like; the real product ask is a goals upload in the admin console. |
| 8 | **Definition drawer + freshness on every number** | X | Data & Methodology, and every other category | Sources, window, filters, formula, caveats, and "copy as PLAiTO prompt". Turns the post-hoc "which table?" into a pre-hoc label and gives chat a correct starting point. |
| 9 | **Account / health-system roll-up** | – | Account / Health System Performance ☆ | The scorecard and lifecycle queries keyed on account instead of territory. HCP master already carries an account id. |
| 10 | **Patient journey and switching** | – | Patient-Level & Rx Journey | Funnel (new to market → new to product → second fill → continuing) and a switch-from/to matrix on the documented patient id; no patient-level export. |
| 11 | **Saved report templates + scheduled delivery** | – | Rx Performance · Territory · Data & Methodology | "Add back the weekly columns", "can I print this", "help me set up the dashboard" are asks for a rerunnable report. Save any tool view with parameters, XLSX export, Monday email, Definition in the footer. |
| 12 | **Forecast band on the launch curve** | – | Forecasting & Planning · Launch Performance ☆ | One detailed prompt (footprint + 8 new territories from 8/1, three scenarios). A model with stated assumptions belongs in code, not in a chat turn. |

Ideas considered and parked: an "ask about this chart" inline chat (kept as copy-prompt instead, to avoid re-introducing non-determinism into the tool), a full Symphony product/market dimension browser (the 200+ per-drug prompts in Market & Competitive Intelligence are benchmark-generated, not user-asked, so the demand is unproven), and a rep-level leaderboard (sensitive; needs a governance decision first).

## Wiring to production

- Each `lib/queries.ts` function maps to one parameterised SQL view or a `core_api` endpoint over the tables named in its Definition. The Definition object should be generated from the same SQL so they cannot drift.
- Alignment reads must filter `scd_zipterr.end_date = current`; targets by the quarter's active list; copay net of reversals by default. Those three rules were the most common corrections users typed into chat.
- Goals (idea 7) and saved reports (idea 11) need new tables; everything else is read-only over existing marts.
