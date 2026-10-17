<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'status', label: 'Status' },
		{ key: 'priority', label: 'Priority' },
		{ key: 'placementIds', label: 'Placements' }
	];

	const rows = data.rows.map((c) => ({
		$id: String(c.$id ?? ''),
		name: String(c.name ?? ''),
		status: String(c.status ?? ''),
		priority: String(c.priority ?? 0),
		placementIds: Array.isArray(c.placementIds) ? c.placementIds.join(', ') : String(c.placementIds ?? '')
	}));
</script>

<ListPage title="Ads &amp; Monetization" count={data.rows.length} columns={columns} rows={rows} error={data.errorCode} />
