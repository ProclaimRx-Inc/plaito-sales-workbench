# Talk track: PLAiTO Sales Workbench

One line per page on what it is, the user pain it came from, and the value.
Numbers are from `PLAiTO_Sales_Prompt_Taxonomy.xlsx` (1,736 prompts, 20 categories).

## Opening

Aytu users have asked PLAiTO about 1,400 questions in production.
Most were not open-ended analysis.
They were the same dozen reports asked again and again with new dates, followed by "which table did you use?" and "the numbers are incorrect".
Each page here turns one of those repeated reports into a button: same answer every time, the definition printed next to the number, and an export.
Chat stays for the genuinely new question.

## Launch Pulse

*What it is.* How did we do last week, and why.
*The pain.* "How did we do last week", "fTRx since launch", "what is the most recent week of data" are the highest-frequency asks, and the follow-up "why did it move" gets a freshly written story every time.
*The value.* One Monday number for leadership, a five-bucket bridge (new writers, returning, up, down, went to zero) that always sums to the national change, and a freshness panel that answers "what week is the data through" before anyone asks.

## Writer Lifecycle

*What it is.* Who started writing, who kept going, who stopped.
*The pain.* One user requested the "new prescribers for week ending X" table with the same nine columns at least eight times, correcting the definition along the way (tunits not TRx, territory from current alignment).
*The value.* That report becomes a week picker and an export.
Five segments with printed rules (New, Repeat, Consistent, At risk, Lapsed) tell the field who to protect before they lapse.
The cohort table answers the board-level question: do new writers stick?

## Territory Scorecard

*What it is.* One row per territory under the current alignment, plus ZIP lookup.
*The pain.* "How many active territories" a dozen times, "which territory owns this ZIP" repeatedly, and a 13-week market TRx table with payer splits that took six successive prompts to get right.
*The value.* District managers get a scorecard with the exact payer-split columns, coverage and quarter-to-date goal.
Ops gets a ZIP box that reads the current alignment row and says "not aligned" instead of guessing.
White Space is its own row and never leaks into a territory.

## HCP Opportunities

*What it is.* Every HCP scored and placed in one of four quadrants, with a next best action.
*The pain.* The biggest category by volume.
The white-space look-alike list was asked six different ways and produced six different models and six different lists.
Users kept asking whether buspirone or Auvelity writers are more likely to adopt.
*The value.* The score formula is printed on the page and the weights are editable.
Next best action is a rule table with the reason in plain English, so a rep can see why an HCP is on the list.
The export is a call list.
A list that is the same tomorrow is a list the field will trust and use.

## Engagement → Rx

*What it is.* Did the field reach the targets, and did the reach turn into scripts.
*The pain.* "How many Priority targets got zero calls this quarter", "how many in-person calls precede the first Rx", and speaker-program attendee lists pasted into the chat box for a pre/post analysis.
*The value.* Coverage gaps by tier with an exportable never-called list.
A paste box for NPI plus date that runs the same eight-week pre/post every time, so the rules never have to be re-explained.

## Payers & Copay

*What it is.* Channel mix, the Medicaid plan by week pivot, and the copay program.
*The pain.* The Commercial / Medicaid / Medicare / TriCare split with starts versus continuing was asked for four windows in a row.
The "plans as rows, weeks as columns" pivot was requested three times.
Copay questions all hinge on net of reversals and network versus retail.
*The value.* One channel definition with a window switcher.
The pivot is ready.
Copay defaults are labelled, so nobody has to ask whether reversals were removed.

## Goal Attainment

*What it is.* Quarter-to-date pace against territory goals.
*The pain.* Never asked in production, because the platform has no goals data.
The chat agent cannot answer "how am I tracking against goal" at all.
*The value.* This is the first page a sales leader would open.
It shows what we could give them with one new table, a goals upload in the admin console.

## Product ideas

*What it is.* The backlog: every idea, the prompts that motivated it, and which of the 20 categories each page absorbs.
*Use it for.* Showing coverage today, and what comes next (account roll-up, patient journey, saved reports, forecast band).

## The ⓘ on every number

*What it is.* A Definition drawer on every tile and table: source tables, window, filters, formula, caveats.
*The pain.* Across every category, users asked "which table", "what date range", "is that net of reversals", "show me the SQL" after getting an answer.
*The value.* Provenance up front instead of after the fact.
"Copy as PLAiTO prompt" hands chat the tool's definition as its starting point, so the AI extends the number rather than re-deriving it.

## Closing

The inconsistency users complained about came from asking an LLM to rediscover the same report each time.
Move the repeat questions into code and the AI is left doing what it is good at: the question nobody has asked before.
