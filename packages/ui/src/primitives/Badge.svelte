<script lang="ts">
  import { cva } from '../lib/cva';

  const statusVariants = cva(
    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
    {
      variants: {
        status: {
          neutral: 'bg-surface-elevated text-foreground-muted',
          success: 'bg-success/15 text-success',
          warning: 'bg-warning/15 text-warning',
          danger: 'bg-danger/15 text-danger',
          info: 'bg-info/15 text-info',
        },
      },
      defaultVariants: { status: 'neutral' },
    },
  );

  let {
    status = 'neutral',
    label,
  }: { status?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'; label: string } = $props();
</script>

<span class={statusVariants({ status })} role="status">{label}</span>
