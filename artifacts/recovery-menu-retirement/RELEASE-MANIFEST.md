# Step 8 release manifest

## Candidate identity

- Repository: `kcchanai/UH-Flowboard`
- Branch: `fix/remove-recovery-menus`
- Baseline deployed main: `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`
- Qualified implementation commit: `50d913cb61fe71f4d49b4e2caf75581c05522e09`
- Evidence/package commit: pending until this manifest is committed
- Firestore Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
- Firestore indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

## Qualification

- Unit validation: 41 passed, 0 failed.
- Firestore Rules Emulator: 46 passed, 0 failed.
- Packaged Emulator browser workflow: 19 passed, 0 failed.
- Configured browser selection: 11 passed, 0 failed.
- Lighthouse accessibility: 1.0, zero failed audits.
- Production asset isolation: 17 assets passed.
- Final synthetic visual surfaces: 5/5 HTTP 200; zero console errors, page errors, failed requests, overflow surfaces, or visible retired recovery/legacy text.

Receipts:

- `FINAL-VALIDATION-SUMMARY.json`
- `final/capture-report.json`
- `SCREENSHOT_INDEX.md`
- `budget-configured.json`
- `budget-unconfigured.json`

## Budgets

- Raw source: `284258 / 300000` bytes; headroom `15742`.
- Configured initial shell gzip: `25868 / 26250` bytes.
- Configured first-party lazy gzip: `55568 / 60000` bytes.
- Configured document gzip: `4989` bytes.
- Unconfigured initial shell gzip: `25813` bytes.
- Unconfigured first-party lazy gzip: `55568` bytes.
- Unconfigured document gzip: `4987` bytes.
- No source or gzip cap changed.

## Deployment authorization boundary

Authorized for this request:

- Push the qualified client candidate.
- Create and merge the validation-gated GitHub pull request.
- Allow the existing GitHub Pages workflow to publish the built client from the exact validated `main` SHA.
- Perform anonymous cache-busted live verification.

Not authorized and not performed:

- Firestore Rules publication.
- Firestore index publication.
- Real Google-account acceptance.
- Production account, workspace, document, browser profile, token, or cookie access.
- Migration, repair, deletion, or mutation of real data.
- Removal of protected backend migration, archived-root, local inspection/receipt, or Rules capabilities.

## Deployment receipt

- PR: pending
- PR head SHA: pending
- Merge commit / main SHA: pending
- Validation workflow run: pending
- Pages workflow run: pending
- Pages deployment SHA: pending
- Live URL: `https://kcchanai.github.io/UH-Flowboard/`
- Anonymous live verification: pending
