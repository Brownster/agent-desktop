#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

for lambda_dir in "$ROOT_DIR"/lambda/*; do
  if [ -f "$lambda_dir/package.json" ]; then
    echo "\n==> Building $(basename "$lambda_dir")"
    (cd "$lambda_dir" && pnpm install --frozen-lockfile && pnpm run package)
  fi
done
