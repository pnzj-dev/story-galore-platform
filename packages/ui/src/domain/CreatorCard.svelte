<script lang="ts">
  import type { CreatorCardData } from '../types';

  let { creator, href }: { creator: CreatorCardData; href: string } = $props();
</script>

<a
  href={href}
  class="group flex w-full items-center gap-3 rounded-md border border-border bg-surface p-3 transition hover:-translate-y-1 hover:border-foreground-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
>
  <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-elevated">
    {#if creator.avatarUrl}
      <img
        src={creator.avatarUrl}
        alt=""
        loading="lazy"
        class="h-full w-full object-cover"
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center text-sm font-bold text-foreground-muted">
        {creator.displayName.charAt(0)}
      </div>
    {/if}
  </div>
  <div class="min-w-0">
    <p class="truncate text-sm font-medium text-foreground">{creator.displayName}</p>
    <p class="truncate text-xs text-foreground-muted">@{creator.handle}</p>
  </div>
</a>
