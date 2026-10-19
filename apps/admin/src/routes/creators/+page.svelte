<script lang="ts">
	import ListPage from '#lib/ListPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const columns = [
		{ key: 'handle', label: 'Handle', href: (row: Record<string, unknown>) => `/creators/${String(row.actorId)}` },
		{ key: 'displayName', label: 'Display name' },
		{ key: 'creatorStatus', label: 'Status' },
		{ key: 'verificationStatus', label: 'Verification' }
	];

	const rows = data.rows.map((c) => ({
		$id: String(c.$id ?? ''),
		actorId: String(c.actorId ?? ''),
		handle: String(c.handle ?? ''),
		displayName: String(c.displayName ?? ''),
		creatorStatus: String(c.creatorStatus ?? ''),
		verificationStatus: String(c.verificationStatus ?? '')
	}));
</script>

<ListPage
	title="Creators"
	count={data.rows.length}
	columns={columns}
	rows={rows}
	error={data.errorCode}
/>
