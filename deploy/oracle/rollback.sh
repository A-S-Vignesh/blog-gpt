#!/usr/bin/env bash
# Point TheBlogGPT back at the release before the current one and restart.
#
# Usage:  bash ~/blog-gpt/deploy/oracle/rollback.sh
#
# This only swaps the running build. The git checkout still holds the newer
# commit, so the next deploy.sh rebuilds it: revert the bad commit on GitHub
# first if you want the rollback to stick.

set -euo pipefail

RELEASES_DIR=/home/ubuntu/blog-gpt-releases
CURRENT_LINK=/home/ubuntu/blog-gpt-current
ECOSYSTEM=/home/ubuntu/blog-gpt/deploy/oracle/ecosystem.config.js
PM2_NAME=thebloggpt

CURRENT_REAL=$(readlink -f "$CURRENT_LINK")
# The line just above the current release in the sorted list is the previous one.
PREVIOUS=$(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort |
  grep -B1 -Fx "$CURRENT_REAL" | head -n 1)

if [ -z "$PREVIOUS" ] || [ "$PREVIOUS" = "$CURRENT_REAL" ]; then
  echo "!! No older release to roll back to." >&2
  exit 1
fi

echo "==> Rolling back to $(basename "$PREVIOUS")"
ln -sfn "$PREVIOUS" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"
pm2 delete "$PM2_NAME" > /dev/null 2>&1 || true
pm2 start "$ECOSYSTEM"
pm2 save
