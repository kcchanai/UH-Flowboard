# Step 4 of 10 results: Account and profile presentation

Status: **complete**

## Implemented

- Moved Account-only presentation rules out of the initial stylesheet into a dynamically imported `auth-ui-style.js` module.
- Added clear Account section rhythm: identity, current workspace, photo sharing, local-data safety notice, and footer actions.
- Increased separation between photo controls and the local-data notice.
- Made the current workspace value a distinct readable block with safer long-name behavior.
- Grouped Account footer actions so Sign out stays separate from Appearance and Cloud workspaces without changing the existing controls or routes.
- Preserved Account-first photo sharing, refresh, stop-sharing, retry, initials fallback, and the existing workspace-scoped identity path.
- The Account dialog waits for its lazy style module before opening, avoiding an unstyled-dialog flash.

## Verification

- `npm.cmd run check` - passed. Static validation: **11 semantic/runtime guards plus adapter-boundary checks**.
- Unconfigured build and measure - passed.
  - Raw source: **268,217 / 300,000 bytes**.
  - Initial shell: **26,097 / 26,250 gzip bytes**.
  - First-party lazy graph: **56,354 / 58,000 gzip bytes**.
  - Document gzip: **5,996 bytes**.
- Synthetic configured build and measure - passed.
  - Initial shell: **26,163 / 26,250 gzip bytes**, 87 bytes remaining.
  - First-party lazy graph: **56,354 / 58,000 gzip bytes**.
- `src/auth-ui.js`: **7,323 / 8,000 bytes**.
- `src/auth-ui-style.js`: **1,097 / 4,000 bytes**.
- Unconfigured built-preview browser smoke: **59/59**.
- Synthetic configured built-preview browser smoke: **59/59**.
- Existing Account/profile browser coverage confirmed session fanout, photo controls, focus return, initials fallback, readback failure, and raw local-workspace preservation.
- Fresh Lighthouse accessibility: **score 1 with zero failed audits**.
- `git diff --check` - passed.
- Temporary Lighthouse/Playwright installs removed; validation screenshots restored; owned preview stopped; pre-existing ports 4173 and 4214 untouched.

## Budget decision

No cap was raised. Account styling remains in the lazy graph. The configured shell has 87 bytes of headroom; future optional UI styles should follow the same lazy boundary or recover bytes before changing the shell.

## Boundary

No push, PR, merge, Pages deployment, Firestore Rules publication, or real-account testing occurred. No protected workspace or lifecycle fixture was accessed.
