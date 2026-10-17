<script lang="ts">
	import DetailPage from '#lib/DetailPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const fields = [
		{ key: 'title', label: 'Title' },
		{ key: 'type', label: 'Type' },
		{ key: 'format', label: 'Format' },
		{ key: 'status', label: 'Status' },
		{ key: 'accessClass', label: 'Access' },
		{ key: 'contentRating', label: 'Rating' },
		{ key: 'pageCount', label: 'Pages' },
		{ key: 'publishedAt', label: 'Published' }
	];
</script>

<DetailPage
	title={String(data.entity?.title ?? 'Publication')}
	fields={fields}
	entity={data.entity}
	errorCode={data.errorCode}
/>
