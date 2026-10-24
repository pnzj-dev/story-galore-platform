<script lang="ts">
  import type { MediaCardData } from '@storygalore/ui';
  import Comments from './Comments.svelte';

  let {
    images,
    initialId,
    signedIn,
    labels,
  }: {
    images: MediaCardData[];
    initialId: string;
    signedIn: boolean;
    labels: {
      title: string;
      placeholder: string;
      post: string;
      reply: string;
      replyTo: string;
      cancel: string;
      signIn: string;
      empty: string;
      pending: string;
    };
  } = $props();

  let container = $state<HTMLDivElement | undefined>(undefined);
  let activeImage = $state<MediaCardData | null>(null);
  let sheetOpen = $state(false);

  $effect(() => {
    const el = container;
    if (!el) return;
    const index = Math.max(0, images.findIndex((s) => s.id === initialId));
    el.scrollTo({ top: index * el.clientHeight, behavior: 'instant' });
  });

  function openComments(image: MediaCardData) {
    activeImage = image;
    sheetOpen = true;
  }

  function closeComments() {
    sheetOpen = false;
    activeImage = null;
  }

  async function share(image: MediaCardData) {
    const url = `${window.location.origin}/images/play/${image.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: image.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled or unsupported */
    }
  }
</script>

<div
  bind:this={container}
  class="shorts-scroller h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll md:mx-auto md:my-4 md:h-[calc(100dvh-2rem)] md:max-w-[480px] md:rounded-2xl md:border md:border-border"
>
  {#each images as image (image.id)}
    <section data-id={image.id} class="relative h-[100dvh] snap-start overflow-hidden bg-black">
      {#if image.coverUrl}
        <img
          src={image.coverUrl}
          alt={image.title}
          draggable="false"
          class="h-full w-full select-none object-contain"
          style="-webkit-user-drag: none;"
        />
      {/if}

      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

      <div class="absolute bottom-20 left-4 right-16 text-white">
        <div class="flex items-center gap-2">
          <span
            class="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-accent text-xs font-bold"
          >
            {(image.creatorName ?? '?').charAt(0)}
          </span>
          <span class="text-[13px] font-bold">{image.creatorName ?? '@creator'}</span>
        </div>
        <p class="mt-2 max-w-[280px] text-[12px] leading-5">{image.title}</p>
      </div>

      <div class="absolute bottom-20 right-3 flex flex-col items-center gap-5 text-white">
        <button type="button" aria-label="Share" onclick={() => share(image)} class="flex flex-col items-center gap-0.5">
          <span class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"></path>
              <path d="M16 6l-4-4-4 4"></path>
              <path d="M12 2v14"></path>
            </svg>
          </span>
          <span class="text-[10px] font-bold">Share</span>
        </button>

        <button type="button" aria-label="Comments" onclick={() => openComments(image)} class="flex flex-col items-center gap-0.5">
          <span class="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </span>
          <span class="text-[10px] font-bold">Comments</span>
        </button>
      </div>

      <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-white/25">
        <div class="h-full w-1/3 bg-white"></div>
      </div>
    </section>
  {/each}
</div>

{#if sheetOpen && activeImage}
  <div class="fixed inset-0 z-50 bg-black/60" onclick={closeComments} role="presentation"></div>
  <aside class="fixed inset-y-0 right-0 z-50 w-[380px] max-w-[92vw] overflow-y-auto border-l border-border bg-background p-5">
    <div class="mb-3 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onclick={closeComments}
        class="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-elevated"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    {#key activeImage.id}
      <Comments targetType="PUBLICATION" targetId={activeImage.id} signedIn={signedIn} labels={labels} />
    {/key}
  </aside>
{/if}

<style>
  .shorts-scroller {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .shorts-scroller::-webkit-scrollbar {
    display: none;
  }
</style>
