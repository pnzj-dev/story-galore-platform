<script lang="ts">
  import { LoaderCircle } from '@lucide/svelte';
  import { cva } from '../lib/cva';

  const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-60',
    {
      variants: {
        variant: {
          primary: 'bg-primary text-primary-foreground hover:opacity-90',
          secondary: 'border border-border text-foreground hover:border-foreground-muted',
          ghost: 'text-foreground-muted hover:text-foreground',
          destructive: 'bg-danger text-primary-foreground hover:opacity-90',
        },
        size: {
          default: 'px-4 py-2',
          sm: 'px-3 py-1.5 text-xs',
          lg: 'px-6 py-3 text-base',
        },
      },
      defaultVariants: { variant: 'primary', size: 'default' },
    },
  );

  type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
  type Size = 'default' | 'sm' | 'lg';

  let {
    type = 'button',
    variant = 'primary',
    size = 'default',
    loading = false,
    disabled = false,
    children,
  }: {
    type?: 'button' | 'submit' | 'reset';
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    children: import('svelte').Snippet;
  } = $props();
</script>

<button {type} disabled={disabled || loading} aria-busy={loading} class={buttonVariants({ variant, size })}>
  {#if loading}<LoaderCircle class="animate-spin" size={16} aria-hidden="true" />{/if}
  {@render children()}
</button>
