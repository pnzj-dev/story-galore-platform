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

# --- Generate placeholder cover PNGs (solid color) -----------------------

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

python3 - "$TMPDIR" <<'PY'
import struct, zlib, sys, os
out = sys.argv[1]

def solid_png(path, w, h, rgb):
    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        c += struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        return c
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)  # 8-bit truecolor RGB
    raw = b"".join(b"\x00" + bytes(rgb) * w for _ in range(h))
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)

covers = {
    "seed-book-1":   (139, 94, 60),    # warm brown
    "seed-book-2":   (255, 95, 162),   # neon pink
    "seed-video-1":  (30, 58, 95),     # deep blue
    "seed-video-2":  (90, 90, 110),    # slate
    "seed-art-1":    (42, 157, 143),   # teal
    "seed-audio-1":  (109, 74, 158),   # purple
}
for pid, rgb in covers.items():
    solid_png(os.path.join(out, pid + ".png"), 400, 600, rgb)
print("generated", len(covers), "covers")
PY

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
  file="$TMPDIR/$pid.png"
  file_id="$pid-cover"
  if ! row_exists "media_assets" "$file_id"; then
    appwrite storage create-file --bucket-id "$BUCKET" --file "$file" --file-id "$file_id" --folder "seed" >/dev/null
  fi
  size=$(wc -c < "$file" | tr -d ' ')
  asset_id="$file_id"
  create_row "media_assets" "$asset_id" '{"id":"'"$asset_id"'","creatorId":"'"$creator"'","publicationId":"'"$pid"'","type":"IMAGE","status":"READY","originProvider":"seed","originBucketKey":"'"$BUCKET"'","originFileId":"'"$file_id"'","mimeType":"image/png","sizeBytes":'"$size"',"moderationStatus":"APPROVED","contentRating":"ALL_AGES","orientation":"PORTRAIT","variant":"ORIGINAL","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
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
