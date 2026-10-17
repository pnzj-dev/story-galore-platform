<script lang="ts">
	import DetailPage from '#lib/DetailPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const fields = [
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email' },
		{ key: 'labels', label: 'Labels' },
		{ key: 'emailVerified', label: 'Email verified' },
		{ key: 'phoneVerified', label: 'Phone verified' },
		{ key: 'createdAt', label: 'Created' }
	];
</script>

<DetailPage
	title={String(data.entity?.name ?? 'User')}
	fields={fields}
	entity={data.entity}
	errorCode={data.errorCode}
/>
