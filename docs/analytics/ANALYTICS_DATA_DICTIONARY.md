# Analytics Data Dictionary

Every KPI exposed to Admin, Finance, Marketing, Creator, or agents must have a stable definition, formula, source, dimensions, exclusions, owner, and version.

| KPI | Definition | Source of truth | Owner |
|---|---|---|---|
| MRR | Monthly normalized recurring subscription revenue from eligible successful recurring transactions, excluding refunded/voided amounts per finance policy | payment + subscription ledgers | Finance |
| ARR | MRR multiplied by 12 under the current finance definition | revenue projection backed by ledgers | Finance |
| ARPU | Recognized/eligible revenue divided by the defined active customer population for the period | revenue + audience facts | Finance |
| CAC | Attributed acquisition spend divided by new acquired customers under the selected attribution model | campaign spend + acquisition facts | Marketing |
| LTV | Versioned lifetime-value model using documented revenue, retention, margin and horizon assumptions | revenue + retention projections | Finance/Analytics |
| Churn | Versioned definition of customers/subscriptions that terminate in the measurement period | subscription ledger | Finance |
| Activation rate | Users reaching the defined activation event divided by eligible new users in the cohort | auth/product events | Product |
| Conversion rate | Users reaching the defined target event divided by the stated funnel population | product/acquisition events | Marketing/Product |
| Completion rate | Readers meeting the publication completion rule divided by eligible reading starts | reader events | Product |
| CTR | Clicks divided by eligible ad impressions | ad event facts | Advertising |
| eCPM | Estimated/recognized advertising revenue per thousand eligible impressions | ad revenue + impression facts | Advertising |
| First response time | Time from support ticket creation to first human/agent response under the SLA definition | support ticket records | Support |
| Resolution time | Time from ticket creation to resolved state under the SLA definition | support ticket records | Support |
| AI provider cost | Provider-reported or contracted estimated provider cost, separated from StoryGalore internal cost | AI usage/provider facts | AI Operations |

All definitions are versioned. Reports must display the relevant definition/attribution version where ambiguity is possible.
