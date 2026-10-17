<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const steps = data.funnel;
</script>

<main class="mx-auto max-w-4xl px-6 py-10">
	<a href="/analytics" class="text-sm text-foreground-muted transition hover:text-foreground">&larr; Analytics</a>
	<h1 class="mt-2 text-3xl font-bold">Funnels</h1>
	<p class="mt-1 text-sm text-foreground-muted">
		Distinct actors per step: creator → project → document → publish.
	</p>

	{#if steps.length > 0}
		<ol class="mt-6 space-y-2">
			{#each steps as s, i (s.step ?? i)}
				<li class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
					<span class="text-sm text-foreground">
						{i + 1}. {s.step}
					</span>
					<span class="font-semibold tabular-nums">{s.actors}</span>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="mt-6 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			No funnel data yet.
		</p>
	{/if}
</main>
