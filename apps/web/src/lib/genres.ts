export interface GenreLink {
  label: string;
  href: string;
}

/**
 * Curated genre navigation list. Genres are data-driven catalog classifications
 * (contracts/domain/media-catalog-taxonomy.yaml); labels are display text and
 * must be localized rather than used as stable identifiers.
 */
export const GENRES: GenreLink[] = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Slice of Life',
  'Superhero',
].map((label) => ({
  label,
  href: `/discover?genre=${encodeURIComponent(label.toLowerCase().replace(/\s+/g, '-'))}`,
}));
