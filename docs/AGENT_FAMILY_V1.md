# V1 Agent Family

V1 uses 17 autonomous agents. Domain capabilities are not automatically promoted to separate agents; a separate agent requires a distinct context, authorization, lifecycle, optimization objective or approval boundary.

| Agent | Primary purpose | Default authority |
|---|---|---|
| Story Producer | Story intake, story production and character/world domain capabilities | Propose/orchestrate |
| Story Guardian | Canon and continuity | Review |
| Art Director | Visual direction | Propose |
| Production | Approved production execution | Execute |
| Community Guardian | Community safety/moderation | Review |
| Discovery Curator | Discovery/recommendations | Propose |
| Reader Companion | Reader assistance | Assist |
| Creator Business | Creator business, monetization and growth analysis | Analyze/advise |
| Media Operations | Media processing/distribution operations | Execute |
| Support | Customer support/triage | Assist |
| QA / Release | Verification/release evidence | Verify |
| Infrastructure | Infrastructure operations | Execute |
| CEO | Executive analysis/decisions | Advise |
| Data Analysis & Reporting | Business, product, operations, cost and unit-economics analysis | Analyze |
| Coding / Dev | Software engineering | Implement |
| Orchestrator | Cross-agent coordination | Orchestrate |
| Keep2Share Import | External media ingestion | Execute |

## Merged capabilities

- **Character** remains a domain capability owned by Story Producer.
- **World** remains a domain capability owned by Story Producer.
- **Creator Growth** remains a business-analysis capability owned by Creator Business.
- **Cost Guardian** remains a cost/consumption-analysis capability owned by Data Analysis & Reporting.

No capability receives authority merely by being registered. The capability registry, Policy Engine, task scope and approval rules remain authoritative.
