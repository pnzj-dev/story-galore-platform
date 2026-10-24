<script lang="ts">
  import { actions } from 'astro:actions';
  import Modal from './Modal.svelte';

  let {
    initial,
    name,
    email,
    title,
    signOutLabel,
    onclose,
  }: {
    initial: string;
    name?: string;
    email?: string;
    title: string;
    signOutLabel: string;
    onclose: () => void;
  } = $props();
</script>

<Modal title={title} {onclose}>
  <div class="flex items-center gap-4">
    <span
      class="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-2xl font-bold text-white"
    >
      {initial}
    </span>
    <div class="min-w-0">
      <p class="font-semibold text-foreground">{name ?? title}</p>
      {#if email}
        <p class="truncate text-sm text-foreground-muted">{email}</p>
      {/if}
    </div>
  </div>

  <form method="POST" action={actions.logout} class="mt-6">
    <button
      type="submit"
      class="rounded-sm border border-border px-4 py-2 text-sm transition hover:opacity-90"
    >
      {signOutLabel}
    </button>
  </form>
</Modal>
