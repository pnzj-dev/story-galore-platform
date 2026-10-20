<script lang="ts">
  import { actions } from 'astro:actions';

  interface FormatOption {
    value: string;
    label: string;
  }

  export interface DocMetaLabels {
    title: string;
    format: string;
    saving: string;
    saved: string;
    error: string;
    offline: string;
    autosave: string;
  }

  let {
    documentId,
    initialTitle = '',
    initialFormat = '',
    showFormat = false,
    labels,
    bookFormats = [],
  }: {
    documentId: string;
    initialTitle?: string;
    initialFormat?: string;
    showFormat?: boolean;
    labels: DocMetaLabels;
    bookFormats?: FormatOption[];
  } = $props();

  let title = $state(initialTitle);
  let format = $state(initialFormat);
  let status = $state<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let saving = false;
  let pending = false;

  function online(): boolean {
    return typeof navigator === 'undefined' || navigator.onLine;
  }

  async function flush() {
    if (saving) {
      pending = true;
      return;
    }
    if (!online()) {
      status = 'offline';
      return;
    }
    saving = true;
    pending = false;
    status = 'saving';
    try {
      const r = await actions.updateDocument({ documentId, title, format });
      if (r.error) {
        status = 'error';
      } else {
        status = 'saved';
        setTimeout(() => {
          if (status === 'saved') status = 'idle';
        }, 1500);
      }
    } catch {
      status = 'error';
    }
    saving = false;
    if (pending) void flush();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), 800);
  }

  function onInput() {
    status = 'idle';
    schedule();
  }

  $effect(() => {
    const retry = () => {
      if (status === 'offline' || status === 'error') {
        status = 'idle';
        schedule();
      }
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  });
</script>

<div class="max-w-sm space-y-4">
  <div>
    <label for="meta-title" class="mb-1 block text-sm text-foreground-muted">{labels.title}</label>
    <input
      id="meta-title"
      type="text"
      bind:value={title}
      oninput={onInput}
      maxlength="200"
      class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
    />
  </div>

  {#if showFormat}
    <div>
      <label for="meta-format" class="mb-1 block text-sm text-foreground-muted">{labels.format}</label>
      <select
        id="meta-format"
        bind:value={format}
        onchange={onInput}
        class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {#each bookFormats as f (f.value)}
          <option value={f.value}>{f.label}</option>
        {/each}
      </select>
    </div>
  {/if}

  <p class="text-xs" class:text-foreground-muted={status === 'idle'} class:text-foreground={status === 'saved'} class:text-danger={status === 'error' || status === 'offline'}>
    {#if status === 'saving'}
      {labels.saving}
    {:else if status === 'saved'}
      {labels.saved}
    {:else if status === 'error'}
      {labels.error}
    {:else if status === 'offline'}
      {labels.offline}
    {:else}
      {labels.autosave}
    {/if}
  </p>
</div>
