<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="PRIVATE_MESSAGE_ACCESS" title="Private Message Access" description="Read private messages (case-bound investigation)." requests={data.requests} />
