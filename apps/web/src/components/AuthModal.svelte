<script lang="ts">
  import { actions } from 'astro:actions';

  type Mode = 'signin' | 'register';

  let open = $state(false);
  let mode = $state<Mode>('signin');
  let name = $state('');
  let email = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  function currentPath() {
    return window.location.pathname + window.location.search;
  }

  $effect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      mode = detail === 'register' ? 'register' : 'signin';
      error = '';
      open = true;
    };
    window.addEventListener('auth:open', handler);
    return () => window.removeEventListener('auth:open', handler);
  });

  function close() {
    open = false;
    error = '';
  }

  function switchMode(m: Mode) {
    mode = m;
    error = '';
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (loading) return;
    loading = true;
    error = '';
    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('password', password);
      if (mode === 'signin') {
        formData.set('returnTo', currentPath());
        const result = await actions.login(formData);
        if (result.error) {
          error = result.error.message;
        } else {
          window.location.assign(result.data?.returnTo ?? currentPath());
        }
      } else {
        formData.set('name', name);
        const result = await actions.register(formData);
        if (result.error) {
          error = result.error.message;
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong.';
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/60" onclick={close} role="presentation"></div>

    <div
      class="relative w-full max-w-sm rounded-md border border-border bg-surface p-8 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'signin' ? 'Sign in' : 'Create account'}
    >
      <button
        type="button"
        onclick={close}
        aria-label="Close"
        class="absolute end-3 top-3 grid h-8 w-8 place-items-center rounded-full text-foreground-muted transition hover:bg-surface-elevated hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"></path>
        </svg>
      </button>

      <h2 class="font-serif text-2xl font-bold">
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h2>
      <p class="mt-1 text-sm text-foreground-muted">
        {mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Start reading, watching and listening.'}
      </p>

      <form onsubmit={submit} class="mt-6 space-y-4">
        {#if mode === 'register'}
          <div>
            <label for="auth-name" class="mb-1 block text-sm text-foreground-muted">Name</label>
            <input
              id="auth-name"
              type="text"
              required
              bind:value={name}
              class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        {/if}

        <div>
          <label for="auth-email" class="mb-1 block text-sm text-foreground-muted">Email</label>
          <input
            id="auth-email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label for="auth-password" class="mb-1 block text-sm text-foreground-muted">Password</label>
          <input
            id="auth-password"
            type="password"
            autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minlength="8"
            bind:value={password}
            class="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {#if error}
          <p class="rounded-sm border border-danger bg-danger/15 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        {/if}

        <button
          type="submit"
          disabled={loading}
          class="w-full rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-foreground-muted">
        {#if mode === 'signin'}
          New here?
          <button type="button" onclick={() => switchMode('register')} class="text-link hover:text-link">
            Create an account
          </button>
        {:else}
          Already have an account?
          <button type="button" onclick={() => switchMode('signin')} class="text-link hover:text-link">
            Sign in
          </button>
        {/if}
      </p>
    </div>
  </div>
{/if}
