<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="MEDIA_DISTRIBUTION_CONFIGURE" title="Media Distribution" description="Configure media distribution (broad blast radius)." requests={data.requests} />
