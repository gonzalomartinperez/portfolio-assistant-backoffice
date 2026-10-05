# Design system and provenance

Read-only portfolio reference: `45d8a42faa78bfb94952639ed462832c3b4ad109`.
Reviewed design documentation, semantic tokens, owned primitives, typography and theme
behavior. No runtime import crosses repositories. The backoffice deliberately emphasizes
technical status and account controls; the portfolio owns conversational identity/motion.

## Tokens and composition

`src/app/style.css` owns semantic dark/light surfaces, text, borders, cyan accent,
danger, radii, focus and 140ms/320ms motion durations. Inter is body text, Inter Tight is
display type and JetBrains Mono is limited to short labels. Next/font self-hosts approved
fonts; attribution remains in [third-party notices](../THIRD_PARTY_NOTICES.md).

`data-theme` is the only theme authority. The pre-paint script replays a non-sensitive
preference and safely handles blocked storage. Legacy system preference resolves once to
an explicit light/dark value. Account and operational dictionaries contain complete
US English and neutral Latin American Spanish sentences with typed keys/interpolation.
No credentials or transcripts are stored in browser preferences.

Owned `components/ui/button` uses native semantics, default/outline/ghost variants,
44px targets, visible focus and truthful disabled/loading states. CSS Modules adapt the
portfolio's shadcn responsibilities without adding Tailwind, CVA, Radix or a competing
preset to this small application. Auth CSS Modules own account/forms/dialog geometry;
operations classes own dashboard cards, toolbar, notices and native trace disclosures.

Cards use semantic surfaces, consistent borders/radii and bounded content widths. Long
identifiers wrap; metrics use readable number formatting. Missing data gets an explicit
notice, never fabricated zeroes. Synthetic evidence is visibly labeled. Trace disclosure
renders only validated stages, not arbitrary span attributes, prompts or answers.

Use native labeled selects, forms and details before adding libraries or ARIA. Account
revocation has a native confirmation dialog, Escape dismissal and focus restoration.
Copy-invitation feedback reports actual clipboard success/failure; invite links are secrets.
Theme colors switch coherently. Reduced motion removes transition/animation effects;
reading surfaces and controls remain stable. No avatar animation or graph engine is needed
for this private operational application.

Inspect both themes/locales at narrow and desktop widths, keyboard focus and 200% text.
[Current browser evidence](verification/backoffice.md) distinguishes real PostgreSQL,
labeled fixtures, automated accessibility and unverified live providers/physical devices.
The [historical public-chat guide](https://github.com/gonzalomartinperez/portfolio-assistant-backoffice/blob/aed8ea710c8b847ddc9066aaef5ce48d3793b494/docs/design-system.md)
explains the former avatar/iframe; it is not current backoffice guidance.
