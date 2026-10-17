<script lang="ts">
  import Button from '../primitives/Button.svelte';
  let { state = 'idle', children }: { state?: 'idle' | 'pending' | 'success' | 'error'; children: import('svelte').Snippet } = $props();
</script>
<Button loading={state === 'pending'} variant={state === 'error' ? 'destructive' : 'primary'}>{@render children()}</Button>
{#if state === 'success'}<span class="sr-only" role="status">Action completed successfully.</span>{/if}
{#if state === 'error'}<span class="sr-only" role="alert">Action failed. Try again.</span>{/if}
