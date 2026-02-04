#!/usr/bin/env bash
set -euo pipefail

# Run Vale prose lint locally.
#
# Requirements:
# - "vale" binary available on PATH (macOS: `brew install vale`)
# - `.vale.ini` present in repo root
#
# Opt-out:
#   SKIP_VALE=1 git push

if [[ "${SKIP_VALE:-}" == "1" ]]; then
  echo "SKIP_VALE=1 set; skipping Vale."
  exit 0
fi

if ! command -v vale >/dev/null 2>&1; then
  echo "Vale is not installed (command 'vale' not found)."
  echo "Install it, then retry:"
  echo "  macOS: brew install vale"
  echo "  Linux: https://vale.sh/docs/vale-cli/installation/"
  exit 1
fi

# Ensure vocabulary is generated before running Vale
./tooling/scripts/build-vocab.sh

# Fetch/refresh Vale packages (styles) based on `.vale.ini`
vale sync

# Run Vale against framework docs (matches CI scope)
vale framework/
