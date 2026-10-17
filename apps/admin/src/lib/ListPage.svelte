<script lang="ts">
	import { DataTable } from '@storygalore/ui';
	import type { Snippet } from 'svelte';

	let {
		title,
		count,
		columns,
		rows,
		error,
		children
	}: {
		title: string;
		count?: number;
		columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
		rows: Array<Record<string, unknown>>;
		error?: string | null;
		children?: Snippet;
	} = $props();
</script>

<main class="mx-auto max-w-[1600px] px-6 py-10">
	<header>
		<h1 class="text-3xl font-bold">{title}</h1>
		{#if count !== undefined}
			<p class="mt-1 text-sm text-foreground-muted">{count} record(s).</p>
		{/if}
	</header>

	{#if children}
		<div class="mt-6">{@render children()}</div>
	{/if}

	{#if error === 'GATEWAY_UNCONFIGURED'}
		<p class="mt-8 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			Gateway not configured. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY and
			ADMIN_ACTOR_ID.
		</p>
	{:else}
		<div class="mt-8">
			<DataTable columns={columns} rows={rows} rowKey="$id" searchable />
		</div>
	{/if}
</main>
