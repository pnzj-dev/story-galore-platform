# Admin Surface by Role

The admin shell is not a single dashboard. It is a role-filtered operational surface.

| Area | Platform Admin | Support | Moderator | Finance | Analytics | SRE/Ops | AI Ops | Security/Abuse | Community |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Overview | ✓ | scoped | scoped | scoped | ✓ | ✓ | scoped | scoped | scoped |
| Support | ✓ | ✓ | escalation | billing escalation | read KPIs | incident escalation | AI escalation | security escalation | community escalation |
| Community | ✓ | limited reports | ✓ | — | aggregate | — | — | abuse | ✓ |
| Moderation | ✓ | create escalation | ✓ | — | aggregate | — | AI escalation | ✓ | scoped |
| Payments | ✓ | read support projection | — | ✓ | aggregate | provider health | — | fraud signals | — |
| AI | ✓ | support projection | safety escalation | cost projection | aggregate | worker health | ✓ | abuse | — |
| Security | ✓ | account-support projection | safety | fraud | — | infra | credential health | ✓ | — |
| Config/Policy | ✓ | — | scoped | scoped | read | — | provider policy | security policy | community policy |
| Operations | ✓ | — | — | reconciliation view | — | ✓ | worker operations | incident view | — |
| Analytics | ✓ | support metrics | moderation metrics | finance metrics | ✓ | ops metrics | AI metrics | abuse metrics | community metrics |

`—` means no default access. `scoped` means only the explicitly assigned capability/scope is visible. A role never gains mutation access merely because it can see a related metric.

## Application split

Role surfaces are split across two applications (see `docs/adr/0018-admin-app-split.md`):

- **Non-destructive** surfaces (analytics, support, moderation, content/ops reads, AI ops, discovery, economic simulation) are served by the public `apps/web` `/admin` surface.
- **Destructive** surfaces (refunds, permanent deletion, private-content/secret access, pricing/reserve/tax/governance changes, media-distribution config, agent privilege, backup restore) are served only by the standalone `apps/admin` on a restricted network.

A role's destructive capabilities are exercised in `apps/admin`; the same server-side capability authorization and `PLATFORM_ADMIN` is not a bypass apply in both applications.
