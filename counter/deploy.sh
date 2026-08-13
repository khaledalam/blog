#!/usr/bin/env bash
# One-shot deploy for the blog view counter.
#
# Everything here is CLI-only and safe to re-run. The ONE thing it cannot do for
# you is authenticate: `wrangler login` is a browser OAuth flow. Run that first:
#
#     cd counter && npx wrangler login
#
# then run this script. It will:
#   1. create the VIEWS KV namespace (or reuse it if it already exists)
#   2. write the namespace id into wrangler.toml
#   3. seed the 77,516 migrated WordPress view counts
#   4. deploy the Worker
#   5. print the COUNTER_URL line to paste into ../src/config.ts
set -euo pipefail
cd "$(dirname "$0")"

step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "Checking authentication"
# Match the failure string, not a success one: the "not authenticated" message
# itself contains the word "account", so grepping for that always passes.
if npx wrangler whoami 2>&1 | grep -qi "not authenticated"; then
  echo "Not logged in. Run this first, then re-run this script:" >&2
  echo "    npx wrangler login" >&2
  exit 1
fi

step "Installing dependencies"
npm install --silent

step "Creating KV namespace VIEWS"
# Reuse the existing namespace if one is already there; otherwise create it.
ns_id="$(npx wrangler kv namespace list 2>/dev/null \
  | python3 -c "import json,sys
try: n=json.load(sys.stdin)
except Exception: n=[]
print(next((x['id'] for x in n if x.get('title','').endswith('VIEWS')), ''))" || true)"

if [ -z "$ns_id" ]; then
  create_out="$(npx wrangler kv namespace create VIEWS 2>&1)"
  echo "$create_out"
  ns_id="$(printf '%s' "$create_out" | grep -oE '"?id"?[ =:]+"?[0-9a-f]{32}' | grep -oE '[0-9a-f]{32}' | head -1)"
fi

if [ -z "$ns_id" ]; then
  echo "Could not determine the KV namespace id; check the output above." >&2
  exit 1
fi
echo "KV namespace id: $ns_id"

step "Writing the id into wrangler.toml"
python3 - "$ns_id" <<'PY'
import re, sys
nid = sys.argv[1]
p = 'wrangler.toml'
s = open(p, encoding='utf-8').read()
s = re.sub(r'^id = ".*"$', f'id = "{nid}"', s, flags=re.M)
open(p, 'w', encoding='utf-8').write(s)
print("wrangler.toml updated")
PY

step "Seeding migrated view counts"
npx wrangler kv bulk put seed-kv.json --binding=VIEWS --remote

step "Deploying the Worker"
deploy_out="$(npx wrangler deploy 2>&1)"
echo "$deploy_out"

url="$(printf '%s' "$deploy_out" | grep -oE 'https://[a-z0-9.-]+\.workers\.dev' | head -1)"

step "Done"
if [ -n "$url" ]; then
  echo "Worker URL: $url"
  echo
  echo "Now set this in ../src/config.ts:"
  echo "    export const COUNTER_URL = '$url';"
  echo
  echo "Then commit and push — Actions rebuilds and live counts go active."
else
  echo "Deployed, but could not parse the URL from the output above."
  echo "Copy the workers.dev URL it printed into COUNTER_URL in ../src/config.ts."
fi
