<script lang="ts">
	import DestructiveAction from '#lib/DestructiveAction.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DestructiveAction action="SUPPORT_POLICY_MANAGE" title="Support Policy" description="Manage support policy (broad blast radius)." requests={data.requests} />
