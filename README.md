# FinSight X - Financial Product Decision Intelligence

Financial product decision-support portfolio prototype built with
React, Vite, SQLite-derived synthetic data, Recharts and jsPDF.

## Purpose
Identify onboarding leakage, customer activation gaps and product
opportunities; compare hypothetical scenarios; plan experiments;
and export executive PDF briefs.

## Validated synthetic dataset
- 600 fictional customers
- 360 completed KYC; 240 incomplete
- 252 activated; 108 verified but inactive
- 634 synthetic transactions
- Median time to first transaction after KYC: 7 days
- 117 recorded activations occurred more than 7 days after KYC

## Major workspaces
Overview, Customer Intelligence, KYC & Activation,
Activation Intelligence, Metric Integrity, Product Performance,
Decision Simulator, Decision Twin, Data Explorer,
Experiment Studio (Design / Evaluate / Decision Memo),
Opportunity Prioritizer, and Settings.

## Architecture
Python + SQLite generated and validated the original
synthetic data. React reads `src/data.json` as a STATIC snapshot.
Power BI reports are separate deliverables.

There is NO live SQLite API or backend authentication.

## Run locally
```bash
npm ci
npm run dev
```

## Test and build
```bash
node tests/release_regression.mjs
npm run build
npm run preview
```

## Deploy
Connect this frontend repository to Netlify.
Build command: `npm run build`
Publish folder: `dist`

## Business interpretation
Opportunity ranking uses observed synthetic cohort reach
and editable assumptions for impact, confidence and effort.
Financial Decision Twin outputs are illustrative estimates.
Experiment Results Lab uses hypothetical control and
treatment values; it does not prove causal uplift.

## Data/privacy limitations
All customers are fictional. Local drafts and preferences
are stored in browser storage. Data integrity reports describe
a build-time snapshot, not real-time data validation.
No live KYC, investment advice or actual trading is provided.

## Interview description
"Built a financial product decision-intelligence prototype
connecting customer funnel analytics, SQL validation,
activation intelligence, opportunity prioritization,
experiment planning and executive PDF reporting."

## License
No license granted by default.
