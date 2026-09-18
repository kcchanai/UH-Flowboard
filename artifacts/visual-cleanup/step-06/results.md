# Step 6 of 10 results: Members, invitations, and ownership controls

Status: **complete**

## Implemented

- Added dedicated member and invitation row hooks while preserving existing `.workspace-board` compatibility selectors.
- Split Members styling into a separate lazy `members-style.js` module, loaded before the cloud access surface is used.
- Widened the Members and invitations dialog and kept one bounded inner scroll surface.
- Reflowed invite and ownership forms from rigid narrow columns into responsive stacks.
- Made member rows shrink-safe: identity and role metadata stay readable, role selectors and Remove/Leave actions remain visible, and long names can wrap.
- Made invitation history rows use separate identity/status/action tracks while preserving pending Copy link and Revoke actions.
- Added a visually separated Ownership transfer treatment with an accessible form label, visible target selectors, and the existing explicit confirmation flow.
- Preserved owner-only controls, viewer Leave behavior, invite state handling, profile sharing, async generation guards, and all adapter mutation boundaries.

## Verification

- `npm.cmd run check` - passed. Static validation: **11 semantic/runtime guards plus adapter-boundary checks**.
- Unconfigured build and measure - passed.
  - Raw source: **272,667 / 300,000 bytes**.
  - Initial shell: **26,081 / 26,250 gzip bytes**.
  - First-party lazy graph: **57,921 / 58,000 gzip bytes**.
  - Document gzip: **6,003 bytes**.
- Synthetic configured build and measure - passed.
  - Initial shell: **26,147 / 26,250 gzip bytes**.
  - First-party lazy graph: **57,921 / 58,000 gzip bytes**.
- `src/members-ui.js`: **11,993 / 12,000 bytes**.
- `src/cloud-workspace-ui.js`: **12,971 / 13,000 bytes**.
- `src/cloud-workspace-style.js`: **1,824 / 4,000 bytes**.
- `src/members-style.js`: **2,670 / 4,000 bytes**.
- Unconfigured built-preview browser smoke: **59/59**.
- Synthetic configured built-preview browser smoke: **59/59**.
- Production-markup synthetic geometry audit: **6 captures**, zero console/page errors.
  - Account desktop/narrow overflows: **0/0**.
  - Cloud chooser desktop/narrow overflows: **0/0**.
  - Members desktop/narrow overflows: **0/0**.
  - Zero-width identities: **0** in the captured chooser/member identity set.
- Fresh Lighthouse accessibility: **score 1 with zero failed audits**.
- `git diff --check` - passed.
- Temporary Lighthouse/Playwright installs removed; validation screenshots restored; owned preview stopped; pre-existing ports 4173 and 4214 untouched.

## Evidence

- `artifacts/visual-cleanup/step-06/synthetic-audit.json`
- `artifacts/visual-cleanup/step-06/member-screens/synthetic-members-1440.png`
- `artifacts/visual-cleanup/step-06/member-screens/synthetic-members-390.png`

## Boundary

No push, PR, merge, Pages deployment, Firestore Rules publication, or real-account testing occurred. No protected workspace or lifecycle fixture was accessed.
