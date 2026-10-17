# V14 Architecture Refinements

V14 consolidates the BYOAI/adult architecture around a central server-side Policy Engine.

## Added

- centralized AI Policy Engine
- model-specific adult policy records with review/expiry
- independent global adult catalog/generation/discovery/search/recommendation controls
- AI Provider & Model Registry
- emergency provider/capability kill switches
- policy-aware provider fallback rules
- explicit `policyDecision` / `policyReason` provenance fields
- stronger user-hosted model/workflow policy requirements
- ComfyUI workflow provenance requirement
- expanded security/testing requirements

## Non-goals

- `USER_HOSTED` is not treated as adult-friendly by default
- Seedance is not a special architectural category
- global adult disablement does not delete creator work
- UI visibility is not a security boundary
