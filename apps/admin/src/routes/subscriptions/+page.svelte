<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'userId', label: 'User' },
		{ key: 'planId', label: 'Plan' },
		{ key: 'status', label: 'Status' },
		{ key: 'createdAt', label: 'Created' }
	];

	const rows = data.rows.map((s) => ({
		$id: String(s.$id ?? ''),
		userId: String(s.userId ?? ''),
		planId: String(s.planId ?? ''),
		status: String(s.status ?? ''),
		createdAt: String(s.createdAt ?? '').slice(0, 10)
	}));
</script>

<ListPage
	title="Subscriptions"
	count={data.rows.length}
	columns={columns}
	rows={rows}
	error={data.errorCode}
/>
