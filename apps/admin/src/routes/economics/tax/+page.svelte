<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="ECONOMICS_TAX_READ" title="Tax" description="Read tax obligation data." requests={data.requests} />
