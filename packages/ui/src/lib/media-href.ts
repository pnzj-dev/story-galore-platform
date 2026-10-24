/** Minimal shape required to resolve a media route. */
export interface MediaHrefTarget {
  id: string;
  type: string;
  format?: string;
}

export interface MediaHrefOptions {
  /**
   * When true, link straight into the reader/player (with autoplay for
   * video/audio/post) for "Continue watching/reading". When false (default),
   * link to the media details page.
   */
  resume?: boolean;
}

/**
 * Canonical route for a media item. Single source of truth for media routing:
 * details pages (card clicks) vs. the immediate reader/player (continue rail).
 * Shorts have no details page and always open the player directly.
 */
export function mediaHref(item: MediaHrefTarget, opts: MediaHrefOptions = {}): string {
  const resume = Boolean(opts.resume);

  // Shorts open the player immediately (no details page).
  if (item.format === 'SHORT_FILM') {
    return `/shorts/play/${item.id}`;
  }

  switch (item.type) {
    case 'VIDEO':
      return resume ? `/watch/${item.id}/play` : `/watch/${item.id}`;
    case 'AUDIO':
      return resume ? `/listen/${item.id}/play` : `/listen/${item.id}`;
    case 'POST':
      return resume ? `/posts/${item.id}/play` : `/posts/${item.id}`;
    default:
      // BOOK (and MIXED fallback): the details page vs. the reader directly.
      return resume ? `/read/${item.id}` : `/stories/${item.id}`;
  }
}
