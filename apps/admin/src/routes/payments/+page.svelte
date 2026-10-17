<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'userId', label: 'User' },
		{ key: 'amount', label: 'Amount' },
		{ key: 'currency', label: 'Currency' },
		{ key: 'provider', label: 'Provider' },
		{ key: 'status', label: 'Status' },
		{ key: 'createdAt', label: 'Created' }
	];

	const rows = data.rows.map((p) => ({
		$id: String(p.$id ?? ''),
		userId: String(p.userId ?? ''),
		amount: String(p.amount ?? 0),
		currency: String(p.currency ?? ''),
		provider: String(p.provider ?? ''),
		status: String(p.status ?? ''),
		createdAt: String(p.createdAt ?? '').slice(0, 10)
	}));
</script>

<ListPage
	title="Payments"
	count={data.rows.length}
	columns={columns}
	rows={rows}
	error={data.errorCode}
/>
