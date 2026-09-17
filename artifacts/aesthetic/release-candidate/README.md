# Flowboard aesthetic personalization release candidate

## Candidate

- Branch: `luna/aesthetic-personalization`
- Candidate SHA: `27ae35a075f129497aae8de1c09ade0a905e280a`
- Baseline deployed main: `7bc5ff5230ebe1d36c2ca5debd11703e596979f4`
- Worktree: clean at packaging time.

## Implemented scope

- Eight desktop-first canvas palettes with gradient and solid finishes.
- Browser-local Light/Dark/System appearance settings.
- Browser-local photo/initials preference.
- Safe Google profile photo handling for the signed-in account.
- Workspace-scoped member photo sharing with strict local Rules and Emulator coverage.
- UID-backed cloud assignee roster, compact badges, former-member fallback, and overflow counts.
- Preserved local free-text assignment behavior and cloud UID assignment authority.

## Qualification

- Unit tests: 31 passed.
- Firestore Rules tests: 24 passed.
- Built-preview browser suite: 48 passed.
- Emulator-browser workflow: 1 passed.
- Lighthouse accessibility: 100/100, zero failed scored audits.
- Contrast: 32 palette/mode/finish states; minimums recorded in `artifacts/aesthetic/step-09/contrast.json`.
- 1,000-card benchmark: 3 samples, median render 561.8 ms, median navigation 582 ms, median filter 49.6 ms, zero console/page errors.
- Public em dash count: 0.

## Budgets

- Raw source: 239,382 / 240,000 bytes; 618 bytes headroom.
- Initial shell gzip: 24,426 / 25,000 bytes.
- First-party lazy gzip: 49,391 / 55,000 bytes.
- Document gzip: 5,587 bytes, reported separately.
- Vendor gzip: 139,736 bytes, reported separately.

The source margin is intentionally small. Do not add production feature code without a new measured budget decision.

## Production boundary

This is a verified local release candidate only.

- Firestore Rules source changed locally for member profile sharing.
- Candidate Rules SHA-256: `52f6e01cdac3276aa4ca7334efb2b735d1ddcca5f3d30095ac69cd58eb9bd0e3`.
- Rules were not published.
- GitHub Pages was not deployed.
- No remote push or merge occurred.
- No production Firestore data was mutated.
- No real Google account was used.
- No protected workspace was opened.

## Human release gate

Before calling this production-accepted:

1. Review candidate SHA `27ae35a075f129497aae8de1c09ade0a905e280a`.
2. Separately authorize and publish the exact Rules revision if shared team photos are to be enabled.
3. Use only a newly authorized disposable cloud workspace.
4. Perform redacted owner/editor/viewer/non-member acceptance, direct access-denial checks, revocation, archive/restore, stale-conflict, and cross-session convergence checks.
5. Verify native browser zoom and the final cache-busted deployed client only after authorized deployment.

Do not use `My Flowboard workspace` or `Lifecycle realtime probe`.
