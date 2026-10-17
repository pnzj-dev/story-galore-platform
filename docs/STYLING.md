# Styling and component architecture

## Decision

Use **Tailwind CSS + Bits UI + Lucide** with Svelte 5 components, while allowing scoped CSS for bespoke editorial/comic-reader presentation.

The single Astro web application at `apps/web` uses the shared `@storygalore/ui` package and design tokens. Public, Creator Studio and Admin share primitives; use composition and route-specific layouts rather than duplicate components.

## Layering

```text
packages/ui/
  theme/       design tokens and Tailwind theme contract
  primitives/  Bits UI-backed accessible primitives
  composites/  reusable application components
  domain/      storygalore-specific components

apps/web/  public editorial/discovery/reader, Creator Studio, and dense Admin operations/dashboard routes
```

## Rules

- Tailwind is the default for layout, spacing, typography, responsive behavior, states, and standard visual treatment.
- Bits UI supplies accessible interaction primitives such as dialogs, popovers, dropdowns, tabs, selects, tooltips and menus.
- Lucide is the icon source; do not use emoji as interface icons.
- Scoped CSS is allowed for unusual comic artwork layouts and the reader renderer when precise composition is easier to maintain locally.
- Keep design tokens semantic (`background`, `foreground`, `muted`, `border`, `primary`, `destructive`, etc.) rather than hard-coding product colors throughout components.
- Public and admin share primitives/tokens but may have different density and layout compositions.
- Reader UI is a dedicated subsystem and must not be constrained by generic card/grid components.
- Components must expose keyboard/focus states and accessible names.
- Prefer composition over prop-heavy mega-components.

## Installation

Use the official Astro integration/scaffolding flow and the current Tailwind integration documented by Astro. Add Svelte through the official Astro Svelte integration. Add Bits UI and Lucide as workspace dependencies after the scaffold is created.

Do not hand-invent an Astro/Tailwind configuration format if the current official integration provides it.
