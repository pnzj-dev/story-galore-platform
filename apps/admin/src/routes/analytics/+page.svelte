<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const a = data.analytics;

	const sections = [
		{ title: 'Content by type', entries: a?.contentByType },
		{ title: 'Content by status', entries: a?.contentByStatus },
		{ title: 'Subscriptions by status', entries: a?.subscriptionsByStatus },
		{ title: 'Payments by provider', entries: a?.paymentsByProvider },
		{ title: 'Payments by status', entries: a?.paymentsByStatus },
		{ title: 'Creators by status', entries: a?.creatorsByStatus }
	];
</script>

<main class="mx-auto max-w-[1600px] px-6 py-10">
	<header>
		<h1 class="text-3xl font-bold">Analytics</h1>
		<p class="mt-1 text-sm text-foreground-muted">Why? — distributions over the authoritative domain tables.</p>
		<div class="mt-3 flex flex-wrap gap-3 text-sm">
			<a href="/analytics/retention" class="text-link hover:underline">Retention</a>
			<a href="/analytics/funnels" class="text-link hover:underline">Funnels</a>
			<a href="/analytics/acquisition" class="text-link hover:underline">Acquisition</a>
			<a href="/analytics/cohorts" class="text-link hover:underline">Cohorts</a>
		</div>
	</header>

	{#if data.errorCode === 'GATEWAY_UNCONFIGURED'}
		<p class="mt-8 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			Gateway not configured. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY and
			ADMIN_ACTOR_ID.
		</p>
	{:else}
		<div class="mt-8 grid gap-4 md:grid-cols-3">
			{#each sections as s (s.title)}
				<div class="rounded-xl border border-border bg-surface p-4">
					<h2 class="font-semibold text-foreground">{s.title}</h2>
					<ul class="mt-3 space-y-1">
						{#each Object.entries(s.entries ?? {}) as [key, value] (key)}
							<li class="flex justify-between text-sm">
								<span class="text-foreground-muted">{key}</span>
								<span class="font-semibold tabular-nums">{value}</span>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</main>
