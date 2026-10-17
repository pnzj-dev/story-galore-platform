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
