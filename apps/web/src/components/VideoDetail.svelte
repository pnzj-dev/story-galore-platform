<script lang="ts">
  import { actions } from 'astro:actions';
  import { MediaPlaylist, type PlaylistItem } from '@storygalore/ui';

  let {
    publicationId,
    items,
    initialIndex = 0,
    initialTime = 0,
  }: {
    publicationId: string;
    items: PlaylistItem[];
    initialIndex?: number;
    initialTime?: number;
  } = $props();

  let lastSave = 0;

  function percentFor(index: number): number {
    const total = items.length;
    return total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
  }

  function save(item: PlaylistItem, position: number, index: number) {
    actions
      .saveReadingProgress({
        publicationId: item.publicationId ?? publicationId,
        position,
        percentComplete: percentFor(index),
        pageId: item.mediaId ?? item.id ?? undefined,
        episodeId: item.episodeId ?? undefined,
      })
      .catch(() => {});
  }

  function onItemChange(index: number, item: PlaylistItem) {
    lastSave = 0;
    save(item, 0, index);
  }

  function onProgress(index: number, item: PlaylistItem, seconds: number) {
    // Throttle: persist at most once every 5 seconds.
    const now = Date.now();
    if (now - lastSave < 5000) return;
    lastSave = now;
    save(item, Math.floor(seconds), index);
  }
</script>

<MediaPlaylist
  {items}
  guarded
  kind="video"
  {initialIndex}
  {initialTime}
  onitemchange={onItemChange}
  onprogress={onProgress}
/>
