<script lang="ts">
  import { onMount } from 'svelte';
  import { Moon, Sun } from '@lucide/svelte';

  /**
   * Hydration reason: this island must be hydrated with `client:load`
   * (not `client:idle`/`client:visible`) because the theme switcher is above
   * the fold and needs to be immediately interactive for accessibility
   * (light-mode and forced-colors users). Its state is the `data-theme`
   * attribute on `<html>`, which the ClientRouter does not swap.
   */
  type Theme = 'dark' | 'light';
  const STORAGE_KEY = 'sg-theme';

  let theme: Theme = $state('dark');

  function apply(next: Theme) {
    theme = next;
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; the in-memory toggle still works for this page.
    }
  }

  function toggle() {
    apply(theme === 'dark' ? 'light' : 'dark');
  }

  onMount(() => {
    // Read the persisted preference (source of truth), not the data-theme
    // attribute: on a client-side (View Transition) navigation the fresh
    // document is <html data-theme="dark">, so reading the attribute here would
    // overwrite the stored 'light' preference back to 'dark'.
    let stored = 'dark';
    try {
      stored = localStorage.getItem(STORAGE_KEY) ?? 'dark';
    } catch {
      stored = 'dark';
    }
    apply(stored === 'light' ? 'light' : 'dark');
  });
</script>

<button
  type="button"
  onclick={toggle}
  class="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground-muted transition hover:border-foreground-muted hover:text-foreground"
  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
>
  {#if theme === 'dark'}
    <Sun size={16} aria-hidden="true" />
  {:else}
    <Moon size={16} aria-hidden="true" />
  {/if}
</button>
