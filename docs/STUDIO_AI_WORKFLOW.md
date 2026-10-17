# Studio AI Workflow Contract

Studio AI is a controlled application of the existing AI domain, not a separate billing or policy system.

Flow:
`Studio context -> generation request -> Policy Engine -> provider/model capability check -> credits/BYOK authorization -> Cloudflare Workflows generation -> immutable generation result -> explicit apply operation -> draft revision`.

Generation records MUST retain provider, model/version, execution location, billing mode, provenance, policy decision, input references, output references, timestamps and cost metadata according to the existing AI contracts.

Adult generation remains subject to age eligibility, paid entitlement, explicit adult preference, global adult settings, jurisdiction and provider/model policy. Unknown policy state fails closed.
