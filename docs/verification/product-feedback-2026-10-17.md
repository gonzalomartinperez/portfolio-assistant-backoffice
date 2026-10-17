# Product and feedback increment — 2026-10-17

## Implemented and executed

- API70 added independently default-off bounded website counts and private aggregates.
- API72 `bb36012eef55e85f7e0cf78df1845f38ef13da63` added best-effort visitor
  context minimization and private current-rating counts. Quality39061876817 passed
  461 offline and31 real-service cases, including rating replacement and deletion.
- Backoffice64/65 added authenticated product views, factual privacy and project identity.
- Backoffice66 final source `d999a857292b8c1381c7ef8f3b19062c9faf36e2`
  passed Quality39063302728:78 unit/contract/architecture,2 PostgreSQL IAM and
  54 available +3 unavailable browser cases across Chromium, Firefox and WebKit.
  Static33s, browser4m14s, aggregate8s. One managed image/server lifecycle was used.
  EN/ES, dark/light, reduced motion, keyboard, 200% text, mobile and failure checks
  remained required. Peer source review covered00bc571; final delta is scoped CSS
  plus a real rendered label/count alignment assertion.

## Actual visual review

Downloaded PNG-only CI artifacts are ignored under
`.artifacts/feedback-review-00bc571` and `.artifacts/feedback-review-d999a85`.
Desktop English/dark and WebKit mobile Spanish/light were visually inspected.
The first set revealed global description-list CSS overriding the website summary:
labels and numbers no longer lined up. The final scoped selector restores horizontal
summary groups, start-aligned counts and mobile wrapping. Final screenshots were
inspected again; tests assert flex layout and aligned label/count bounding boxes.
The earlier 200% analytics/privacy final screenshots were also inspected under
`.artifacts/analytics-review-final95b8`. A passing axe scan alone was not approval.

## Measured hosted-image observation

Exact source image ID:
`sha256:a9013d8fad9cd06dbba0a747fb7570eb965649d9f48ff6b97bb9249388f11564`.
This is a runner-local Docker ID, **not a published registry digest**.
Hosted Ubuntu24.04,512MiB/0.75CPU ceiling, read-only root/cap-drop/no-new-privileges,
128PIDs and bounded logs:212000000 disk bytes,212141249 inspect bytes;
56.58MiB idle and76.32MiB after64 anonymous sign-in/health requests at concurrency8.
Batch895ms, p50 92ms, p95 308ms. This is a synthetic anonymous workload, not a
measurement of authenticated dashboard rendering, live assistant latency, VPS capacity
or field performance. No before/after speedup is claimed across different hosted VMs.
Feedback is server-rendered and adds no dependency or browser polling loop.

## Remaining acceptance gates

Private counts and feedback remain off by default; no public collection, assistant
activation, training, artifact publication or deployment occurred. Current browser
checks use labeled synthetic API fixtures and real IAM. Live OAuth/HTTPS pairing,
physical devices/assistive technology, provider behavior and production retention/
legal decisions remain unverified. API Neo4j findings continue to block release
selection; green source checks do not waive full selected-digest vendor assessment.
