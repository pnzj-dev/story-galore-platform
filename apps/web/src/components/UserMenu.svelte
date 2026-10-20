<script lang="ts">
  import { actions } from 'astro:actions';

  let {
    initial,
    name,
    email,
    isCreator = false,
  }: {
    initial: string;
    name?: string;
    email?: string;
    isCreator?: boolean;
  } = $props();

  let open = $state(false);
  let root: HTMLElement | null = $state(null);

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }

  function onMousedown(e: MouseEvent) {
    if (root && !root.contains(e.target as Node)) open = false;
  }

  $effect(() => {
    if (!open) return;
    document.addEventListener('mousedown', onMousedown);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('mousedown', onMousedown);
      document.removeEventListener('keydown', onKeydown);
    };
  });
</script>

<div class="relative" bind:this={root}>
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label="Account menu"
    class="grid h-[38px] w-[38px] place-items-center rounded-full border border-border bg-gradient-to-br from-brand-500 to-accent text-sm font-bold text-white transition hover:opacity-90"
  >
    {initial}
  </button>

  {#if open}
    <div
      role="menu"
      aria-label="Account"
      class="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
    >
      <div class="border-b border-border px-4 py-3">
        <p class="truncate text-sm font-semibold text-foreground">{name ?? 'Account'}</p>
        {#if email}
          <p class="truncate text-xs text-foreground-muted">{email}</p>
        {/if}
      </div>

      <a role="menuitem" href="/account" class="block px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated">
        Account
      </a>
      <a role="menuitem" href="/library" class="block px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated">
        Library
      </a>
      <a role="menuitem" href="/settings" class="block px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated">
        Settings
      </a>
      <a role="menuitem" href="/account/billing" class="block px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated">
        Billing
      </a>
      {#if isCreator}
        <a role="menuitem" href="/studio" class="block px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated">
          Creator Studio
        </a>
      {/if}

      <div class="border-t border-border">
        <form method="POST" action={actions.logout}>
          <button
            role="menuitem"
            type="submit"
            class="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface-elevated"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  {/if}
</div>
