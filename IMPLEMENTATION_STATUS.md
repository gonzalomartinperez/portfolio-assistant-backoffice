# Implementation status · 2026-09-26

The repository was bootstrapped private, then changed to public at the owner's explicit request. `main` holds only bootstrap files; feature PR #1 is merged into `develop`.

The standalone Next.js 16 client uses Node 24 LTS. Local Chromium tests on the merged `develop` commits reached the fixture API with real PostgreSQL and Neo4j over credentialed CORS, streamed responses, showed saved citations and persisted anonymous history. Spanish mobile 390×844 showed no horizontal overflow. The incremental SSE client bounds frames, checks sequence numbers, and reads persisted run state after an interrupted stream without retrying generation. Parser unit tests, production build, two browser tests and the production Docker build pass locally and in CI. The API's fixture excerpts do not demonstrate real model quality. A full cross-browser accessibility audit and a real OpenAI call remain outside this fixture gate; the paid call is intentionally not run.
