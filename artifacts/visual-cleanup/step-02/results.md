# Step 2 of 10 results: shared visual and dialog foundations

Status: **complete**

## Source and scope

- Branch: `luna/visual-cleanup`
- Step source change: `styles.css` only.
- Rules source unchanged; baseline Rules blob remains `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`.
- Foundation changes are scoped to native controls, dialog surfaces, actions, headers, notices, and shrink-safe form children. No state, adapter, identity, authorization, persistence, or workflow mutation changed.

## Implemented foundation

- All native controls inherit the application font; selects now share the intended surface, border, focus, and sizing language.
- Dialog containers and primary child surfaces receive viewport-bounded max heights with dynamic viewport support and a deliberate scroll owner.
- Dialog action groups align, wrap, and retain minimum action heights.
- Dialog Close controls use a consistent 40px base size and retain the existing 44px coarse-pointer rule.
- Dialog header content can shrink/wrap safely for long titles.
- Detail sections use a consistent major-section rhythm.
- Existing new-board form children are shrink-safe, with actions aligned to their form baseline.
- Existing hidden-control rule, focus rings, reduced-motion behavior, forced-colors behavior, native dialogs, and live status regions remain in force.

## Verification

- `npm.cmd run check` - passed. Static validation: **11 semantic/runtime guards plus adapter-boundary checks**.
- `npm.cmd run build` - passed. 52 modules transformed.
- `npm.cmd run measure:mvp-v2` - passed.
- `npm.cmd test` - passed. **37/37**.
- Synthetic configured build and measure with non-production values - passed.
  - Raw source: **267,291 / 300,000 bytes**.
  - Unconfigured initial shell: **26,150 / 26,250 gzip bytes**.
  - Configured initial shell: **26,215 / 26,250 gzip bytes**, **35 bytes remaining**.
  - First-party lazy graph: **55,798 / 58,000 gzip bytes**.
  - Document: **5,998 bytes gzip**.
- Existing built-preview browser smoke on owned strict port 4260 - passed **58/58** with Playwright 1.55.0 and system Chrome.
- Lighthouse accessibility run after the foundation - **score 1 with zero failed audits**.
- Temporary Lighthouse and Playwright installs removed; no package manifest or lockfile changes remain.
- Validation-only screenshots restored; owned preview stopped; pre-existing ports 4173 and 4214 untouched.
- `git diff --check` - passed.

## Budget decision

The foundation passes the current hard cap but leaves only 35 configured initial-shell gzip bytes. No cap was raised. Subsequent steps must recover shell bytes, move optional component styles into lazy modules, or pause for an explicit new cap decision. Accessibility and safety copy may not be shortened to create budget.

## Boundary

No push, PR, merge, Pages deployment, Firestore Rules publication, or real-account testing occurred. No protected workspace or lifecycle fixture was accessed.
