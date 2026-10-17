<script lang="ts">
  let {
    series = [],
    formatValue,
    kind = 'line',
    color = 'var(--color-chart-1)',
    loading = false,
    emptyHint = 'No data for the selected period',
    heightClass = 'h-32',
  }: {
    series?: Array<{ date: string; value: number }>;
    formatValue?: (value: number) => string;
    kind?: 'line' | 'bar';
    color?: string;
    loading?: boolean;
    emptyHint?: string;
    heightClass?: string;
  } = $props();

  const max = Math.max(1, ...series.map((s) => s.value));
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v));
  const ariaLabel = series.map((s) => `${s.date}: ${fmt(s.value)}`).join(', ');

  function linePoints(): string {
    return series
      .map((s, i) => {
        const x = series.length <= 1 ? 50 : (i / (series.length - 1)) * 100;
        const y = 38 - (s.value / max) * 36;
        return `${x},${y}`;
      })
      .join(' ');
  }
</script>

{#if loading}
  <div class={`${heightClass} w-full animate-pulse rounded-md bg-surface-elevated`} aria-hidden="true"></div>
{:else if series.length === 0}
  <div class={`${heightClass} flex w-full items-center justify-center text-sm text-foreground-muted`}>{emptyHint}</div>
{:else if kind === 'bar'}
  <div class={`${heightClass} flex w-full items-end gap-0.5`} role="img" aria-label={ariaLabel}>
    {#each series as s (s.date)}
      <div
        class="flex-1 rounded-t"
        style={`height: ${Math.max(2, (s.value / max) * 100)}%; background: ${color}`}
        title={`${s.date}: ${fmt(s.value)}`}
      ></div>
    {/each}
  </div>
{:else}
  <svg class={`${heightClass} w-full`} viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
    <polyline points={linePoints()} fill="none" stroke={color} stroke-width="1.5" vector-effect="non-scaling-stroke" />
  </svg>
{/if}
