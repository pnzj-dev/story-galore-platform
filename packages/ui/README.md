# StoryGalore UI System

Shared Svelte 5 component library for `apps/web` and `apps/web`.

## Stack
- Svelte 5
- Tailwind CSS
- Bits UI for accessible interaction primitives
- Lucide Svelte for icons
- Scoped CSS only for bespoke reader/comic rendering

## Layers
1. `src/primitives`: accessible, reusable interaction and feedback primitives.
2. `src/composites`: reusable product-level compositions.
3. `src/domain`: StoryGalore-specific visual/domain components.
4. `src/tokens`: semantic theme/density contracts.

## Rules
- Search this package before creating a new reusable UI pattern.
- Do not duplicate primitives in either site.
- Components must be route-agnostic and must not fetch Appwrite data directly.
- Mutation components cannot show success until authoritative server acceptance.
- Components that represent asynchronous operations must expose pending/success/error states.
- Protected content components receive already-authorized view models; they never decide authorization client-side.
- Public and admin may compose the same components with different density/layout themes.
