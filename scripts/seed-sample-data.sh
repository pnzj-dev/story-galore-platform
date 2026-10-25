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

# --- Plans ---------------------------------------------------------------

echo "Seeding plans..."
# id|name|scope|amount|interval|adFree|description
PLANS="
plan-premium-monthly|StoryGalore Premium|PLATFORM|999|MONTH|true|Ad-free reading, all premium titles, offline downloads
plan-premium-annual|StoryGalore Premium — Annual|PLATFORM|9900|YEAR|true|Two months free vs monthly
plan-creator-monthly|Creator Supporter|CREATOR|499|MONTH|false|Unlock this creator's premium + early access
"

while IFS='|' read -r pid name scope amount interval adFree desc; do
  [ -z "$pid" ] && continue
  create_row "plans" "$pid" '{"code":"'"${pid#plan-}"'","name":"'"$name"'","description":"'"$desc"'","status":"ACTIVE","scope":"'"$scope"'","currency":"USD","amount":'"$amount"',"billingInterval":"'"$interval"'","billingIntervalCount":1,"trialDays":0,"adFree":'"$adFree"',"version":1,"createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
done <<< "$PLANS"

# --- Artwork (download) ---------------------------------------------------

# pid:photoid — used for both the portrait cover and (for video/art) the landscape backdrop.
ARTWORK_SEEDS="
seed-book-1:photo-1544947950-fa07a98d237f
seed-book-2:photo-1532012197267-da84d127e765
seed-book-3:photo-1512820790803-83ca734da794
seed-book-4:photo-1495446815901-a7297e633e8d
seed-book-5:photo-1544947950-fa07a98d237f
seed-book-6:photo-1532012197267-da84d127e765
seed-video-1:photo-1478720568477-152d9b164e26
seed-video-2:photo-1489599849927-2ee91cede3ba
seed-video-3:photo-1489599849927-2ee91cede3ba
seed-video-4:photo-1440404653325-ab127d49abc1
seed-video-5:photo-1518676590629-3dcbd9c5a5c9
seed-video-6:photo-1485846234645-a62644f84728
seed-video-7:photo-1478720568477-152d9b164e26
seed-short-1:photo-1535713875002-d1d0cf377fde
seed-short-2:photo-1507003211169-0a1dd7228f2d
seed-short-3:photo-1518676590629-3dcbd9c5a5c9
seed-short-4:photo-1535713875002-d1d0cf377fde
seed-short-5:photo-1440404653325-ab127d49abc1
seed-short-6:photo-1507003211169-0a1dd7228f2d
seed-art-1:photo-1512820790803-83ca734da794
seed-audio-1:photo-1495446815901-a7297e633e8d
"

# Publications that also get a landscape backdrop (detail hero + resume card).
BACKDROP_PIDS="seed-video-1 seed-video-2 seed-video-3 seed-video-4 seed-video-5 seed-video-6 seed-video-7 seed-art-1"

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

for entry in $ARTWORK_SEEDS; do
  pid="${entry%%:*}"
  photoid="${entry#*:}"
  curl -sL -o "$TMPDIR/$pid-cover.jpg" "https://images.unsplash.com/${photoid}?w=600&h=900&fit=crop&q=80" \
    || echo "warning: could not download cover for $pid" >&2
  case " $BACKDROP_PIDS " in
    *" $pid "*) curl -sL -o "$TMPDIR/$pid-backdrop.jpg" "https://images.unsplash.com/${photoid}?w=1600&h=900&fit=crop&q=80" \
      || echo "warning: could not download backdrop for $pid" >&2 ;;
  esac
done

# --- Artwork (upload + media_assets) --------------------------------------

echo "Seeding artwork..."
for pid in seed-book-1 seed-book-2 seed-book-3 seed-book-4 seed-book-5 seed-book-6 \
           seed-video-1 seed-video-2 seed-video-3 seed-video-4 seed-video-5 seed-video-6 seed-video-7 \
           seed-short-1 seed-short-2 seed-short-3 seed-short-4 seed-short-5 seed-short-6 \
           seed-art-1 seed-audio-1; do
  case "$pid" in
    seed-book-1|seed-book-3|seed-book-5|seed-video-1|seed-video-4|seed-video-7) creator="seed-creator-1" ;;
    seed-book-2|seed-book-4|seed-video-3|seed-video-6|seed-short-3|seed-short-5|seed-audio-1) creator="seed-creator-2" ;;
    *) creator="seed-creator-3" ;;
  esac

  # Portrait cover
  file="$TMPDIR/$pid-cover.jpg"
  file_id="$pid-cover"
  if ! row_exists "media_assets" "$file_id"; then
    appwrite storage create-file --bucket-id "$BUCKET" --file "$file" --file-id "$file_id" --folder "seed" >/dev/null
  fi
  size=$(wc -c < "$file" | tr -d ' ')
  create_row "media_assets" "$file_id" '{"id":"'"$file_id"'","creatorId":"'"$creator"'","publicationId":"'"$pid"'","type":"IMAGE","status":"READY","originProvider":"seed","originBucketKey":"'"$BUCKET"'","originFileId":"'"$file_id"'","mimeType":"image/jpeg","sizeBytes":'"$size"',"moderationStatus":"APPROVED","contentRating":"ALL_AGES","orientation":"PORTRAIT","variant":"ORIGINAL","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'

  # Landscape backdrop (video/art only)
  case " $BACKDROP_PIDS " in
    *" $pid "*)
      bfile="$TMPDIR/$pid-backdrop.jpg"
      bfile_id="$pid-backdrop"
      if ! row_exists "media_assets" "$bfile_id"; then
        appwrite storage create-file --bucket-id "$BUCKET" --file "$bfile" --file-id "$bfile_id" --folder "seed" >/dev/null
      fi
      bsize=$(wc -c < "$bfile" | tr -d ' ')
      create_row "media_assets" "$bfile_id" '{"id":"'"$bfile_id"'","creatorId":"'"$creator"'","publicationId":"'"$pid"'","type":"IMAGE","status":"READY","originProvider":"seed","originBucketKey":"'"$BUCKET"'","originFileId":"'"$bfile_id"'","mimeType":"image/jpeg","sizeBytes":'"$bsize"',"moderationStatus":"APPROVED","contentRating":"ALL_AGES","orientation":"LANDSCAPE","variant":"ORIGINAL","createdAt":"'"$NOW"'","updatedAt":"'"$NOW"'"}'
      ;;
  esac
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

# --- Publication language metadata -----------------------------------------
# Required so ONLY_SELECTED content-language filtering doesn't drop every
# publication (English seed content).
echo "Seeding publication language metadata..."
for pid in seed-book-1 seed-book-2 seed-book-3 seed-book-4 seed-book-5 seed-book-6 \
           seed-video-1 seed-video-2 seed-video-3 seed-video-4 seed-video-5 seed-video-6 seed-video-7 \
           seed-short-1 seed-short-2 seed-short-3 seed-short-4 seed-short-5 seed-short-6 \
           seed-art-1 seed-audio-1; do
  create_row "publication_language_metadata" "seed-lang-$pid" '{"publicationId":"'"$pid"'","contentLanguageMode":"LANGUAGE_BEARING","primaryLanguage":"en","contentLanguages":["en"]}'
done

# --- Rating + genres (media detail meta-row fidelity) ----------------------
echo "Seeding rating/genres..."
# id|qualityRating|genre1,genre2,...
GENRES="
seed-video-1|4.8|Drama,Mystery,Adventure
seed-video-2|4.2|Short,Drama
seed-video-3|4.6|Mystery,Adventure
seed-video-4|4.4|Drama,Adventure
seed-video-5|4.1|Drama,SciFi
seed-video-6|4.0|Documentary,Nature
seed-video-7|4.5|Drama,Romance
"
while IFS='|' read -r pid quality genres; do
  [ -z "$pid" ] && continue
  appwrite tablesdb update-row --database-id main --table-id publications --row-id "$pid" --data '{"rating":'"$quality"',"genres":["'"${genres//,/\",\"}"'"]}' >/dev/null
done <<< "$GENRES"

# --- Prose pages (novels) -------------------------------------------------

echo "Seeding prose..."
python3 - <<'PY'
import json, subprocess

NOW = "2026-10-18T00:00:00.000Z"
prose = {
    "seed-book-1": [
        "The workshop smelled of brass and cold oil. Mara had been told never to touch the clocks after midnight, but the largest one, the one with no face, had begun to tick on its own.",
        "She held the lantern higher. Every pendulum in the room swung in perfect time except one. It hung still, and beneath it, a small door stood ajar.",
        "Her master had said the workshop ran on borrowed time. She had thought it a joke. Now, watching the hands spin backward, she understood he had meant it literally.",
    ],
    "seed-book-3": [
        "In the walled garden of glass, every fruit held a stolen memory. The caretaker walked the rows at dawn, naming the seasons by their weight.",
        "She plucked a pear the color of an autumn afternoon and pressed it to her lips. Somewhere behind her eyes, a stranger's childhood bloomed.",
        "The garden had been her mother's, and her grandmother's before that. They had all learned, eventually, that you cannot keep what was never yours to grow.",
    ],
    "seed-book-5": [
        "The machines stopped working on a Tuesday, and the city learned to listen again. At first there was only the sound of wind and the soft tick of cooling metal.",
        "In the silence, the old engineer heard something he had missed for forty years: the city breathing. It had been there all along, under the hum.",
        "He did not try to restart the machines. Instead, he opened the windows and let the quiet in, and for the first time in decades, the city slept.",
    ],
    "seed-book-6": [
        "The first letter arrived on a morning thick with fog. It was dated a month ahead, and it was addressed to a woman who had not yet left.",
        "She wrote back anyway, pressing the ink hard into the page. The sea took the letter, and a week later, one returned, dated the day before she had written it.",
        "They wrote across the months, out of order, until the letters became a conversation neither of them remembered starting but both refused to end.",
    ],
}

for pid, paras in prose.items():
    for i, text in enumerate(paras):
        row_id = f"{pid}-page-{i}"
        data = json.dumps({"publicationId": pid, "position": i, "text": text, "createdAt": NOW, "updatedAt": NOW})
        check = subprocess.run(["appwrite", "tablesdb", "get-row", "--database-id", "main", "--table-id", "book_pages", "--row-id", row_id, "--json"], capture_output=True, text=True)
        if check.returncode == 0:
            print(f"  skip (exists): book_pages/{row_id}")
            continue
        subprocess.run(["appwrite", "tablesdb", "create-row", "--database-id", "main", "--table-id", "book_pages", "--row-id", row_id, "--data", data], capture_output=True, text=True)
        print(f"  created: book_pages/{row_id}")
PY

echo ""
echo "Seed complete. Sample data is live on the public surface."
