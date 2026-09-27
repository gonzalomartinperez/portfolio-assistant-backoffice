#!/usr/bin/env bash
set -euo pipefail
# Dedicated ignored checkouts: never use another agent's mutable working tree.
mkdir -p .integration
prepare() {
  local destination="$1" repository="$2" revision="$3"
  if [[ ! -d "$destination/.git" ]]; then git init -q "$destination"; fi
  if ! git -C "$destination" remote get-url origin >/dev/null 2>&1; then
    git -C "$destination" remote add origin "https://github.com/gonzalomartinperez/$repository.git"
  fi
  git -C "$destination" fetch -q --depth=1 "https://github.com/gonzalomartinperez/$repository.git" "$revision"
  git -C "$destination" checkout -q --detach FETCH_HEAD
}
prepare .integration/api portfolio-assistant-api 94408ab4b59297e93e2574320b3049ee2f5d4f2e
prepare .integration/corpus portfolio 1acbe54906c88398652aebb8eae0c217fd0d8821
for artifact in openapi.json sse.schema.json sse.examples.json; do
  cmp "contracts/$artifact" ".integration/api/contracts/$artifact"
done
