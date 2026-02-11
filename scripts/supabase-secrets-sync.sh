#!/usr/bin/env bash
set -euo pipefail

if ! command -v sops >/dev/null 2>&1; then
  echo "Missing dependency: sops"
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Missing dependency: supabase CLI"
  exit 1
fi

ENC_FILE="${1:-secrets/supabase.env.enc}"
shift || true

if [ ! -f "$ENC_FILE" ]; then
  echo "Encrypted env file not found: $ENC_FILE"
  exit 1
fi

refs=()
if [ "$#" -gt 0 ]; then
  refs=("$@")
elif [ -n "${SUPABASE_PROJECT_REFS:-}" ]; then
  # Accept comma or space separated refs via environment variable.
  refs_string="${SUPABASE_PROJECT_REFS//,/ }"
  # shellcheck disable=SC2206
  refs=($refs_string)
else
  echo "Usage: $0 [secrets/supabase.env.enc] <project-ref> [project-ref ...]"
  echo "Or set SUPABASE_PROJECT_REFS=\"ref1,ref2\"."
  exit 1
fi

tmp_env="$(mktemp)"
cleanup() {
  rm -f "$tmp_env"
}
trap cleanup EXIT

sops -d --input-type dotenv --output-type dotenv "$ENC_FILE" > "$tmp_env"

for ref in "${refs[@]}"; do
  if [ -z "$ref" ]; then
    continue
  fi
  echo "Syncing secrets to project: $ref"
  supabase secrets set --project-ref "$ref" --env-file "$tmp_env"
done

echo "Secrets sync completed."
