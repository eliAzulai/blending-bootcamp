#!/usr/bin/env bash
# Run a SQL query (or file) against the wordpets Supabase project.
# Usage:
#   scripts/db.sh "select count(*) from students;"
#   scripts/db.sh -f supabase/seed-demo-history.sql
#
# Requires: macOS Keychain entries INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET,
# libpq (brew install libpq), and the wordpets Infisical project (2423b7fc) to
# contain SUPABASE_DB_URL.

set -euo pipefail

PSQL="/opt/homebrew/opt/libpq/bin/psql"
ENV_FILE=$(mktemp -t wp-db-env)
trap 'rm -f "$ENV_FILE"' EXIT

export INFISICAL_CLIENT_ID="$(security find-generic-password -s INFISICAL_CLIENT_ID -w 2>/dev/null)"
export INFISICAL_CLIENT_SECRET="$(security find-generic-password -s INFISICAL_CLIENT_SECRET -w 2>/dev/null)"

node "$HOME/projects/infisical/pull-env.js" 2423b7fc-bb02-4075-aba8-d7d04aacc820 prod "$ENV_FILE" > /dev/null

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ "$#" -eq 0 ]; then
  echo "usage: $0 \"<sql>\"   or   $0 -f path/to/file.sql" >&2
  exit 1
fi

"$PSQL" "$SUPABASE_DB_URL" "$@"
