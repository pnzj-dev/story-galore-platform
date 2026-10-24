export type MediaType = 'BOOK' | 'POST' | 'VIDEO' | 'AUDIO' | 'MIXED';
export type ContentRating = 'ALL_AGES' | 'TEEN' | 'ADULT_18_PLUS';

/** Cover artwork orientation for a card. Defaults by media type when omitted. */
export type CardOrientation = 'PORTRAIT' | 'LANDSCAPE' | 'SQUARE';

export type ProgressInfo = {
  /** 0-100 */
  percentComplete: number;
  /** Human-readable resume label, e.g. "Page 12" or "12:34 left". */
  label?: string;
};

export type MediaCardData = {
  id: string;
  title: string;
  type: MediaType;
  /**
   * Registered catalog format/subtype, e.g. COMIC, MANGA, MANHWA, MANHUA, BANDE_DESSINEE,
   * NOVEL, LIGHT_NOVEL, MOVIE, TV_SHOW, SHORT_FILM, PODCAST, AUDIOBOOK, ILLUSTRATION.
   * Displayed as the card badge; falls back to the media-type label when absent.
   */
  format?: string;
  /** Cover orientation; defaults by media type when omitted. */
  orientation?: CardOrientation;
  contentRating?: ContentRating;
  coverUrl?: string;
  /** Landscape thumbnail/backdrop (used for the resume rail and detail hero). */
  backdropUrl?: string;
  creatorName?: string;
  /** Present for video/audio publications. */
  durationMs?: number;
  /** Present on the Continue rail for in-progress items. */
  progress?: ProgressInfo;
};

export type CreatorCardData = {
  /** Appwrite user ID (actorId). */
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  followerCount?: number;
};

export type PlaylistItem = {
  /** Stable identifier, e.g. media asset ID or episode publication ID. */
  id?: string;
  /** Display label, e.g. "Part 1" or an episode title. */
  label: string;
  /** Authorized delivery URL for this item. */
  src: string;
  /** Publication the item belongs to (for progress persistence). */
  publicationId?: string;
  /** Media asset ID of this item (for progress persistence). */
  mediaId?: string;
  /** Series episode ID, when the item is an episode. */
  episodeId?: string;
};
