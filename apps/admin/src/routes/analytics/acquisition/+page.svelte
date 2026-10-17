<script lang="ts">
	import { TrendChart } from '@storygalore/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const series = data.series.map((s) => ({ date: s.date, value: s.newActors }));
</script>

<main class="mx-auto max-w-4xl px-6 py-10">
	<a href="/analytics" class="text-sm text-foreground-muted transition hover:text-foreground">&larr; Analytics</a>
	<h1 class="mt-2 text-3xl font-bold">Acquisition</h1>
	<p class="mt-1 text-sm text-foreground-muted">New actors per day (first-event date).</p>

	{#if series.length > 0}
		<div class="mt-6 rounded-xl border border-border bg-surface p-4">
			<TrendChart
				{series}
				kind="bar"
				color="var(--color-chart-2)"
				heightClass="h-48"
			/>
		</div>
	{:else}
		<p class="mt-6 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			No acquisition data yet.
		</p>
	{/if}
</main>
