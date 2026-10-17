<script lang="ts">
	import DetailPage from '#lib/DetailPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const fields = [
		{ key: 'handle', label: 'Handle' },
		{ key: 'displayName', label: 'Display name' },
		{ key: 'bio', label: 'Bio' },
		{ key: 'creatorStatus', label: 'Status' },
		{ key: 'verificationStatus', label: 'Verification' },
		{ key: 'followerCountProjection', label: 'Followers' }
	];
</script>

<DetailPage
	title={String(data.entity?.displayName ?? 'Creator')}
	fields={fields}
	entity={data.entity}
	errorCode={data.errorCode}
/>
