#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:8787/api/todos}

echo "Using base: $BASE_URL"

echo "POST -> create"
POST_OUT=$(mktemp)
HTTP=$(curl -sS -w "%{http_code}" -o "$POST_OUT" -X POST -H "Content-Type: application/json" -d '{"text":"integration test item"}' "$BASE_URL")
echo "HTTP $HTTP"
cat "$POST_OUT" | jq .
ID=$(cat "$POST_OUT" | jq -r .id)

echo
echo "GET -> list"
curl -sS -i "$BASE_URL" | sed -n '1,200p'

echo
echo "PATCH -> toggle"
curl -sS -i -X PATCH "$BASE_URL/$ID" | sed -n '1,200p'

echo
echo "GET -> list after toggle"
curl -sS -i "$BASE_URL" | sed -n '1,200p'

echo
echo "DELETE -> remove"
curl -sS -i -X DELETE "$BASE_URL/$ID" | sed -n '1,200p'

echo
echo "GET -> final list"
curl -sS -i "$BASE_URL" | sed -n '1,200p'

rm -f "$POST_OUT"

echo
echo "Done."
