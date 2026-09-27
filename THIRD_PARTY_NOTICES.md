# Licensing and attribution

The application source code and engineering documentation are licensed under [MIT](LICENSE).
The MIT grant
does not include Gonzalo's likeness, personal identity assets or third-party materials.

- `public/avatar.png` is the owner's approved portfolio identity illustration, preserved
  from the existing assistant work. It is not licensed for reuse by this repository's MIT
  license. Screenshots include that identity for documenting this application; no separate
  right to extract/reuse the likeness or imply endorsement is granted.
- Design tokens, typography choices and button responsibilities are adapted from Gonzalo's
  portfolio at `45d8a42faa78bfb94952639ed462832c3b4ad109`. The original portfolio's owned
  primitives derive from [shadcn/ui](https://github.com/shadcn-ui/ui), MIT licensed.
  This app uses a small native CSS Module button, not a redistributed preset/library.
- Inter, Inter Tight and JetBrains Mono are fetched at build time by Next/font from Google
  Fonts and self-hosted at runtime. Each uses the SIL Open Font License 1.1. Font notices
  are distributed in `public/licenses/`; upstream sources are
  [Inter](https://github.com/google/fonts/tree/main/ofl/inter),
  [Inter Tight](https://github.com/google/fonts/tree/main/ofl/intertight) and
  [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono).
- npm dependencies retain their own licenses. `package-lock.json` records exact installed
  versions and license identifiers; package license files accompany installed distributions.
  React/Next.js, react-markdown, remark-gfm and rehype-sanitize provide the runtime rendering
  stack. Axe is a development-only accessibility checker; its MPL-2.0 terms remain intact.
- Public source excerpts/links returned by the API retain their original ownership. They
  are untrusted conversation content, not relicensed by this frontend.

No font, icon, portrait or model-provider rights are implied by public repository visibility.
