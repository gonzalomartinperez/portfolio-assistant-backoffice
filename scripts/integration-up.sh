#!/usr/bin/env bash
set -euo pipefail
bash scripts/prepare-integration.sh
stack=(docker compose -p assistant-web-verification -f tests/integration/compose.yaml)
"${stack[@]}" build api
"${stack[@]}" build indexer
"${stack[@]}" up -d --wait postgres neo4j
"${stack[@]}" run --rm api python -m app.migrate
"${stack[@]}" run --rm --user "$(id -u):$(id -g)" indexer python -m app.knowledge_sync --repo /corpus --ref 1acbe54906c88398652aebb8eae0c217fd0d8821
"${stack[@]}" up -d api web probe proxy
for attempt in {1..60}; do
  if "${stack[@]}" exec -T api python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/ready')" >/dev/null 2>&1 && curl -fsS http://localhost:3001/ >/dev/null; then exit 0; fi
  sleep 2
done
exit 1
