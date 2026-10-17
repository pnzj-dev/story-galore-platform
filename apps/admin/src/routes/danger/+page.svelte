<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ACTIONS = [
		'REFUND',
		'PRIVATE_MESSAGE_ACCESS',
		'MEDIA_DISTRIBUTION_CONFIGURE',
		'SUPPORT_POLICY_MANAGE',
		'ECONOMICS_GOVERNANCE_READ',
		'ECONOMICS_PRICING_READ',
		'ECONOMICS_RESERVES_READ',
		'ECONOMICS_TAX_READ'
	];

	const rows = data.requests.map((r) => ({
		$id: String(r.$id ?? ''),
		action: String(r.action ?? ''),
		targetId: String(r.targetId ?? ''),
		status: String(r.status ?? ''),
		requestedBy: String(r.requestedBy ?? ''),
		reason: String(r.reason ?? '')
	}));
</script>

<main class="mx-auto max-w-[1600px] px-6 py-10">
	<header>
		<h1 class="text-3xl font-bold">Danger Zone</h1>
		<p class="mt-1 text-sm text-foreground-muted">
			Destructive operations require a second admin approval (break-glass) before execution.
		</p>
	</header>

	<section class="mt-8 rounded-xl border border-danger/40 bg-danger/5 p-4">
		<h2 class="font-semibold text-foreground">Request approval</h2>
		<form method="POST" action="?/request" use:enhance class="mt-3 max-w-xl space-y-3">
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<label for="action" class="mb-1 block text-sm text-foreground-muted">Action</label>
					<select
						id="action"
						name="action"
						class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
					>
						{#each ACTIONS as a (a)}
							<option value={a}>{a}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="targetId" class="mb-1 block text-sm text-foreground-muted">Target ID</label>
					<input
						id="targetId"
						name="targetId"
						type="text"
						class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
			</div>
			<div>
				<label for="reason" class="mb-1 block text-sm text-foreground-muted">Reason</label>
				<input
					id="reason"
					name="reason"
					type="text"
					required
					class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
				/>
			</div>
			<button
				type="submit"
				class="rounded-lg bg-danger px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
			>
				Request approval
			</button>
		</form>
	</section>

	<section class="mt-8">
		<h2 class="text-xl font-semibold">Requests</h2>
		{#if data.requests.length === 0}
			<p class="mt-4 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
				No destructive requests.
			</p>
		{:else}
			<ul class="mt-4 space-y-2">
				{#each rows as r (r.$id)}
					<li class="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
						<div class="min-w-0">
							<p class="truncate font-medium text-foreground">{r.action}</p>
							<p class="truncate text-xs text-foreground-muted">
								{r.targetId || '—'} · {r.reason}
							</p>
						</div>
						<div class="ml-4 flex shrink-0 items-center gap-2">
							<span class="text-xs text-foreground-muted">{r.status}</span>
							{#if r.status === 'PENDING'}
								<form method="POST" action="?/approve" use:enhance>
									<input type="hidden" name="requestId" value={r.$id} />
									<button
										type="submit"
										class="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
									>
										Approve
									</button>
								</form>
							{:else if r.status === 'APPROVED'}
								<form method="POST" action="?/execute" use:enhance>
									<input type="hidden" name="requestId" value={r.$id} />
									<button
										type="submit"
										class="rounded-md bg-danger px-2 py-1 text-xs font-semibold text-primary-foreground"
									>
										Execute
									</button>
								</form>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
