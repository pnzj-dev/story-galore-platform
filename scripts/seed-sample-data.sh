#!/usr/bin/env bash
#
# Seed sample creators, publications, and cover images into the Appwrite
# project so the public browse/detail surfaces have real data to render.
#
# Usage:
#   cd <repo root>
#   set -a && source .env && set +a
#   bash scripts/seed-sample-data.sh
#
# Idempotent: rows use deterministic IDs and are skipped when they already exist.

set -euo pipefail

DB="main"
BUCKET="public-assets"
NOW="2026-10-18T00:00:00.000Z"

if [ -z "${APPWRITE_API_KEY:-}" ]; then
  echo "APPWRITE_API_KEY is not set. Source .env first." >&2
  exit 1
fi

# --- Helpers -------------------------------------------------------------

row_exists() {
  local table="$1" id="$2"
  appwrite tablesdb get-row --database-id "$DB" --table-id "$table" --row-id "$id" --json >/dev/null 2>&1
}

create_row() {
  local table="$1" id="$2" data="$3"
  if row_exists "$table" "$id"; then
    echo "  skip (exists): $table/$id"
    return 0
  fi
  appwrite tablesdb create-row --database-id "$DB" --table-id "$table" --row-id "$id" --data "$data" >/dev/null
  echo "  created: $table/$id"
}

# --- Creators ------------------------------------------------------------

echo "Seeding creators..."
create_row "creators" "seed-creator-1" '{"actorId":"seed-creator-1","handle":"elenavoss","displayName":"Elena Voss","bio":"Writer of speculative fiction and serialized novels.","creatorStatus":"ACTIVE","verificationStatus":"VERIFIED","followerCountProjection":1284,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "creators" "seed-creator-2" '{"actorId":"seed-creator-2","handle":"kaitonak","displayName":"Kaito Nakamura","bio":"Comics, manga, and visual storytelling.","creatorStatus":"ACTIVE","verificationStatus":"VERIFIED","followerCountProjection":947,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "creators" "seed-creator-3" '{"actorId":"seed-creator-3","handle":"miraokafor","displayName":"Mira Okafor","bio":"Illustrator and short-film maker.","creatorStatus":"ACTIVE","verificationStatus":"UNVERIFIED","followerCountProjection":512,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'

# --- Covers (download) ---------------------------------------------------

# pid:photoid:w:h
COVER_SEEDS="
seed-book-1:photo-1544947950-fa07a98d237f:600:900
seed-book-2:photo-1532012197267-da84d127e765:600:900
seed-book-3:photo-1512820790803-83ca734da794:600:900
seed-book-4:photo-1495446815901-a7297e633e8d:600:900
seed-book-5:photo-1544947950-fa07a98d237f:600:900
seed-book-6:photo-1532012197267-da84d127e765:600:900
seed-video-1:photo-1478720568477-152d9b164e26:800:450
seed-video-2:photo-1489599849927-2ee91cede3ba:600:1067
seed-video-3:photo-1489599849927-2ee91cede3ba:800:450
seed-video-4:photo-1440404653325-ab127d49abc1:800:450
seed-video-5:photo-1518676590629-3dcbd9c5a5c9:800:450
seed-video-6:photo-1485846234645-a62644f84728:800:450
seed-video-7:photo-1478720568477-152d9b164e26:800:450
seed-short-1:photo-1535713875002-d1d0cf377fde:600:1067
seed-short-2:photo-1507003211169-0a1dd7228f2d:600:1067
seed-short-3:photo-1518676590629-3dcbd9c5a5c9:600:1067
seed-short-4:photo-1535713875002-d1d0cf377fde:600:1067
seed-short-5:photo-1440404653325-ab127d49abc1:600:1067
seed-short-6:photo-1507003211169-0a1dd7228f2d:600:1067
seed-art-1:photo-1512820790803-83ca734da794:800:450
seed-audio-1:photo-1495446815901-a7297e633e8d:600:600
"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

for entry in $COVER_SEEDS; do
  pid="${entry%%:*}"
  rest="${entry#*:}"
  photoid="${rest%%:*}"
  rest2="${rest#*:}"
  size="${rest2#*:}"
  w="${rest2%%:*}"
  h="${size}"
  curl -sL -o "$TMPDIR/$pid.jpg" "https://images.unsplash.com/${photoid}?w=${w}&h=${h}&fit=crop&q=80" \
    || echo "warning: could not download cover for $pid" >&2
done

# --- Covers (upload + media_assets) --------------------------------------

echo "Seeding covers..."
for pid in seed-book-1 seed-book-2 seed-book-3 seed-book-4 seed-book-5 seed-book-6 \
           seed-video-1 seed-video-2 seed-video-3 seed-video-4 seed-video-5 seed-video-6 seed-video-7 \
           seed-short-1 seed-short-2 seed-short-3 seed-short-4 seed-short-5 seed-short-6 \
           seed-art-1 seed-audio-1; do
  case "$pid" in
    seed-book-1|seed-book-3|seed-book-5|seed-video-1|seed-video-4|seed-video-7) creator="seed-creator-1" ;;
    seed-book-2|seed-book-4|seed-video-3|seed-video-6|seed-short-3|seed-short-5|seed-audio-1) creator="seed-creator-2" ;;
    *) creator="seed-creator-3" ;;
  esac
  file="$TMPDIR/$pid.jpg"
  file_id="$pid-cover"
  if ! row_exists "media_assets" "$file_id"; then
    appwrite storage create-file --bucket-id "$BUCKET" --file "$file" --file-id "$file_id" --folder "seed" >/dev/null
  fi
  size=$(wc -c < "$file" | tr -d ' ')
  create_row "media_assets" "$file_id" '{"id":"'"$file_id"'","creatorId":"'"$creator"'","publicationId":"'"$pid"'","type":"IMAGE","status":"READY","originProvider":"seed","originBucketKey":"'"$BUCKET"'","originFileId":"'"$file_id"'","mimeType":"image/jpeg","sizeBytes":'"$size"',"moderationStatus":"APPROVED","contentRating":"ALL_AGES","orientation":"PORTRAIT","variant":"ORIGINAL","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
done

# --- Publications ---------------------------------------------------------

echo "Seeding publications..."
# pid|title|type|format|creator|accessClass|contentRating|description
PUBS="
seed-book-1|The Clockmaker's Apprentice|BOOK|NOVEL|seed-creator-1|FREE|ALL_AGES|A young apprentice discovers the workshop runs on borrowed time.
seed-book-2|Neon Drift: Issue One|BOOK|COMIC|seed-creator-2|SUBSCRIPTION|TEEN|A courier races through a city that rewrites itself at dusk.
seed-book-3|The Glass Orchard|BOOK|NOVEL|seed-creator-1|FREE|ALL_AGES|In a walled garden of glass, every fruit holds a stolen memory.
seed-book-4|Crimson Ledger|BOOK|MANGA|seed-creator-2|SUBSCRIPTION|TEEN|A bookkeeper for the underworld balances debts that can never be repaid.
seed-book-5|Quiet Machinery|BOOK|NOVEL|seed-creator-1|FREE|ALL_AGES|The machines stopped working, and the city learned to listen again.
seed-book-6|Letters to the Tide|BOOK|NOVEL|seed-creator-3|FREE|ALL_AGES|Two lovers separated by an ocean send letters that arrive out of order.
seed-video-1|The Last Lighthouse — S1E1|VIDEO|TV_SHOW|seed-creator-1|SUBSCRIPTION|TEEN|Keeper Mara realizes the light has stopped warning ships away.
seed-video-2|Static|VIDEO|SHORT_FILM|seed-creator-3|FREE|ALL_AGES|A three-minute short about the last analog radio.
seed-video-3|Echoes of the Deep|VIDEO|TV_SHOW|seed-creator-2|SUBSCRIPTION|TEEN|A research crew hears something answer from the trench.
seed-video-4|Paper Cities|VIDEO|MOVIE|seed-creator-1|FREE|ALL_AGES|An archivist discovers the city's maps redraw themselves each night.
seed-video-5|Northern Light|VIDEO|TV_SHOW|seed-creator-3|SUBSCRIPTION|TEEN|A remote station picks up a signal that predates humanity.
seed-video-6|The Long Field|VIDEO|DOCUMENTARY|seed-creator-2|FREE|ALL_AGES|A year in the life of the last family farm on the coast.
seed-video-7|Salt & Signal|VIDEO|MOVIE|seed-creator-1|SUBSCRIPTION|TEEN|A lighthouse keeper and a radio operator fall in love across static.
seed-short-1|Sketch in 60s|VIDEO|SHORT_FILM|seed-creator-3|FREE|ALL_AGES|A time-lapse portrait drawn in a single minute.
seed-short-2|Cover Reveal|VIDEO|SHORT_FILM|seed-creator-2|FREE|ALL_AGES|The animated cover reveal for Crimson Ledger Vol. 2.
seed-short-3|Night Market|VIDEO|SHORT_FILM|seed-creator-3|FREE|ALL_AGES|A neon stroll through a market that only opens after midnight.
seed-short-4|Panel Flip|VIDEO|SHORT_FILM|seed-creator-2|FREE|ALL_AGES|A comic panel comes to life frame by frame.
seed-short-5|Colour Test|VIDEO|SHORT_FILM|seed-creator-3|FREE|ALL_AGES|A study in light and colour for an upcoming film.
seed-short-6|Typography|VIDEO|SHORT_FILM|seed-creator-2|FREE|ALL_AGES|A kinetic type experiment set to an ambient score.
seed-art-1|Sky Gardens|POST|ILLUSTRATION|seed-creator-3|FREE|ALL_AGES|An original illustration of floating terraced gardens.
seed-audio-1|Worldbuilding Weekly #12|AUDIO|PODCAST|seed-creator-2|FREE|ALL_AGES|Designing magic systems that feel inevitable.
"

while IFS='|' read -r pid title ptype format creator accessClass rating desc; do
  [ -z "$pid" ] && continue
  create_row "publications" "$pid" '{"creatorId":"'"$creator"'","projectId":"seed-project-1","type":"'"$ptype"'","status":"PUBLISHED","accessClass":"'"$accessClass"'","title":"'"$title"'","description":"'"$desc"'","format":"'"$format"'","contentRating":"'"$rating"'","contentOrigin":"HUMAN","readingFormat":"PAGINATED","publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
done <<< "$PUBS"

echo ""
echo "Seed complete. Sample data is live on the public surface."
