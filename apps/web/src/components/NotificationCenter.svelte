<script lang="ts">
  import { actions } from 'astro:actions';
  import type { NotificationItem } from '@/lib/gateway';

  let {
    items = [],
    title = 'Notifications',
    markAllReadLabel = 'Mark all as read',
    allLabel = 'All',
    unreadLabel = 'Unread',
    emptyLabel = 'No notifications.',
    preferencesLabel = 'Notification preferences →',
  }: {
    items?: NotificationItem[];
    title?: string;
    markAllReadLabel?: string;
    allLabel?: string;
    unreadLabel?: string;
    emptyLabel?: string;
    preferencesLabel?: string;
  } = $props();

  let open = $state(false);
  let filter = $state<'all' | 'unread'>('all');
  let rows = $state<NotificationItem[]>(items);

  const unreadCount = $derived(rows.filter((n) => !n.read).length);
  const filtered = $derived(filter === 'unread' ? rows.filter((n) => !n.read) : rows);

  function markRead(id: string) {
    rows = rows.map((n) => (n.$id === id ? { ...n, read: true } : n));
    actions.markNotificationsRead({ notificationId: id }).catch(() => {});
  }

  function markAllRead() {
    rows = rows.map((n) => ({ ...n, read: true }));
    actions.markNotificationsRead({}).catch(() => {});
  }

  function timeAgo(iso?: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h ago`;
    return `${Math.floor(h / 24)} d ago`;
  }

  const iconClass: Record<string, string> = {
    PUBLISHING: 'bg-brand-500/90 text-white',
    SOCIAL: 'bg-accent/90 text-white',
    SECURITY: 'bg-danger/90 text-white',
    PAYMENT: 'bg-success/90 text-[#052015]',
    SYSTEM: 'bg-info/90 text-white',
    ALERT: 'bg-warning/90 text-[#2b1a00]',
  };
</script>

<div class="relative">
  <button
    type="button"
    aria-label="Notifications"
    onclick={() => (open = !open)}
    class="relative grid h-[38px] w-[38px] place-items-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-elevated"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
    {#if unreadCount > 0}
      <span
        class="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-background bg-accent px-1 text-[10px] font-bold text-white"
      >
        {unreadCount}
      </span>
    {/if}
  </button>

  {#if open}
    <div class="fixed inset-0 z-50 bg-black/40" onclick={() => (open = false)} aria-hidden="true"></div>
    <aside
      role="dialog"
      aria-label="Notifications"
      class="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-border-strong bg-surface"
    >
      <div class="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 class="text-base font-bold">{title}</h3>
        <button
          type="button"
          onclick={markAllRead}
          class="text-xs font-semibold text-brand-400 transition hover:text-brand-300"
        >
          {markAllReadLabel}
        </button>
      </div>

      <div class="flex gap-1 px-5 pb-2 pt-3">
        <button
          type="button"
          onclick={() => (filter = 'all')}
          class:bg-surface-elevated={filter === 'all'}
          class:text-foreground={filter === 'all'}
          class="rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-muted transition"
        >
          {allLabel}
        </button>
        <button
          type="button"
          onclick={() => (filter = 'unread')}
          class:bg-surface-elevated={filter === 'unread'}
          class:text-foreground={filter === 'unread'}
          class="rounded-full px-3 py-1.5 text-xs font-semibold text-foreground-muted transition"
        >
          {unreadLabel}{#if unreadCount > 0} · {unreadCount}{/if}
        </button>
      </div>

      <div class="flex-1 overflow-auto px-3 pb-4">
        {#if filtered.length > 0}
          {#each filtered as n (n.$id)}
            <button
              type="button"
              onclick={() => markRead(n.$id)}
              class:bg-surface-elevated={!n.read}
              class="flex w-full items-start gap-3 rounded-md px-3 py-3 text-left transition hover:bg-surface-elevated"
            >
              <span
                class={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${iconClass[n.type ?? ''] ?? 'bg-brand-500/90 text-white'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-[13px] font-semibold leading-snug">{n.subject ?? 'Notification'}</span>
                {#if n.body}
                  <span class="mt-0.5 block text-xs leading-4 text-foreground-muted">{n.body}</span>
                {/if}
                <span class="mt-1.5 flex items-center gap-2">
                  <span class="text-[11px] text-foreground-tertiary">{timeAgo(n.createdAt)}</span>
                  {#if n.status}
                    <span
                      class={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        n.status === 'SENT' || n.status === 'DELIVERED'
                          ? 'bg-success/15 text-success'
                          : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {n.status === 'PENDING' ? 'Retrying' : n.status}
                    </span>
                  {/if}
                </span>
              </span>
              {#if !n.read}
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"></span>
              {/if}
            </button>
          {/each}
        {:else}
          <p class="rounded-md border border-dashed border-border px-6 py-8 text-center text-sm text-foreground-muted">
            {emptyLabel}
          </p>
        {/if}
      </div>

      <div class="border-t border-border px-5 py-3 text-center">
        <a href="/account/notifications" class="text-xs font-semibold text-brand-400 transition hover:text-brand-300">
          {preferencesLabel}
        </a>
      </div>
    </aside>
  {/if}
</div>
