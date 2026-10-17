# Theme & Appearance Implementation Contract

Theme support is a V1 implementation requirement. It is not a visual preference left to individual agents.

## Canonical model

`LIGHT`, `DARK`, and `SYSTEM` are the only persisted values. `SYSTEM` resolves to `LIGHT` or `DARK` from the platform preference.

UI locale, content-language filtering, authorization, entitlement, adult policy, and theme are independent decisions.

## Coding-agent rules

1. Read `contracts/ui/theme/*.yaml` before changing UI styling.
2. Add semantic tokens before adding component styling.
3. Every token must have both light and dark values.
4. Every new component family must be added to `component-theme-map.yaml`.
5. Never put raw theme colors in component CSS, inline styles, or arbitrary utility classes.
6. Use CSS logical properties; do not encode LTR assumptions with physical left/right properties.
7. Resolve the theme before first paint and keep SSR and hydration state identical.
8. Never alter user artwork pixels to implement a theme.
9. Theme changes must not change content visibility, language filtering, entitlement, authorization, or policy decisions.
10. Both light and dark modes must pass accessibility verification.

## Completion gate

A theme-related task cannot reach `DEPLOYMENT_CANDIDATE` unless `pnpm validate:theme` passes and the applicable theme E2E scenarios are green.

If any mapping or requirement is missing, the coding agent must emit `BLOCKED` instead of inventing a styling decision.
