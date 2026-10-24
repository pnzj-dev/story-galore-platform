<script lang="ts">
  import { actions } from 'astro:actions';
  import AccountModal from './AccountModal.svelte';
  import LibraryModal from './LibraryModal.svelte';
  import SettingsModal from './SettingsModal.svelte';
  import BillingModal from './BillingModal.svelte';

  let {
    initial,
    name,
    email,
    isCreator = false,
    accountLabel = 'Account',
    libraryLabel = 'Library',
    settingsLabel = 'Settings',
    billingLabel = 'Billing',
    studioLabel = 'Creator Studio',
    signOutLabel = 'Sign out',
    signOutConfirmLabel = 'Sign out?',
    cancelLabel = 'Cancel',
    libraryLabels,
    settingsLabels,
    billingLabels,
  }: {
    initial: string;
    name?: string;
    email?: string;
    isCreator?: boolean;
    accountLabel?: string;
    libraryLabel?: string;
    settingsLabel?: string;
    billingLabel?: string;
    studioLabel?: string;
    signOutLabel?: string;
    signOutConfirmLabel?: string;
    cancelLabel?: string;
    libraryLabels: {
      continue: string;
      saved: string;
      collections: string;
      emptyHint: string;
      noCollections: string;
      titles: string;
    };
    settingsLabels: {
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
    billingLabels: {
      plans: string;
      noPlans: string;
      payWith: string;
      cardStripe: string;
      cryptoNowPayments: string;
      emailCrypto: string;
      subscribe: string;
      yourSubscriptions: string;
      noSubscriptions: string;
      pause: string;
      resume: string;
      cancel: string;
    };
  } = $props();

  let open = $state(false);
  let active = $state<null | 'account' | 'library' | 'settings' | 'billing'>(null);
  let confirmSignOut = $state(false);
  let root: HTMLElement | null = $state(null);

  function openModal(k: 'account' | 'library' | 'settings' | 'billing') {
    active = k;
    open = false;
  }

  function askSignOut() {
    confirmSignOut = true;
    open = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (confirmSignOut) confirmSignOut = false;
      else if (active) active = null;
      else open = false;
    }
  }

  function onMousedown(e: MouseEvent) {
    if (root && !root.contains(e.target as Node) && !active && !confirmSignOut) open = false;
  }

  $effect(() => {
    if (!open && !active && !confirmSignOut) return;
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
        <p class="truncate text-sm font-semibold text-foreground">{name ?? accountLabel}</p>
        {#if email}
          <p class="truncate text-xs text-foreground-muted">{email}</p>
        {/if}
      </div>

      <button type="button" role="menuitem" onclick={() => openModal('account')} class="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface-elevated">
        {accountLabel}
      </button>
      <button type="button" role="menuitem" onclick={() => openModal('library')} class="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface-elevated">
        {libraryLabel}
      </button>
      <button type="button" role="menuitem" onclick={() => openModal('settings')} class="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface-elevated">
        {settingsLabel}
      </button>
      <button type="button" role="menuitem" onclick={() => openModal('billing')} class="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface-elevated">
        {billingLabel}
      </button>
      {#if isCreator}
        <a role="menuitem" href="/studio" class="block px-4 py-2 text-sm text-foreground transition hover:bg-surface-elevated">
          {studioLabel}
        </a>
      {/if}

      <div class="border-t border-border">
        <button
          type="button"
          role="menuitem"
          onclick={askSignOut}
          class="block w-full px-4 py-2 text-left text-sm text-foreground transition hover:bg-surface-elevated"
        >
          {signOutLabel}
        </button>
      </div>
    </div>
  {/if}
</div>

{#if active === 'account'}
  <AccountModal initial={initial} name={name} email={email} title={accountLabel} signOutLabel={signOutLabel} onclose={() => (active = null)} />
  {:else if active === 'library'}
    <LibraryModal
      title={libraryLabel}
      onclose={() => (active = null)}
      continueLabel={libraryLabels.continue}
      savedLabel={libraryLabels.saved}
      collectionsLabel={libraryLabels.collections}
      emptyHint={libraryLabels.emptyHint}
      noCollectionsLabel={libraryLabels.noCollections}
      titlesLabel={libraryLabels.titles}
    />
  {:else if active === 'settings'}
    <SettingsModal title={settingsLabel} labels={settingsLabels} onclose={() => (active = null)} />
  {:else if active === 'billing'}
    <BillingModal title={billingLabel} labels={billingLabels} onclose={() => (active = null)} />
  {/if}

{#if confirmSignOut}
    <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60" onclick={() => (confirmSignOut = false)} role="presentation"></div>
      <div class="relative z-10 w-full max-w-xs rounded-md border border-border bg-surface p-6 text-center shadow-xl">
        <p class="text-lg font-semibold">{signOutConfirmLabel}</p>
        <div class="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onclick={() => (confirmSignOut = false)}
            class="rounded-sm border border-border px-4 py-2 text-sm transition hover:opacity-90"
          >
            {cancelLabel}
          </button>
          <form method="POST" action={actions.logout}>
            <button
              type="submit"
              class="rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              {signOutLabel}
            </button>
          </form>
        </div>
      </div>
    </div>
  {/if}
