<script lang="ts">
  import { cva } from '../lib/cva';

  const ratingVariants = cva(
    'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium',
    {
      variants: {
        rating: {
          ALL_AGES: 'border-border text-foreground-muted',
          TEEN: 'border-warning/50 text-warning',
          ADULT_18_PLUS: 'border-danger/50 text-danger',
        },
      },
    },
  );

  let { rating }: { rating: 'ALL_AGES' | 'TEEN' | 'ADULT_18_PLUS' } = $props();
  const labels = { ALL_AGES: 'All ages', TEEN: 'Teen', ADULT_18_PLUS: '18+' };
</script>

<span class={ratingVariants({ rating })} aria-label={`Content rating: ${labels[rating]}`}>{labels[rating]}</span>
