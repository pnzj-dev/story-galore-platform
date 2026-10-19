<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'name', label: 'Name', href: (row: Record<string, unknown>) => `/users/${String(row.$id)}` },
		{ key: 'email', label: 'Email' },
		{ key: 'labels', label: 'Labels' },
		{ key: 'createdAt', label: 'Created' }
	];

	const rows = data.rows.map((u) => ({
		$id: String(u.$id ?? ''),
		name: String(u.name ?? '—'),
		email: String(u.email ?? '—'),
		labels: Array.isArray(u.labels) ? (u.labels.join(', ') || '—') : String(u.labels ?? '—'),
		createdAt: String(u.createdAt ?? '').slice(0, 10)
	}));
</script>

<ListPage title="Users" count={data.rows.length} columns={columns} rows={rows} error={data.errorCode} />
