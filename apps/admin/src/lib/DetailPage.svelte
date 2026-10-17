<script lang="ts">
	let {
		title,
		fields,
		entity,
		errorCode
	}: {
		title: string;
		fields: Array<{ key: string; label: string }>;
		entity: Record<string, unknown> | null;
		errorCode?: string | null;
	} = $props();

	function fmt(v: unknown): string {
		if (Array.isArray(v)) return v.join(', ') || '—';
		if (v === undefined || v === null || v === '') return '—';
		return String(v);
	}
</script>

<main class="mx-auto max-w-4xl px-6 py-10">
	<a href=".." class="text-sm text-foreground-muted transition hover:text-foreground">&larr; Back</a>
	<h1 class="mt-2 text-3xl font-bold">{title}</h1>

	{#if errorCode === 'GATEWAY_UNCONFIGURED'}
		<p class="mt-6 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			Gateway not configured. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY and
			ADMIN_ACTOR_ID.
		</p>
	{:else if !entity}
		<p class="mt-6 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			Not found.
		</p>
	{:else}
		<dl class="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
			{#each fields as f (f.key)}
				<div class="flex justify-between gap-4 border-b border-border/60 px-4 py-3 last:border-b-0">
					<dt class="text-sm text-foreground-muted">{f.label}</dt>
					<dd class="text-sm text-foreground">{fmt(entity[f.key])}</dd>
				</div>
			{/each}
		</dl>
	{/if}
</main>
