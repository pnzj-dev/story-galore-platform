<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		action,
		title,
		description,
		requests = []
	}: {
		action: string;
		title: string;
		description?: string;
		requests?: Array<Record<string, unknown>>;
	} = $props();

	const rows = requests
		.filter((r) => String(r.action ?? '') === action)
		.map((r) => ({
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
		<h1 class="text-3xl font-bold">{title}</h1>
		{#if description}
			<p class="mt-1 text-sm text-foreground-muted">{description}</p>
		{/if}
		<p class="mt-1 text-xs text-danger">Destructive — requires a second admin approval before execution.</p>
	</header>

	<section class="mt-8 rounded-xl border border-danger/40 bg-danger/5 p-4">
		<form method="POST" action="?/request" use:enhance class="mt-2 max-w-xl space-y-3">
			<input type="hidden" name="action" value={action} />
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<label for="targetId" class="mb-1 block text-sm text-foreground-muted">Target ID</label>
					<input
						id="targetId"
						name="targetId"
						type="text"
						class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
					/>
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
		{#if rows.length === 0}
			<p class="mt-4 rounded-xl border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
				No requests for this action.
			</p>
		{:else}
			<ul class="mt-4 space-y-2">
				{#each rows as r (r.$id)}
					<li class="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
						<div class="min-w-0">
							<p class="truncate text-sm text-foreground">{r.targetId || '—'}</p>
							<p class="truncate text-xs text-foreground-muted">{r.reason}</p>
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
