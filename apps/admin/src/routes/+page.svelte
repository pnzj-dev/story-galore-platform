<script lang="ts">
	import { KpiCard, TrendChart } from '@storygalore/ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const k = data.overview?.kpis ?? {};
	const c = data.overview?.charts;

	function fmtCents(cents: number): string {
		return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
</script>

<main class="mx-auto max-w-[1600px] px-6 py-10">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Overview</h1>
			<p class="mt-1 text-sm text-foreground-muted">How is the platform doing?</p>
		</div>
		<a
			href="/ads"
			class="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-foreground-muted"
		>
			Ads &amp; Monetization
		</a>
	</header>

	{#if data.errorCode === 'GATEWAY_UNCONFIGURED'}
		<p class="mt-8 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			Gateway not configured. Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY and
			ADMIN_ACTOR_ID.
		</p>
	{:else if data.overview}
		<section class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
			<KpiCard label="Active paid subscribers" value={String(k.activePaidSubscribers ?? 0)} />
			<KpiCard label="MRR" value={fmtCents(k.mrrCents ?? 0)} />
			<KpiCard label="New subscribers (30d)" value={String(k.newSubscribers30d ?? 0)} />
			<KpiCard label="Churned (30d)" value={String(k.churned30d ?? 0)} />
			<KpiCard label="Revenue (30d)" value={fmtCents(k.revenue30dCents ?? 0)} />
			<KpiCard label="Active readers (30d)" value={String(k.activeReaders30d ?? 0)} />
			<KpiCard label="Published content" value={String(k.publishedContent ?? 0)} />
			<KpiCard label="AI jobs (30d)" value={String(k.aiJobs30d ?? 0)} />
		</section>

		<section class="mt-8 grid gap-4 md:grid-cols-3">
			<div class="rounded-xl border border-border bg-surface p-4">
				<h2 class="font-semibold text-foreground">Revenue trend (30d)</h2>
				<p class="mt-1 text-xs text-foreground-muted">Captured payment revenue per day.</p>
				<div class="mt-4">
					<TrendChart
						series={c?.revenueTrend ?? []}
						formatValue={fmtCents}
						color="var(--color-chart-1)"
					/>
				</div>
			</div>
			<div class="rounded-xl border border-border bg-surface p-4">
				<h2 class="font-semibold text-foreground">New subscribers (30d)</h2>
				<p class="mt-1 text-xs text-foreground-muted">New subscriptions per day.</p>
				<div class="mt-4">
					<TrendChart
						series={c?.newSubscriberTrend ?? []}
						kind="bar"
						color="var(--color-chart-2)"
					/>
				</div>
			</div>
			<div class="rounded-xl border border-border bg-surface p-4">
				<h2 class="font-semibold text-foreground">Churn (30d)</h2>
				<p class="mt-1 text-xs text-foreground-muted">Cancellations per day.</p>
				<div class="mt-4">
					<TrendChart series={c?.churnTrend ?? []} kind="bar" color="var(--color-danger)" />
				</div>
			</div>
		</section>
	{:else}
		<p class="mt-8 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
			No analytics available.
		</p>
	{/if}
</main>
