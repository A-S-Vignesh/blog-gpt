#!/usr/bin/env bash
# Calls one TheBlogGPT cron route on the local Next.js server, the same way
# Vercel Cron did: GET with "Authorization: Bearer $CRON_SECRET".
#
# Usage:  bash ~/blog-gpt/deploy/oracle/cron.sh <job>    e.g. ads-schedule
# Scheduled by thebloggpt.cron; output goes to ~/logs/blog-cron.log.

set -euo pipefail

JOB="${1:?usage: cron.sh <job>}"
ENV_FILE=/home/ubuntu/blog-gpt/.env
LOG_FILE=/home/ubuntu/logs/blog-cron.log

# Read the secret from the server .env so it never sits in the crontab file.
# Strips optional surrounding quotes.
SECRET=$(grep -E '^CRON_SECRET=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- |
  sed -E "s/^['\"]//; s/['\"]$//")

mkdir -p "$(dirname "$LOG_FILE")"
{
  printf '%s %s ' "$(date -u +%FT%TZ)" "$JOB"
  # 127.0.0.1 skips Nginx and Cloudflare entirely, so this works before and
  # after the DNS cutover alike.
  curl -sS --max-time 300 -w ' [HTTP %{http_code}]' \
    -H "Authorization: Bearer $SECRET" \
    "http://127.0.0.1:3000/api/cron/$JOB" || printf ' [curl failed]'
  echo
} >> "$LOG_FILE" 2>&1
