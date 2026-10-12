# README gallery provenance and local fixture use

Captured on 2026-10-12 against the production build of application revision
`618aa914ced48bf08ba8d613537ecd28ef797d5e`, matching the retained runtime evidence.
Environment: WSL Linux, Node 24.21.0, Next.js 16.3.8 and Chromium/Playwright 1.63.0.
No application source was modified to generate the scenes.

| Frame | Actual workflow |
| --- | --- |
| [Sign-in](../assets/gallery/01-sign-in.png) | Anonymous browser receives the restricted Google/GitHub sign-in surface. No provider is contacted. |
| [Availability](../assets/gallery/02-availability.png) | Four actual dashboard cards with explicitly synthetic operational values. |
| [Executions](../assets/gallery/03-executions.png) | Actual selectable execution chart and equivalent semantic table. |
| [Tokens](../assets/gallery/04-tokens.png) | Real metric-selection control switches chart/table to input/output token totals. |
| [Stages](../assets/gallery/05-execution-stages.png) | Execution disclosure opens vector retrieval and generation timings. |
| [Access](../assets/gallery/06-access.png) | Live owner membership checks, synthetic owner/viewer rows and an unsent guest-email draft. No invitation token is created/captured. |
| [Unavailable](../assets/gallery/07-unavailable.png) | Private operations fixture returns 503; the actual server adapter maps it to a safe no-data dashboard. |
| [Spanish/mobile](../assets/gallery/08-mobile-es.png) | Actual locale/theme controls, narrow responsive layout and accessible chart/table. |

Overview/mobile preparation uses 1440 × 1000 CSS pixels; focused desktop/tablet
details use a real 720 × 1000 responsive viewport so labels remain readable in README.
Mobile is 390 × 844. Device scale is 2;
reduced motion is enabled. Cards/chart/stage captures use the element’s actual bounds.
Sign-in uses its actual card bounds; access and failure use semantic main-element bounds to avoid irrelevant
page whitespace. Mobile is full-page so the complete layout can be inspected. README
sets width only, preserving aspect ratio, and links every frame to its original PNG.
No screenshots are composited, no data is edited into images and no hidden implementation
is presented as a deployed capability.

## Fixture session boundary

`npm run preview:fixture` uses `scripts/test-server.ts`: dedicated loopback PostgreSQL,
explicit migrations, signed synthetic owner/viewer sessions and a local operational
service. It never contacts the real OAuth providers. A normal anonymous browser still
sees sign-in; fixture session provisioning does not disable authentication.

The maintained `tests/browser/backoffice.spec.ts` loads the private signed session file
into a disposable Playwright browser context, then exercises protected pages. Run
`npm run test:browser -- backoffice.spec.ts --project=chromium --headed` to observe those
flows in a local graphical environment. Omit `--headed` in CI/headless WSL. The managed
server owns ports 3107/3108/8117 and cannot run alongside a manual preview on those ports.
Install browsers and prepare the isolated fixture database using README first.

The ignored `.artifacts/fixture-sessions.json` contains session credentials. Do not print,
commit, upload, paste into documentation or include it in a screenshot. The fixture
lifecycle removes its session file on shutdown. Never use shared/production databases.
Gallery captures used a separately named disposable database/container, not another
agent’s services. Only public example.test identities appear in the access frame.

Capture-only scripts remain ignored local artifacts and reuse the maintained fixture
lifecycle and real components. Original screenshots and [browser evidence](backoffice.md)
remain available for comparison. Structural documentation checks validate Markdown and
HTML gallery references. Real Google/GitHub, deployed API pairing, physical phones and
screen-reader behavior remain independent acceptance tasks.

## README presentation validation

GitHub’s authenticated Markdown API rendered the README as GFM without publishing a
site. The sanitized HTML retained nine images with alt text, all links and the expandable
mobile section. A local reader preview of that returned HTML loaded every image at
1280px and 390px widths; gallery captures were inspected. Preview CSS is a review aid,
not a claim of pixel parity with GitHub’s own current theme. No image height is forced.

The existing documentation validator now covers HTML src/href as well as Markdown links.
An isolated Git fixture accepted valid targets and rejected a missing HTML image. Frozen
install, Biome, 48 unit tests, strict TypeScript 7 and contract generation passed locally.
The first type check found cached legacy /embed route types; the ignored generated types
were preserved separately and regenerated, without changing code or disabling checks.
