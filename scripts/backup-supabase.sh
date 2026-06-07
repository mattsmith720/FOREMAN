#!/usr/bin/env bash
# Read-only Supabase export for Foreman pilot project uvlgbsiwyvtsjlqzozas.
# Dumps Postgres (schema, roles, data) and downloads private storage objects.
# Does not modify, delete, or restore anything remotely or locally beyond writing backup files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/backend/.env}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_DIR="${OUT_DIR:-$ROOT/backups/supabase/$STAMP}"
SKIP_STORAGE="${SKIP_STORAGE:-0}"
SKIP_DB="${SKIP_DB:-0}"

red() { printf "\033[31m%s\033[0m\n" "$1" >&2; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }

usage() {
  cat <<'EOF'
Usage: scripts/backup-supabase.sh

Environment (set in backend/.env or export before running):
  SUPABASE_URL              Project URL (required for storage export)
  SUPABASE_SERVICE_ROLE_KEY Service role JWT (required for storage export)
  SUPABASE_DB_URL           Full Postgres connection string (required for DB dump)
                            Get from Dashboard → Connect → Session pooler.
                            Example:
                            postgresql://postgres.uvlgbsiwyvtsjlqzozas:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres

Optional:
  OUT_DIR=<path>            Backup destination (default: backups/supabase/<UTC timestamp>)
  SKIP_STORAGE=1            Skip storage object download
  SKIP_DB=1                 Skip database dump
  ENV_FILE=<path>           Alternate env file (default: backend/.env)

Requires: supabase CLI, Docker Desktop (for supabase db dump), curl, python3
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    red "Missing required command: $1"
    exit 1
  fi
}

load_env() {
  if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +a
  fi
}

require_db_url() {
  if [ -z "${SUPABASE_DB_URL:-}" ]; then
    red "SUPABASE_DB_URL is not set."
    echo ""
    echo "Set the Session pooler connection string from:"
    echo "  https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/database/settings"
    echo "  → Connect → Session pooler"
    echo ""
    echo "Export it before running, e.g.:"
    echo '  export SUPABASE_DB_URL="postgresql://postgres.uvlgbsiwyvtsjlqzozas:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"'
    exit 1
  fi
}

require_storage_env() {
  if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    red "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for storage export."
    exit 1
  fi
}

dump_database() {
  require_cmd supabase
  require_db_url

  mkdir -p "$OUT_DIR/db"

  yellow "Dumping database to $OUT_DIR/db (read-only pg_dump via Supabase CLI)…"

  supabase db dump \
    --db-url "$SUPABASE_DB_URL" \
    -f "$OUT_DIR/db/roles.sql" \
    --role-only

  supabase db dump \
    --db-url "$SUPABASE_DB_URL" \
    -f "$OUT_DIR/db/schema.sql"

  supabase db dump \
    --db-url "$SUPABASE_DB_URL" \
    -f "$OUT_DIR/db/data.sql" \
    --use-copy \
    --data-only \
    -x "storage.buckets_vectors" \
    -x "storage.vector_indexes"

  green "✓ Database dump complete"
}

copy_repo_schema_snapshot() {
  mkdir -p "$OUT_DIR/repo-schema"
  for f in schema.sql training-iteration-a.sql site-videos-ingest.sql; do
    cp "$ROOT/backend/supabase/$f" "$OUT_DIR/repo-schema/$f"
  done
  green "✓ Copied repo schema SQL snapshot"
}

storage_list_page() {
  local bucket="$1"
  local offset="$2"
  local body_file="$3"
  curl -sS -X POST \
    "${SUPABASE_URL}/storage/v1/object/list/${bucket}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"prefix\":\"\",\"limit\":1000,\"offset\":${offset}}" \
    -o "$body_file"
}

storage_download_object() {
  local bucket="$1"
  local object_path="$2"
  local dest="$3"
  mkdir -p "$(dirname "$dest")"
  curl -sS -f \
    "${SUPABASE_URL}/storage/v1/object/${bucket}/${object_path}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -o "$dest"
}

export_storage_bucket() {
  local bucket="$1"
  local bucket_dir="$OUT_DIR/storage/$bucket"
  local manifest="$bucket_dir/manifest.jsonl"
  local offset=0
  local total=0

  mkdir -p "$bucket_dir"
  : >"$manifest"

  yellow "Listing storage bucket: $bucket"

  while true; do
    local page_file paths_file
    page_file="$(mktemp)"
    paths_file="$(mktemp)"
    storage_list_page "$bucket" "$offset" "$page_file"

    page_count="$(python3 - "$page_file" "$paths_file" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

if isinstance(data, dict) and data.get("error"):
    print(data["error"], file=sys.stderr)
    raise SystemExit(1)

if not isinstance(data, list):
    print("unexpected list response", file=sys.stderr)
    raise SystemExit(1)

with open(sys.argv[2], "w", encoding="utf-8") as out:
    for item in data:
        name = item.get("name", "")
        if name:
            out.write(name + "\n")

print(len(data))
PY
)"

    if [ "$page_count" -eq 0 ]; then
      rm -f "$page_file" "$paths_file"
      break
    fi

    while IFS= read -r object_path; do
      [ -z "$object_path" ] && continue
      local dest="$bucket_dir/$object_path"
      if storage_download_object "$bucket" "$object_path" "$dest" 2>/dev/null; then
        printf '{"bucket":"%s","path":"%s","status":"ok"}\n' "$bucket" "$object_path" >>"$manifest"
        total=$((total + 1))
      else
        printf '{"bucket":"%s","path":"%s","status":"error"}\n' "$bucket" "$object_path" >>"$manifest"
        yellow "○ Failed to download $bucket/$object_path"
      fi
    done <"$paths_file"

    rm -f "$page_file" "$paths_file"

    if [ "$page_count" -lt 1000 ]; then
      break
    fi
    offset=$((offset + 1000))
  done

  green "✓ Storage bucket $bucket — $total objects downloaded"
}

export_storage() {
  require_cmd curl
  require_cmd python3
  require_storage_env

  yellow "Exporting private storage buckets to $OUT_DIR/storage…"
  for bucket in frames audio videos; do
    export_storage_bucket "$bucket"
  done
}

write_manifest() {
  cat >"$OUT_DIR/manifest.txt" <<EOF
Foreman Supabase backup
=======================
created_utc: $STAMP
project_ref: uvlgbsiwyvtsjlqzozas
supabase_url: ${SUPABASE_URL:-}
out_dir: $OUT_DIR
db_dump: $([ "$SKIP_DB" = "1" ] && echo skipped || echo included)
storage_export: $([ "$SKIP_STORAGE" = "1" ] && echo skipped || echo included)
tables: sessions, frames, transcript_segments, coaching_events, labels, audio_segments, site_videos
buckets: frames, audio, videos
EOF
  green "✓ Wrote $OUT_DIR/manifest.txt"
}

main() {
  if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    usage
    exit 0
  fi

  load_env
  mkdir -p "$OUT_DIR"

  green "=== Foreman Supabase backup (read-only) ==="
  echo "Output: $OUT_DIR"
  echo ""

  copy_repo_schema_snapshot

  if [ "$SKIP_DB" != "1" ]; then
    dump_database
  else
    yellow "○ Skipping database dump (SKIP_DB=1)"
  fi

  if [ "$SKIP_STORAGE" != "1" ]; then
    export_storage
  else
    yellow "○ Skipping storage export (SKIP_STORAGE=1)"
  fi

  write_manifest

  echo ""
  green "Backup complete."
  echo "Keep this directory offline and access-controlled — it contains pilot job data."
}

main "$@"
