<script lang="ts">
  import type { CardOrientation, MediaCardData } from '../types';

  let { publication, href }: { publication: MediaCardData; href: string } = $props();

  const typeLabels: Record<MediaCardData['type'], string> = {
    BOOK: 'Book',
    POST: 'Post',
    VIDEO: 'Video',
    AUDIO: 'Audio',
    MIXED: 'Mixed',
  };

  const formatLabels: Record<string, string> = {
    // Books
    NOVEL: 'Novel',
    LIGHT_NOVEL: 'Light Novel',
    NONFICTION: 'Nonfiction',
    EDUCATIONAL: 'Educational',
    COMIC: 'Comic',
    GRAPHIC_NOVEL: 'Graphic Novel',
    MANGA: 'Manga',
    MANHWA: 'Manhwa',
    MANHUA: 'Manhua',
    BANDE_DESSINEE: 'Bande Dessinée',
    WEBTOON: 'Webtoon',
    STRIP: 'Strip',
    // Videos
    MOVIE: 'Movie',
    TV_SHOW: 'Series',
    SHORT_FILM: 'Short Film',
    DOCUMENTARY: 'Documentary',
    ANIME: 'Anime',
    ANIMATION: 'Animation',
    SHORT: 'Short',
    // Audio
    PODCAST: 'Podcast',
    AUDIOBOOK: 'Audiobook',
    MUSIC: 'Music',
    SPOKEN_WORD: 'Spoken Word',
    // Images
    ILLUSTRATION: 'Illustration',
    PHOTOGRAPHY: 'Photography',
    DIGITAL_ART: 'Digital Art',
    FAN_ART: 'Fan Art',
  };

  const ratingLabels: Record<string, string> = {
    ALL_AGES: 'All ages',
    TEEN: 'Teen',
    ADULT_18_PLUS: '18+',
  };

  const defaultOrientation: Record<MediaCardData['type'], CardOrientation> = {
    BOOK: 'PORTRAIT',
    POST: 'LANDSCAPE',
    VIDEO: 'LANDSCAPE',
    AUDIO: 'SQUARE',
    MIXED: 'PORTRAIT',
  };

  const aspectClass: Record<CardOrientation, string> = {
    PORTRAIT: 'aspect-[2/3]',
    LANDSCAPE: 'aspect-video',
    SQUARE: 'aspect-square',
  };

  // Color-coded media badge per type (matches the UI mock).
  const badgeClass: Record<MediaCardData['type'], string> = {
    BOOK: 'bg-accent/90 text-white',
    POST: 'bg-warning/90 text-[#2b1a00]',
    VIDEO: 'bg-brand-500/90 text-white',
    AUDIO: 'bg-success/90 text-[#052015]',
    MIXED: 'bg-background/75 text-white',
  };

  function formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  let orientation = $derived(publication.orientation ?? defaultOrientation[publication.type]);
  let badge = $derived(formatLabels[publication.format ?? ''] ?? typeLabels[publication.type]);
  let imgFailed = $state(false);
</script>

<a
  href={href}
  class="group block w-full transition duration-200 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
  aria-label={`${publication.title} — ${badge}`}
>
  <div
    class="relative overflow-hidden rounded-md border border-border bg-surface shadow-card {aspectClass[orientation]}"
  >
    {#if publication.coverUrl && !imgFailed}
      <img
        src={publication.coverUrl}
        alt=""
        loading="lazy"
        draggable="false"
        onerror={() => (imgFailed = true)}
        class="h-full w-full select-none object-cover transition duration-300 group-hover:scale-105"
        style="-webkit-user-drag: none;"
      />
    {:else}
      <div
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-surface to-background text-3xl font-bold text-foreground-muted"
      >
        {publication.title.charAt(0)}
      </div>
    {/if}

    <span
      class="absolute start-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur {badgeClass[publication.type]}"
    >
      {badge}
    </span>

    {#if publication.durationMs}
      <span
        class="absolute bottom-2 end-2 rounded bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground"
      >
        {formatDuration(publication.durationMs)}
      </span>
    {/if}

    {#if publication.progress}
      <div class="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
        <div
          class="h-full bg-accent"
          style={`width:${Math.max(0, Math.min(100, publication.progress.percentComplete))}%`}
        ></div>
      </div>
    {/if}
  </div>

  <h3 class="mt-3 line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
    {publication.title}
  </h3>
  {#if publication.creatorName}
    <p class="mt-0.5 truncate text-[12px] text-foreground-tertiary">{publication.creatorName}</p>
  {/if}

  {#if publication.contentRating && publication.contentRating !== 'ALL_AGES'}
    <span
      class="mt-1 inline-block rounded border border-border px-1 py-0.5 text-[10px] text-foreground-muted"
      aria-label={`Content rating: ${ratingLabels[publication.contentRating]}`}
    >
      {ratingLabels[publication.contentRating]}
    </span>
  {/if}
</a>
