# Contributing

Read the [README](README.md) for setup and [architecture](docs/architecture.md) for
boundaries. Work on a focused task branch and open a PR against `develop`; never merge
feature work into `main`. An explicitly owner-authorized promotion uses a separate
`develop` → `main` PR and must pass the full CI graph at its current head before merging.
Source promotion does not authorize image publication or production deployment. Preserve others' uncommitted changes. The API and portfolio
have separate owners; request coordinated changes instead of silently editing them.

## Readability and TypeScript

The [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
is a readability reference, not a literal ruleset. Prefer precise types, const bindings,
ES modules, descriptive names, small responsibility-driven functions and explicit errors.
Use unknown at untrusted boundaries and narrow it through runtime validation; avoid any,
non-null assertions, casts that substitute for validation, namespaces and mutable exports.
Comments explain constraints or reasoning; do not narrate obvious rendering or assignments.

Explicit adaptations for this project:

- React function components, hooks, JSX and Next.js App Router conventions take precedence.
  Keep default exports where Next requires them and for established component entry points;
  use named exports for domain/application functions and owned UI primitives.
- `use client` must precede imports at intentional client boundaries. Server pages/layouts
  remain the default. CSS imports and CSS Modules follow Next's supported conventions.
- Use type aliases for discriminated unions and component props, interfaces for narrow ports,
  and inference for obvious locals. No mandatory interface prefixes, classes, return-type
  boilerplate on every component or container classes for namespacing.
- Use `T[]` for straightforward arrays, `Array<T>` when nested syntax reads more clearly.
  Use null intentionally for absent selected conversations and native React refs.
- Biome's tabs, double quotes, semicolons and wrapping are canonical here; do not reformat
  to Google's whitespace/quote examples. Native Unicode is appropriate in bilingual copy.
- Preserve generated OpenAPI output, wire-format names and required framework filenames.
  Do not rewrite generated contracts or snake_case transport fields to satisfy naming taste.
- Accessible native elements and the portfolio's owned shadcn design responsibilities
  outrank stylistic uniformity. Do not replace links with button roles or add ARIA to silence
  lint. See the [design adaptations](docs/design-system.md), including the small CSS Module
  button implementation and single `data-theme` authority.

`biome.json` makes applicable rules errors: explicit any, non-null assertions, var,
non-strict equality, parameter reassignment, namespaces, unused imports/variables, and
missing const/type-only imports. Recommended accessibility/correctness rules stay enabled.
Strict TypeScript and AST dependency tests enforce complementary constraints. Narrow lint
suppressions require a concrete reason; broad file-level suppressions are not acceptable.
Formatting, lint, typing and boundary checks are required in CI. Human review covers names,
cohesion, comments and semantics that mechanical rules cannot judge reliably.

## Verification and review

Run README's frozen-install, format/lint/type, unit/contract, generated-type drift,
production build and browser commands. Keep deterministic and live-fixture results distinct.
Add tests for meaningful changes in behavior, especially races, failures and cleanup; do
not create tests that merely duplicate low-impact implementation details.

Review both languages/themes and actual conversations at narrow/mobile/tablet/desktop sizes,
including keyboard navigation, focus restoration, long output, zoom and interruption.
Inspect screenshots and axe results. Record real-device and assistive-technology gaps.
Never call a paid provider or submit personal conversation data for tests.

PRs should explain the problem and resulting behavior, include relevant validation and
screenshots, and identify contract/design references and remaining limitations. A small
change needs a short description. Keep the canonical instructions in `AGENTS.md` and the
linked docs; don't duplicate them in tool-specific files.

Never commit credentials, private documents, `.env.local`, build output or browser traces
containing personal sessions. `npm run security:check` reports only rule names and file
paths, never matched values; it complements review and does not prove absence of secrets.
