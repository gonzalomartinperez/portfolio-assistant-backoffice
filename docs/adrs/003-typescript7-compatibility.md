# ADR 003: TypeScript 7 compatibility gate

Status: blocked by the contract generator; retain the working checker until a supported
installation exists. Inspected 2026-09-27 during embedded-first delivery.

The requested primary checker is stable TypeScript 7.0.2. Nightly 7.1 builds, ignored build
errors, patched node_modules, forced peers and legacy-peer-deps are not acceptable.
The [official TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
documents the native compiler and the `@typescript/typescript6` compatibility API with npm
aliases. We tested that exact arrangement in an isolated ignored directory using the
application manifest, replacing the compiler entries with:

```json
{
  "@typescript/native": "npm:typescript@7.0.2",
  "typescript": "npm:@typescript/typescript6@6.0.2"
}
```

`npm install --package-lock-only --ignore-scripts --no-audit --no-fund` failed with ERESOLVE:
`openapi-typescript@7.13.0` requires peer `typescript ^5.x`, while the official compatibility
package is 6.0.2. Registry inspection confirmed 7.13.0 is the current stable generator.
The failed experiment did not change the application lockfile or install a compiler.
This confirms the earlier direct TypeScript 7 Dependabot failure; it is not a completed
migration or a benchmark of TypeScript 7.

## Tooling inventory and commands

- Node 24.21.0, npm frozen lockfile installs, Next 16.3.6, React 19.3.0.
- `npm run typecheck`: installed Next route type generation, then TypeScript **5.9.3**
  `tsc --noEmit` over application, tests and generated route types.
- `npm run build`: installed Next 16.3.6 uses its project-local compiler CLI by default
  and retains build-time checking. Installed `useTypeScriptCli.md` and implementation were
  inspected; no framework workaround/ignoreBuildErrors was added.
- `npm run contract:generate`: openapi-typescript 7.13.0, using the 5.x programmatic API.
- `npm test`: Node type stripping for pure tests; architectural AST checks use the installed
  TypeScript programmatic API. Playwright uses its own transformation, not a substitute checker.
- Docker and CI use the same lockfile and commands. Editor users should select workspace
  TypeScript 5.9.3 for now; no global/editor configuration was changed or claimed tested.

The application now enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
Optional transport fields normalize to null where the committed schema permits it; guarded
array access and explicit React prop absence replace assumptions. No generated schema edits,
`any`, casts or diagnostic suppressions are used to make these checks pass.

## References and follow-up

Read-only reference revisions: portfolio `45d8a42faa78bfb94952639ed462832c3b4ad109` and
Pequeverso `7ae59873f10a8769d46e5d0f8b9901444e220e37`. Adopted Pequeverso's explicit indexed
access/optional-property checks; retained portfolio identity, current CSS Modules and
owned controls. Pequeverso's storefront branding, media pipeline and larger component
catalog were not copied. No reference working tree was modified.

Revisit when the generator explicitly supports the official compatibility API, or in a
focused tooling change that isolates its supported 5.x dependency with reproducible installs.
Do not silently relocate the generator or add a second package pipeline during embedded UX
acceptance. Then verify fresh install, route generation, intended checker version, AST tests,
contract drift, production build/container and editor support before lifting the major hold.

Local WSL samples on the same checkout: typegen plus 5.9.3 typecheck took 20.43s before
additional strict flags and 18.91s afterward, under concurrent workspace load. These single
samples do **not** establish a speedup. No TypeScript 7 performance result is claimed.
Browser performance and bundle evidence remain separate in the embed acceptance report.
