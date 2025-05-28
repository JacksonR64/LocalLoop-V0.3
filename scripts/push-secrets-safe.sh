#!/usr/bin/env bash
set -euo pipefail

# --------------------------------------------------
# 0 · Ensure .env exists (copy from template if not)
# --------------------------------------------------
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "🆕  .env created from .env.example"
fi

# --------------------------------------------------
# 1 · Prompt for any empty values in .env
# --------------------------------------------------
while IFS='=' read -r key value; do
  # skip comments / blanks
  [[ "$key" =~ ^\s*$ || "$key" =~ ^\s*# ]] && continue

  if [[ -z "$value" ]]; then
    # read -s for silent input if you prefer (no echo)
    read -rp "Enter value for $key: " value
    # escape slashes for in-place sed (macOS BSD-sed needs the '')
    sed -i '' "s|^$key=.*|$key=$value|" .env
  fi
done < .env
echo "🔑  .env fully populated."

# --------------------------------------------------
# 2 · Push every non-empty var to GitHub secrets
# --------------------------------------------------
REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/](.+)\.git#\1#')
echo "🚀  Uploading secrets to $REPO …"

grep -v '^\s*#' .env | while IFS='=' read -r key value; do
  [[ -z "$value" ]] && continue
  gh secret set "$key" -b"$value" --repo "$REPO" >/dev/null
  echo " • $key"
done

echo "✅  All secrets synced."
