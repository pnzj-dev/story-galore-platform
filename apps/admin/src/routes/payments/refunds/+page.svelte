<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="REFUND" title="Refunds" description="Move money: refund a captured payment." requests={data.requests} />
