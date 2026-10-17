<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'targetType', label: 'Target' },
		{ key: 'status', label: 'Status' },
		{ key: 'body', label: 'Body' },
		{ key: 'createdAt', label: 'Created' }
	];

	const rows = data.rows.map((c) => ({
		$id: String(c.$id ?? ''),
		targetType: String(c.targetType ?? ''),
		status: String(c.status ?? ''),
		body: String(c.body ?? '').slice(0, 80),
		createdAt: String(c.createdAt ?? '').slice(0, 10)
	}));
</script>

<ListPage
	title="Moderation"
	count={data.rows.length}
	columns={columns}
	rows={rows}
	error={data.errorCode}
/>
