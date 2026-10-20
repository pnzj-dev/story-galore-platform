<script lang="ts">
  import { actions } from 'astro:actions';
  import { createBrowserClient } from '@storygalore/appwrite-client';

  interface Generation {
    $id?: string;
    targetType?: string;
    billingMode?: string;
    executionLocation?: string;
    status?: string;
    creditEligible?: boolean;
    creditEligibilityReason?: string;
  }

  interface Labels {
    none: string;
    credits: string;
    ineligible: string;
  }

  let {
    projectId,
    initial = [],
    labels,
  }: {
    projectId: string;
    initial?: Generation[];
    labels: Labels;
  } = $props();

  let rows = $state<Generation[]>(initial);

  async function refresh() {
    const r = await actions.listGenerations({ projectId });
    if (!r.error && r.data) rows = (r.data.items ?? []) as Generation[];
  }

  // Realtime: subscribe to generation-request changes and refresh.
  $effect(() => {
    const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
    const projectIdEnv = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectIdEnv) return;
    let unsub: (() => void) | undefined;
    void (async () => {
      try {
        const { client, account } = createBrowserClient({ endpoint, projectId: projectIdEnv });
        try {
          await account.get();
        } catch {
          try {
            await account.createAnonymousSession();
          } catch {
            /* realtime unavailable */
          }
        }
        const sub = client.subscribe(
          'databases.main.collections.studio_generation_requests.documents',
          () => {
            void refresh();
          },
        );
        unsub = () => sub.unsubscribe();
      } catch {
        /* realtime unavailable */
      }
    })();
    return () => {
      unsub?.();
    };
  });
</script>

{#if rows.length > 0}
  <ul class="mt-4 space-y-2">
    {#each rows as g (g.$id)}
      <li class="flex items-center justify-between rounded-md border border-border bg-surface p-4">
        <div class="min-w-0 flex-1">
          <p class="font-semibold">{g.targetType}</p>
          <p class="truncate text-sm text-foreground-muted">
            {g.billingMode} · {g.executionLocation}
          </p>
        </div>
        <div class="ml-4 flex shrink-0 items-center gap-3 text-xs text-foreground-muted">
          <span class="rounded-full border border-border px-2 py-0.5">{g.status ?? 'QUEUED'}</span>
          <span>{g.creditEligible ? labels.credits : (g.creditEligibilityReason ?? labels.ineligible)}</span>
        </div>
      </li>
    {/each}
  </ul>
{:else}
  <p class="mt-4 rounded-md border border-dashed border-border px-6 py-8 text-sm text-foreground-muted">
    {labels.none}
  </p>
{/if}
