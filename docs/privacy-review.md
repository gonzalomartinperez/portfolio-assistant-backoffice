# Privacy and accessibility review — 2026-10-17

`/privacy?locale=en|es` is public and does not initialize authentication or query the
database. It describes actual account admission, host-only essential cookies,
eight-hour renewable sessions, theme localStorage and language cookie. It does not
label the whole backoffice cookieless: Better Auth session rows can contain IP and
user-agent, and IAM stores verified identity/membership/invitations/audit records.
OAuth tokens are encrypted by the application; this is not a guarantee that every
infrastructure backup is encrypted. No password/open signup was introduced.

The separate product count view is default-off and contains no visitor/session
identity. No advertising/replay tool or new processor is enabled. The separate
assistant uses only backend OpenAI; `store=false` does not mean Zero Data Retention.
The UI states retention/deletion/backup limitations rather than promising erasure.
Confirmed public contact is the existing portfolio contact page, not an invented
legal entity, postal address or unverified reporting mailbox.

Unresolved before production: applicable jurisdiction and legal basis, explicit
IAM/audit/expired-session cleanup policy, infrastructure and provider retention/
regions, encrypted backup expiry, rights handling and effective proxy logging.
No assertion of legal certification or consent exemption follows from a personal
site, a footer, or absence of tracking cookies. No-banner policy means metrics
requiring consent remain omitted/off. The page is a technical current-state notice,
not a determination of all legal obligations.

The analytics browser tests cover keyboard-select operation, native disclosure,
semantic table/caption, desktop and 390px Spanish/light reduced-motion layout,
no horizontal overflow and axe. The privacy page is checked in both languages
without OAuth. CI source checks and secret scans remain required. Exact execution
receipts belong to the PR/evidence report; tests written are not tests executed.
No physical phone or assistive-technology certification is claimed.

Primary references consulted:
[CNIL analytics guidance](https://www.cnil.fr/fr/node/677) describes conditional
exemptions, not a project approval;
[W3C table captions](https://www.w3.org/WAI/tutorials/tables/caption-summary/)
explains associating summaries with semantic tables.

The optional [feedback summary](feedback-and-improvement.md) reads aggregate current
ratings only. It exports no transcript or message identifiers and cannot train or
mutate the corpus. API retention/deletion affects the totals; this is not a raw-chat
review or lifetime feedback ledger. The independently default-off flag is not approval
to activate public collection or production services.
