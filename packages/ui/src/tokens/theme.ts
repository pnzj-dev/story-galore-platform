/** Semantic StoryGalore design tokens. Keep product styling semantic and themeable. */

export const colorTokens = [
  'background',
  'surface',
  'surface-elevated',
  'foreground',
  'foreground-muted',
  'border',
  'focus-ring',
  'primary',
  'primary-foreground',
  'success',
  'warning',
  'danger',
  'info',
  'link',
  'disabled',
  'overlay',
  'reader-background',
  'reader-foreground',
  'editor-canvas',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'selection',
  'code-background',
  'code-foreground',
] as const;

export type ColorToken = (typeof colorTokens)[number];

export const uiTokens = {
  color: colorTokens,
  density: { public: 'comfortable', admin: 'compact' } as const,
  radius: { sm: '0.375rem', md: '0.625rem', lg: '0.875rem', xl: '1.25rem' } as const,
} as const;
