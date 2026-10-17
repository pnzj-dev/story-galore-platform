<script lang="ts">
  import Badge from '../primitives/Badge.svelte';
  type State = 'saving' | 'saved' | 'offline' | 'syncing' | 'conflict' | 'save_failed';
  let { state }: { state: State } = $props();
  const labels: Record<State, string> = { saving: 'Saving…', saved: 'Saved', offline: 'Offline', syncing: 'Syncing…', conflict: 'Conflict needs review', save_failed: 'Save failed' };
  const tone: Record<State, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = { saving: 'info', saved: 'success', offline: 'warning', syncing: 'info', conflict: 'warning', save_failed: 'danger' };
</script>
<Badge status={tone[state]} label={labels[state]} />
