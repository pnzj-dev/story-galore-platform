<script lang="ts">
  let {
    label,
    value,
    delta,
    trend = 'flat',
    hint,
  }: {
    label: string;
    value: string;
    delta?: string;
    trend?: 'up' | 'down' | 'flat';
    hint?: string;
  } = $props();

  const trendClass =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-foreground-muted';
</script>

<div class="rounded-xl border border-border bg-surface p-4">
  <p class="text-xs uppercase tracking-widest text-foreground-muted">{label}</p>
  <p class="mt-2 text-3xl font-bold tabular-nums">{value}</p>
  {#if delta}
    <p class={`mt-1 text-xs ${trendClass}`}>{delta}</p>
  {/if}
  {#if hint}<p class="mt-1 text-xs text-foreground-muted">{hint}</p>{/if}
</div>
