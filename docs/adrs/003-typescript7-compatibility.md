# ADR 003: Native TypeScript 7 with isolated compiler-API tooling

Status: adopted for the primary project checker. The previous generator peer
blocker is resolved by an independently locked tooling package. No framework
upgrade, ignored diagnostics, nightly compiler, patched dependencies or forced
peer installation is used.

## Decision and compiler boundaries

The primary project compiler is stable **TypeScript 7.0.2**. Next.js **16.3.6**
uses the project-local compiler CLI by default and explicitly documents TypeScript
7 support in its installed `02-typescript.md` and `useTypeScriptCli.md` guides.
Its package resolver selects `typescript`'s own binary, so production builds use
7.0.2 without an additional framework configuration flag. Build errors remain fatal.
The generated route declarations, application, scripts and tests are checked.

TypeScript 7 does not expose the classic compiler API. Architectural AST checks
and the retained embed fixture transpiler import the official
`@typescript/typescript6` compatibility package **6.0.2**. Its dependency is locked
to TypeScript **6.0.3**, which is the actual API version reported at execution.
Neither tool substitutes a TypeScript 6 project-wide check for the primary checker.
This follows the [official side-by-side compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

The compatibility package's transitive compiler exports a competing `tsc` binary.
A frozen npm install reproduced `.bin/tsc` resolving to TypeScript 6.0.3. Therefore
project commands invoke `node node_modules/typescript/lib/tsc.js` explicitly;
`toolchain:check` asserts both the primary package and executed CLI report 7.0.2.
Do not use an unqualified `npx tsc` as evidence of the project's compiler version.
Next's package-metadata resolution is independent of that npm binary collision.

`openapi-typescript` **7.13.0** requires a TypeScript 5.x compiler API peer. It lives
in `tooling/api-contract`, with its own package manifest and lockfile pinning
TypeScript **5.9.3**. This package generates the committed API declarations only;
it is absent from application runtime code and is not the application checker.
Do not replace frozen installs with an unpinned download or override its peer range.

## Reproducible commands

```sh
npm ci --strict-peer-deps
npm run contract:install
npm run toolchain:check
npm run typecheck
npm run contract:generate
git diff --exit-code contracts/types.d.ts
npm test
npm run build
```

`typecheck` verifies the toolchain, runs `next typegen`, then executes native 7.0.2.
`contract:install` uses `npm ci --prefix tooling/api-contract`.
CI must install both lockfiles before generator drift validation, and cache npm
downloads against both locks. Docker builds require only the root frozen install
and committed declarations; production runtime images do not need a compiler or
generator. Container verification uses the same root lockfile and Next build.

Strictness remains enabled, including `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`. Global type packages are explicit (`node`, `react`,
`react-dom`), and nested tooling dependency directories are excluded from source
scanning. No diagnostic suppressions or generated-schema edits were added.

## Evidence and limits

Verified on WSL Linux, Node **24.21.0**, npm **11.19.0**:

- Frozen root installation with strict peer resolution and isolated frozen
  generator installation succeed. Both dependency audits report zero findings.
- Primary CLI reports 7.0.2; compatibility API reports 6.0.3.
- Route generation, project checking, 48 contract/unit checks and AST boundary
  checks pass. Regenerated declarations are byte-for-byte unchanged.
- Three paired full checks using the same current configuration pass with
  TypeScript 5.9.3 and 7.0.2; this checks migration parity, not runtime behavior.
- Local full-check samples with incremental caching disabled: TypeScript 5.9.3
  took **10.52 s**, peak RSS **613,724 KB**; native 7.0.2 took **2.27 s**, peak RSS
  **369,116 KB**. These are individual samples under concurrent workspace load,
  not statistically established speedups or browser performance measurements.
- Next production build passes: **160.87 s**, peak RSS **1,038,316 KB**, with
  its TypeScript phase reported at **3.1 s**, under concurrent workspace load.
  There is no comparable build baseline establishing a build-duration gain.
  Final integrated image/Actions evidence belongs in the release verification
  report after this compiler change is incorporated.

A faster checker does not make the chat or backoffice faster. Browser bundles,
streaming and interaction measurements remain separate acceptance criteria.
The TypeScript 7 editor requires its supported native/LSP integration; no global
editor installation is performed or claimed tested. Next's legacy language-service
plugin needs the classic compiler API and is not provided by native 7.0.2.

Reevaluate the compatibility package and isolated generator only when their actual
API consumers support a stable replacement. Compiler and generator migrations
remain manual dependency review items.
