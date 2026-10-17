<script lang="ts">
	import { DataTable } from '@storygalore/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'date', label: 'Cohort' },
		{ key: 'size', label: 'Size', align: 'right' as const },
		{ key: 'd1', label: 'D+1', align: 'right' as const },
		{ key: 'd3', label: 'D+3', align: 'right' as const },
		{ key: 'd7', label: 'D+7', align: 'right' as const }
	];

	const rows = data.cohorts.map((c) => ({
		$id: c.date,
		date: c.date,
		size: String(c.size),
		d1: String(c.d1),
		d3: String(c.d3),
		d7: String(c.d7)
	}));
</script>

<main class="mx-auto max-w-4xl px-6 py-10">
	<a href="/analytics" class="text-sm text-foreground-muted transition hover:text-foreground">&larr; Analytics</a>
	<h1 class="mt-2 text-3xl font-bold">Cohorts</h1>
	<p class="mt-1 text-sm text-foreground-muted">Actors grouped by first-active day, with D+1/D+3/D+7 retention.</p>

	<div class="mt-6">
		<DataTable columns={columns} rows={rows} rowKey="$id" />
	</div>
</main>
