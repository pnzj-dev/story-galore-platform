<script lang="ts">
  import { onMount } from 'svelte';
  import { actions } from 'astro:actions';
  import Modal from './Modal.svelte';

  type Plan = { $id: string; name?: string; description?: string; amount?: number; currency?: string; billingInterval?: string };
  type Sub = { $id: string; planId?: string; provider?: string; billingStrategy?: string; status?: string };

  let {
    title,
    labels,
    onclose,
  }: {
    title: string;
    labels: {
      plans: string;
      noPlans: string;
      payWith: string;
      cardStripe: string;
      cryptoNowPayments: string;
      emailCrypto: string;
      subscribe: string;
      yourSubscriptions: string;
      noSubscriptions: string;
      pause: string;
      resume: string;
      cancel: string;
    };
    onclose: () => void;
  } = $props();

  let plans = $state<Plan[]>([]);
  let subscriptions = $state<Sub[]>([]);
  let loaded = $state(false);
  let error = $state('');

  async function refresh() {
    const r = await actions.billingGet({});
    if (!r.error && r.data) {
      plans = r.data.plans ?? [];
      subscriptions = r.data.subscriptions ?? [];
    }
    loaded = true;
  }

  onMount(refresh);

  async function subscribePlan(e: SubmitEvent) {
    e.preventDefault();
    error = '';
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const r = await actions.subscribe(fd);
    if (r.error) error = r.error.message;
    else await refresh();
  }

  async function subAction(e: SubmitEvent, action: typeof actions.pauseSubscription) {
    e.preventDefault();
    error = '';
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const r = await action(fd);
    if (r.error) error = r.error.message;
    else await refresh();
  }
</script>

<Modal title={title} {onclose} maxWidthClass="max-w-5xl">
  {#if !loaded}
    <p class="text-sm text-foreground-muted">…</p>
  {:else}
    {#if error}
      <p class="mb-4 rounded-sm border border-danger bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">{error}</p>
    {/if}

    <section>
      <h3 class="text-lg font-bold tracking-tight">{labels.plans}</h3>
      {#if plans.length === 0}
        <p class="mt-2 text-sm text-foreground-muted">{labels.noPlans}</p>
      {:else}
        <div class="mt-3 flex flex-wrap gap-4">
          {#each plans as plan (plan.$id)}
            <div class="flex min-w-0 flex-1 flex-col rounded-sm border border-border bg-surface p-4">
              <h4 class="font-semibold">{plan.name}</h4>
              {#if plan.description}
                <p class="mt-1 text-sm text-foreground-muted">{plan.description}</p>
              {/if}
              <p class="mt-2 text-lg font-bold">
                {((plan.amount ?? 0) / 100).toFixed(2)} {plan.currency}
                <span class="text-sm font-normal text-foreground-muted"> / {(plan.billingInterval ?? 'month').toLowerCase()}</span>
              </p>

              <form onsubmit={subscribePlan} class="mt-auto space-y-3 pt-4">
                <input type="hidden" name="planId" value={plan.$id} />
                <div>
                  <label for={`provider-${plan.$id}`} class="mb-1 block text-sm text-foreground-muted">{labels.payWith}</label>
                  <select id={`provider-${plan.$id}`} name="provider" class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="STRIPE">{labels.cardStripe}</option>
                    <option value="NOWPAYMENTS">{labels.cryptoNowPayments}</option>
                  </select>
                </div>
                <button type="submit" class="rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90">
                  {labels.subscribe}
                </button>
              </form>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section class="mt-8">
      <h3 class="text-lg font-bold tracking-tight">{labels.yourSubscriptions}</h3>
      {#if subscriptions.length === 0}
        <p class="mt-2 text-sm text-foreground-muted">{labels.noSubscriptions}</p>
      {:else}
        <ul class="mt-3 space-y-3">
          {#each subscriptions as sub (sub.$id)}
            <li class="rounded-sm border border-border bg-surface p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="font-semibold">{sub.planId}</p>
                  <p class="text-sm text-foreground-muted">{sub.provider} · {sub.billingStrategy} · <span class="font-medium">{sub.status}</span></p>
                </div>
                <div class="flex gap-2">
                  {#if sub.status === 'ACTIVE'}
                    <form onsubmit={(e) => subAction(e, actions.pauseSubscription)}>
                      <input type="hidden" name="subscriptionId" value={sub.$id} />
                      <button type="submit" class="rounded-sm border border-border px-3 py-1.5 text-sm transition hover:opacity-90">{labels.pause}</button>
                    </form>
                  {/if}
                  {#if sub.status === 'PAUSED'}
                    <form onsubmit={(e) => subAction(e, actions.resumeSubscription)}>
                      <input type="hidden" name="subscriptionId" value={sub.$id} />
                      <button type="submit" class="rounded-sm border border-border px-3 py-1.5 text-sm transition hover:opacity-90">{labels.resume}</button>
                    </form>
                  {/if}
                  {#if sub.status !== 'CANCELLED' && sub.status !== 'EXPIRED'}
                    <form onsubmit={(e) => subAction(e, actions.cancelSubscription)}>
                      <input type="hidden" name="subscriptionId" value={sub.$id} />
                      <button type="submit" class="rounded-sm border border-danger px-3 py-1.5 text-sm text-danger transition hover:opacity-90">{labels.cancel}</button>
                    </form>
                  {/if}
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</Modal>
