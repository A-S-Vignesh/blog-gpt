#!/usr/bin/env bash
# TheBlogGPT deploy: pull -> install -> build -> new release -> restart.
#
# Usage:  bash ~/blog-gpt/deploy/oracle/deploy.sh      (or ~/deploy-blog.sh)
#
# Safe to re-run. Stops on the first error (set -e), and the live site keeps
# serving the previous release until the very last step, so a failed build
# never takes the site down.
#
# Why releases instead of building in place: `next build` wipes .next before
# it starts, so building inside the folder PM2 serves from would break the
# live site for the whole build. Instead we build in the git checkout, copy
# the standalone output into a fresh folder under ~/blog-gpt-releases, and
# flip the ~/blog-gpt-current symlink to it.

set -euo pipefail

APP_DIR=/home/ubuntu/blog-gpt
RELEASES_DIR=/home/ubuntu/blog-gpt-releases
CURRENT_LINK=/home/ubuntu/blog-gpt-current
ECOSYSTEM="$APP_DIR/deploy/oracle/ecosystem.config.js"
PM2_NAME=thebloggpt
KEEP_RELEASES=3
HEALTH_URL=http://127.0.0.1:3000/

cd "$APP_DIR"

# Secrets live only on the server (never in git). NEXT_PUBLIC_* values are
# baked into the browser bundle at build time, so the build must see them.
if [ ! -f .env ]; then
  echo "!! $APP_DIR/.env is missing. Copy the production env file there first." >&2
  exit 1
fi

echo "==> Pulling from GitHub"
# --ff-only: refuse to auto-merge. If this errors, someone edited files on the
# server; fix that by hand rather than letting git create a merge commit here.
git pull --ff-only

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

# nice: the chat API shares these 2 cores; a lower priority keeps its
# websockets responsive while Next compiles.
echo "==> Building"
nice -n 10 npm run build

RELEASE="$RELEASES_DIR/$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD)"
echo "==> Assembling $RELEASE"
mkdir -p "$RELEASE"
cp -a .next/standalone/. "$RELEASE/"
# Standalone copies .env into its output. PM2 already loads the real one via
# --env-file, so drop the copy: one source of truth, and old releases don't
# keep stale secrets around.
rm -f "$RELEASE/.env"
# Standalone leaves these two out on purpose (they are meant for a CDN), but
# here the Node server serves them itself and Cloudflare caches them.
cp -a .next/static "$RELEASE/.next/static"
cp -a public "$RELEASE/public"

echo "==> Switching to the new release"
# ln + mv -T is an atomic swap: there is never a moment without the symlink.
ln -sfn "$RELEASE" "$CURRENT_LINK.tmp"
mv -Tf "$CURRENT_LINK.tmp" "$CURRENT_LINK"
# delete + start (not restart) so PM2 always re-reads the ecosystem file and
# resolves the symlink fresh.
pm2 delete "$PM2_NAME" > /dev/null 2>&1 || true
pm2 start "$ECOSYSTEM"

echo "==> Waiting for the app to answer"
healthy=false
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "$HEALTH_URL"; then
    healthy=true
    break
  fi
  sleep 1
done

if [ "$healthy" != true ]; then
  echo "!! New release did not answer on $HEALTH_URL within 30s." >&2
  pm2 logs "$PM2_NAME" --lines 40 --nostream || true
  # First deploy has nothing to fall back to; rollback.sh says so and exits.
  bash "$APP_DIR/deploy/oracle/rollback.sh" || true
  exit 1
fi

pm2 save

echo "==> Removing old releases (keeping the newest $KEEP_RELEASES)"
CURRENT_REAL=$(readlink -f "$CURRENT_LINK")
# Release names start with a UTC timestamp, so a plain sort is chronological.
find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort | head -n -"$KEEP_RELEASES" |
  while read -r old; do
    [ "$old" = "$CURRENT_REAL" ] || rm -rf "$old"
  done

echo "==> Deployed $(basename "$RELEASE"). Recent logs:"
pm2 logs "$PM2_NAME" --lines 15 --nostream
