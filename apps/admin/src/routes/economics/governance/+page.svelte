<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="ECONOMICS_GOVERNANCE_READ" title="Economic Governance" description="Read economic governance data." requests={data.requests} />
