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

# --- Download cover images (real photos from Unsplash) --------------------

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

# Deterministic real-photo covers: publication id -> Unsplash photo + crop size.
COVER_SEEDS="
seed-book-1:photo-1544947950-fa07a98d237f:600x900
seed-book-2:photo-1532012197267-da84d127e765:600x900
seed-video-1:photo-1478720568477-152d9b164e26:800x450
seed-video-2:photo-1489599849927-2ee91cede3ba:800x450
seed-art-1:photo-1512820790803-83ca734da794:800x450
seed-audio-1:photo-1495446815901-a7297e633e8d:600x600
"

for entry in $COVER_SEEDS; do
  pid="${entry%%:*}"
  rest="${entry#*:}"
  photoid="${rest%%:*}"
  size="${rest##*:}"
  w="${size%x*}"
  h="${size#*x}"
  curl -sL -o "$TMPDIR/$pid.jpg" "https://images.unsplash.com/${photoid}?w=${w}&h=${h}&fit=crop&q=80" \
    || echo "warning: could not download cover for $pid" >&2
done

# --- Creators ------------------------------------------------------------

echo "Seeding creators..."
create_row "creators" "seed-creator-1" '{"actorId":"seed-creator-1","handle":"elenavoss","displayName":"Elena Voss","bio":"Writer of speculative fiction and serialized novels.","creatorStatus":"ACTIVE","verificationStatus":"VERIFIED","followerCountProjection":1284,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "creators" "seed-creator-2" '{"actorId":"seed-creator-2","handle":"kaitonak","displayName":"Kaito Nakamura","bio":"Comics, manga, and visual storytelling.","creatorStatus":"ACTIVE","verificationStatus":"VERIFIED","followerCountProjection":947,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "creators" "seed-creator-3" '{"actorId":"seed-creator-3","handle":"miraokafor","displayName":"Mira Okafor","bio":"Illustrator and short-film maker.","creatorStatus":"ACTIVE","verificationStatus":"UNVERIFIED","followerCountProjection":512,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'

# --- Covers (upload + media_assets) --------------------------------------

echo "Seeding covers..."
for pid in seed-book-1 seed-book-2 seed-video-1 seed-video-2 seed-art-1 seed-audio-1; do
  case "$pid" in
    seed-book-1|seed-video-1) creator="seed-creator-1" ;;
    seed-book-2|seed-audio-1) creator="seed-creator-2" ;;
    seed-video-2|seed-art-1)  creator="seed-creator-3" ;;
  esac
  file="$TMPDIR/$pid.jpg"
  file_id="$pid-cover"
  if ! row_exists "media_assets" "$file_id"; then
    appwrite storage create-file --bucket-id "$BUCKET" --file "$file" --file-id "$file_id" --folder "seed" >/dev/null
  fi
  size=$(wc -c < "$file" | tr -d ' ')
  asset_id="$file_id"
  create_row "media_assets" "$asset_id" '{"id":"'"$asset_id"'","creatorId":"'"$creator"'","publicationId":"'"$pid"'","type":"IMAGE","status":"READY","originProvider":"seed","originBucketKey":"'"$BUCKET"'","originFileId":"'"$file_id"'","mimeType":"image/jpeg","sizeBytes":'"$size"',"moderationStatus":"APPROVED","contentRating":"ALL_AGES","orientation":"PORTRAIT","variant":"ORIGINAL","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
done

# --- Publications ---------------------------------------------------------

echo "Seeding publications..."
create_row "publications" "seed-book-1" '{"creatorId":"seed-creator-1","projectId":"seed-project-1","type":"BOOK","status":"PUBLISHED","accessClass":"FREE","title":"The Clockmaker'"'"'s Apprentice","description":"A young apprentice discovers the workshop runs on borrowed time.","format":"NOVEL","contentRating":"ALL_AGES","contentOrigin":"HUMAN","readingFormat":"PAGINATED","pageCount":24,"publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "publications" "seed-book-2" '{"creatorId":"seed-creator-2","projectId":"seed-project-2","type":"BOOK","status":"PUBLISHED","accessClass":"SUBSCRIPTION","title":"Neon Drift: Issue One","description":"A courier races through a city that rewrites itself at dusk.","format":"COMIC","contentRating":"TEEN","contentOrigin":"HUMAN","readingFormat":"PAGINATED","pageCount":32,"publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "publications" "seed-video-1" '{"creatorId":"seed-creator-1","projectId":"seed-project-1","type":"VIDEO","status":"PUBLISHED","accessClass":"SUBSCRIPTION","title":"The Last Lighthouse — S1E1","description":"Keeper Mara realizes the light has stopped warning ships away.","format":"TV_SHOW","contentRating":"TEEN","contentOrigin":"HUMAN","publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "publications" "seed-video-2" '{"creatorId":"seed-creator-3","projectId":"seed-project-3","type":"VIDEO","status":"PUBLISHED","accessClass":"FREE","title":"Static","description":"A three-minute short about the last analog radio.","format":"SHORT_FILM","contentRating":"ALL_AGES","contentOrigin":"HUMAN","publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "publications" "seed-art-1" '{"creatorId":"seed-creator-3","projectId":"seed-project-3","type":"POST","status":"PUBLISHED","accessClass":"FREE","title":"Sky Gardens","description":"An original illustration of floating terraced gardens.","format":"ILLUSTRATION","contentRating":"ALL_AGES","contentOrigin":"HUMAN","mediaAssetIds":["seed-art-1-cover"],"publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
create_row "publications" "seed-audio-1" '{"creatorId":"seed-creator-2","projectId":"seed-project-2","type":"AUDIO","status":"PUBLISHED","accessClass":"FREE","title":"Worldbuilding Weekly #12","description":"Designing magic systems that feel inevitable.","format":"PODCAST","contentRating":"ALL_AGES","contentOrigin":"HUMAN","publishedAt":"'"$NOW"'","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'

echo ""
echo "Seed complete. Sample data is live on the public surface."
