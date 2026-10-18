<script lang="ts">
  import type { MediaCardData } from '../types';

  let { publication, href }: { publication: MediaCardData; href: string } = $props();
  let imgFailed = $state(false);
</script>

<a
  href={href}
  class="group relative block aspect-[9/16] overflow-hidden rounded-xl border border-border bg-surface shadow-card transition hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
  aria-label={publication.title}
>
  {#if publication.coverUrl && !imgFailed}
    <img
      src={publication.coverUrl}
      alt=""
      loading="lazy"
      onerror={() => (imgFailed = true)}
      class="h-full w-full object-cover"
    />
  {:else}
    <div
      class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-surface to-background text-3xl font-bold text-foreground-muted"
    >
      {publication.title.charAt(0)}
    </div>
  {/if}

  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

  <div class="absolute inset-0 grid place-items-center">
    <div
      class="grid h-11 w-11 place-items-center rounded-full border border-white/50 bg-white/20 text-white backdrop-blur transition group-hover:scale-105"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"></path>
      </svg>
    </div>
  </div>

  <div class="absolute inset-x-3 bottom-3 z-10 text-white">
    <p class="truncate text-[12px] font-bold">{publication.creatorName ?? "@creator"}</p>
    <p class="truncate text-[11px] opacity-80">{publication.title}</p>
  </div>
</a>
