<script lang="ts">
  import { actions } from 'astro:actions';

  const BOOK_FORMATS = [
    { value: '', label: '—' },
    { value: 'COMIC', label: 'Comic' },
    { value: 'MANGA', label: 'Manga' },
    { value: 'MANHWA', label: 'Manhwa' },
    { value: 'MANHUA', label: 'Manhua' },
    { value: 'BANDE_DESSINEE', label: 'Bande dessinée' },
    { value: 'GRAPHIC_NOVEL', label: 'Graphic novel' },
    { value: 'WEBTOON', label: 'Webtoon' },
    { value: 'NOVEL', label: 'Novel' },
    { value: 'LIGHT_NOVEL', label: 'Light novel' },
    { value: 'NONFICTION', label: 'Nonfiction' },
    { value: 'EDUCATIONAL', label: 'Educational' },
  ];

  let {
    documentId,
    initialTitle = '',
    initialFormat = '',
    showFormat = false,
  }: {
    documentId: string;
    initialTitle?: string;
    initialFormat?: string;
    showFormat?: boolean;
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
    <label for="meta-title" class="mb-1 block text-sm text-foreground-muted">Title</label>
    <input
      id="meta-title"
      type="text"
      bind:value={title}
      oninput={onInput}
      maxlength="200"
      class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
    />
  </div>

  {#if showFormat}
    <div>
      <label for="meta-format" class="mb-1 block text-sm text-foreground-muted">Format</label>
      <select
        id="meta-format"
        bind:value={format}
        onchange={onInput}
        class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {#each BOOK_FORMATS as f (f.value)}
          <option value={f.value}>{f.label}</option>
        {/each}
      </select>
    </div>
  {/if}

  <p class="text-xs" class:text-foreground-muted={status === 'idle'} class:text-foreground={status === 'saved'} class:text-danger={status === 'error' || status === 'offline'}>
    {#if status === 'saving'}
      Saving…
    {:else if status === 'saved'}
      Saved
    {:else if status === 'error'}
      Could not save — will retry
    {:else if status === 'offline'}
      Offline — changes will sync when you reconnect
    {:else}
      Autosaves as you type
    {/if}
  </p>
</div>
