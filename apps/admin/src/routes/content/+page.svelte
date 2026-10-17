<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'title', label: 'Title', href: (row) => `/content/${String(row.$id)}` },
		{ key: 'type', label: 'Type' },
		{ key: 'status', label: 'Status' },
		{ key: 'accessClass', label: 'Access' },
		{ key: 'contentRating', label: 'Rating' }
	];

	const rows = data.rows.map((p) => ({
		$id: String(p.$id ?? ''),
		title: String(p.title ?? 'Untitled'),
		type: String(p.type ?? ''),
		status: String(p.status ?? ''),
		accessClass: String(p.accessClass ?? 'FREE'),
		contentRating: String(p.contentRating ?? '')
	}));
</script>

<ListPage
	title="Content"
	count={data.rows.length}
	columns={columns}
	rows={rows}
	error={data.errorCode}
/>
