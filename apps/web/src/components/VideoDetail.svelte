<script lang="ts">
  import { actions } from 'astro:actions';
  import { MediaPlaylist, type PlaylistItem } from '@storygalore/ui';

  let {
    publicationId,
    items,
    initialIndex = 0,
  }: {
    publicationId: string;
    items: PlaylistItem[];
    initialIndex?: number;
  } = $props();

  function onItemChange(index: number, item: PlaylistItem) {
    const total = items.length;
    const percent = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;
    actions
      .saveReadingProgress({
        publicationId: item.publicationId ?? publicationId,
        position: 0,
        percentComplete: percent,
        pageId: item.mediaId ?? item.id ?? undefined,
        episodeId: item.episodeId ?? undefined,
      })
      .catch(() => {});
  }
</script>

<MediaPlaylist {items} guarded kind="video" {initialIndex} onitemchange={onItemChange} />
