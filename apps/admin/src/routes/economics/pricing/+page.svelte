<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="ECONOMICS_PRICING_READ" title="Pricing" description="Read pricing policy data." requests={data.requests} />
