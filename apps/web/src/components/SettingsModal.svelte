<script lang="ts">
  import { onMount } from 'svelte';
  import { actions } from 'astro:actions';
  import { CONTENT_LANGUAGES } from '@/i18n/languages';
  import Modal from './Modal.svelte';

  let {
    title,
    labels,
    onclose,
  }: {
    title: string;
    labels: {
      adultContent: string;
      adultContentDescription: string;
      dateOfBirth: string;
      enableAdult: string;
      no: string;
      yes: string;
      save: string;
      language: string;
      languageDescription: string;
      contentLanguageMode: string;
      showAllLanguages: string;
      showSelectedLanguages: string;
      contentLanguagesLabel: string;
      saved: string;
    };
    onclose: () => void;
  } = $props();

  let dateOfBirth = $state('');
  let adultOptIn = $state('false');
  let adultError = $state('');
  let adultSaving = $state(false);
  let adultSaved = $state(false);

  let mode = $state<'ALL' | 'ONLY_SELECTED'>('ALL');
  let selected = $state<Set<string>>(new Set());
  let langError = $state('');
  let langSaving = $state(false);
  let langSaved = $state(false);

  onMount(async () => {
    const r = await actions.languagePreferencesGet({});
    if (!r.error && r.data) {
      mode = r.data.contentLanguageMode === 'ONLY_SELECTED' ? 'ONLY_SELECTED' : 'ALL';
      selected = new Set(r.data.contentLanguages ?? []);
    }
  });

  function toggleLang(tag: string) {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    selected = next;
  }

  async function saveAdult(e: SubmitEvent) {
    e.preventDefault();
    if (adultSaving) return;
    adultSaving = true;
    adultError = '';
    adultSaved = false;
    const fd = new FormData();
    fd.set('dateOfBirth', dateOfBirth);
    fd.set('adultContentOptIn', adultOptIn);
    const r = await actions.updateAdultSettings(fd);
    adultSaving = false;
    if (r.error) adultError = r.error.message;
    else adultSaved = true;
  }

  async function saveLang(e: SubmitEvent) {
    e.preventDefault();
    if (langSaving) return;
    langSaving = true;
    langError = '';
    langSaved = false;
    const fd = new FormData();
    fd.set('contentLanguageMode', mode);
    fd.set('contentLanguages', [...selected].join(','));
    const r = await actions.updateLanguagePreferences(fd);
    langSaving = false;
    if (r.error) langError = r.error.message;
    else langSaved = true;
  }
</script>

<Modal title={title} {onclose}>
  <section>
    <h3 class="text-lg font-bold tracking-tight">{labels.adultContent}</h3>
    <p class="mt-1 text-sm text-foreground-muted">{labels.adultContentDescription}</p>
    <form onsubmit={saveAdult} class="mt-4 max-w-sm space-y-4">
      <div>
        <label for="modal-dob" class="mb-1 block text-sm text-foreground-muted">{labels.dateOfBirth}</label>
        <input
          id="modal-dob"
          type="date"
          required
          bind:value={dateOfBirth}
          class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label for="modal-adult" class="mb-1 block text-sm text-foreground-muted">{labels.enableAdult}</label>
        <select
          id="modal-adult"
          bind:value={adultOptIn}
          class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="false">{labels.no}</option>
          <option value="true">{labels.yes}</option>
        </select>
      </div>

      {#if adultError}
        <p class="rounded-sm border border-danger bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">{adultError}</p>
      {/if}
      {#if adultSaved}
        <p class="text-sm text-success">{labels.saved}</p>
      {/if}

      <button type="submit" disabled={adultSaving} class="rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
        {labels.save}
      </button>
    </form>
  </section>

  <section class="mt-8">
    <h3 class="text-lg font-bold tracking-tight">{labels.language}</h3>
    <p class="mt-1 text-sm text-foreground-muted">{labels.languageDescription}</p>
    <form onsubmit={saveLang} class="mt-4 max-w-sm space-y-4">
      <div>
        <label for="modal-langmode" class="mb-1 block text-sm text-foreground-muted">{labels.contentLanguageMode}</label>
        <select
          id="modal-langmode"
          bind:value={mode}
          class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="ALL">{labels.showAllLanguages}</option>
          <option value="ONLY_SELECTED">{labels.showSelectedLanguages}</option>
        </select>
      </div>

      <fieldset>
        <legend class="mb-2 block text-sm text-foreground-muted">{labels.contentLanguagesLabel}</legend>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {#each CONTENT_LANGUAGES as lang (lang.tag)}
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.has(lang.tag)} onchange={() => toggleLang(lang.tag)} />
              <span>{lang.nativeName}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      {#if langError}
        <p class="rounded-sm border border-danger bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">{langError}</p>
      {/if}
      {#if langSaved}
        <p class="text-sm text-success">{labels.saved}</p>
      {/if}

      <button type="submit" disabled={langSaving} class="rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
        {labels.save}
      </button>
    </form>
  </section>
</Modal>
