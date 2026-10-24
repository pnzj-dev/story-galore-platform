<script lang="ts">
  import { onMount } from 'svelte';
  import { actions } from 'astro:actions';
  import { createBrowserClient } from '@storygalore/appwrite-client';

  interface Comment {
    $id: string;
    body?: string;
    authorName?: string;
    userId?: string;
    parentCommentId?: string;
    status?: string;
    createdAt?: string;
  }

  interface Labels {
    title: string;
    placeholder: string;
    post: string;
    reply: string;
    replyTo: string;
    cancel: string;
    signIn: string;
    empty: string;
    pending: string;
  }

  let {
    targetType,
    targetId,
    initialComments = [],
    signedIn = false,
    labels,
  }: {
    targetType: string;
    targetId: string;
    initialComments?: Comment[];
    signedIn?: boolean;
    labels: Labels;
  } = $props();

  let comments = $state<Comment[]>(initialComments);
  let body = $state('');
  let posting = $state(false);
  let error = $state('');
  let replyingTo = $state<string | null>(null);
  let replyBody = $state('');

  async function refresh() {
    const r = await actions.listComments({ targetType, targetId });
    if (!r.error && r.data) {
      comments = (r.data.items ?? []) as Comment[];
    }
  }

  onMount(() => {
    void refresh();
  });

  async function submitComment() {
    if (!body.trim() || posting) return;
    posting = true;
    error = '';
    const r = await actions.createComment({ targetType, targetId, body: body.trim() });
    posting = false;
    if (r.error) {
      error = r.error.message;
      return;
    }
    body = '';
    await refresh();
  }

  async function submitReply(parentId: string) {
    if (!replyBody.trim() || posting) return;
    posting = true;
    error = '';
    const r = await actions.createComment({
      targetType,
      targetId,
      body: replyBody.trim(),
      parentCommentId: parentId,
    });
    posting = false;
    if (r.error) {
      error = r.error.message;
      return;
    }
    replyBody = '';
    replyingTo = null;
    await refresh();
  }

  function fmtDate(iso?: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return '';
    }
  }

  const topLevel = $derived(comments.filter((c) => !c.parentCommentId));
  function repliesOf(id: string) {
    return comments.filter((c) => c.parentCommentId === id);
  }

  // Realtime: subscribe to comment changes and refresh on any event.
  $effect(() => {
    const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
    const projectId = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectId) return;
    let unsub: (() => void) | undefined;
    void (async () => {
      try {
        const { client, account } = createBrowserClient({ endpoint, projectId });
        try {
          await account.get();
        } catch {
          try {
            await account.createAnonymousSession();
          } catch {
            /* realtime unavailable */
          }
        }
        const sub = client.subscribe('databases.main.collections.comments.documents', () => {
          void refresh();
        });
        unsub = () => sub.unsubscribe();
      } catch {
        /* realtime unavailable; manual refresh still works after posting */
      }
    })();
    return () => {
      unsub?.();
    };
  });
</script>

<section class="mt-10">
  <h2 class="text-xl font-semibold">{labels.title}</h2>

  {#if signedIn}
    <div class="mt-4 space-y-2">
      <textarea
        bind:value={body}
        placeholder={labels.placeholder}
        rows="2"
        class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      ></textarea>
      {#if error}
        <p class="text-sm text-danger">{error}</p>
      {/if}
      <button
        onclick={submitComment}
        disabled={posting || !body.trim()}
        class="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {labels.post}
      </button>
    </div>
  {:else}
    <p class="mt-4 text-sm text-foreground-muted">{labels.signIn}</p>
  {/if}

  <ul class="mt-6 space-y-4">
    {#if comments.length === 0}
      <li class="rounded-md border border-dashed border-border px-6 py-6 text-sm text-foreground-muted">
        {labels.empty}
      </li>
    {:else}
      {#each topLevel as c (c.$id)}
        <li class="rounded-md border border-border bg-surface p-4">
          <div class="flex items-baseline justify-between gap-3">
            <p class="text-sm font-semibold">{c.authorName || 'Anonymous'}</p>
            <span class="text-xs text-foreground-muted">{fmtDate(c.createdAt)}</span>
          </div>
          <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
          {#if c.status && c.status !== 'VISIBLE'}
            <span class="mt-1 inline-block text-xs text-foreground-muted">{labels.pending}</span>
          {/if}

          {#if signedIn}
            <button
              onclick={() => {
                replyingTo = c.$id;
                replyBody = '';
              }}
              class="mt-2 text-xs text-link hover:underline"
            >
              {labels.reply}
            </button>
          {/if}

          {#if replyingTo === c.$id}
            <div class="mt-2 space-y-2">
              <textarea
                bind:value={replyBody}
                placeholder={`${labels.replyTo} ${c.authorName || ''}`}
                rows="2"
                class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              ></textarea>
              <div class="flex gap-2">
                <button
                  onclick={() => submitReply(c.$id)}
                  disabled={posting || !replyBody.trim()}
                  class="rounded-sm bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {labels.post}
                </button>
                <button
                  onclick={() => (replyingTo = null)}
                  class="rounded-sm border border-border px-3 py-1.5 text-xs"
                >
                  {labels.cancel}
                </button>
              </div>
            </div>
          {/if}

          {#each repliesOf(c.$id) as r (r.$id)}
            <div class="mt-3 ml-4 border-l border-border pl-4">
              <div class="flex items-baseline justify-between gap-3">
                <p class="text-sm font-semibold">{r.authorName || 'Anonymous'}</p>
                <span class="text-xs text-foreground-muted">{fmtDate(r.createdAt)}</span>
              </div>
              <p class="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
            </div>
          {/each}
        </li>
      {/each}
    {/if}
  </ul>
</section>
