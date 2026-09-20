# Flowboard permission-denied repair progress

Scope: local implementation and fresh demo Auth/Firestore Emulator qualification only. No production records, real account, normal browser profile, migration, push, PR, merge, Pages deployment, or Firebase Rules/index publication.

Baseline: `main` `47454298495dd99f83f3c1f33dac8e8f2ff3b7b2`
Rules baseline and unchanged source blob: `71b5e7aa2fd1fae4b9f2c53d31f8fd6e081b333d`
Indexes baseline and unchanged source blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
Branch: `fix/permission-denied-diagnosis`

## Ledger

- [x] Step 1 of 7: pin baseline, map execution, run baseline
- [x] Step 2 of 7: add privacy-safe stage attribution
- [x] Step 3 of 7: reproduce denied operation with real SDK and Rules
- [x] Step 4 of 7: implement the smallest justified correction
- [x] Step 5 of 7: qualify user-visible recovery and persisted board creation
- [x] Step 6 of 7: run full qualification, CI selection, budgets
- [x] Step 7 of 7: package local candidate, commit, and stop before deployment

## Checkpoints

### Step 1

- Untouched baseline `npm.cmd run validate`: exit 0, 43 unit tests passed, static/build/isolation checks passed.
- Untouched baseline `npm.cmd run test:rules`: exit 0, 44 Rules tests passed.
- Untouched baseline packaged Emulator workflow: exit 0, 18 tests passed.
- Execution map: Auth callback -> `app.js activateSession` -> `ensurePersonalWorkspace` -> `fetchCloudWorkspace` -> workspace root -> boards query -> lists query -> cards query. The old outer catch labeled all failures as account setup failure.

### Step 2

- `firebase-cloud-workspace.js` now adds fixed stage labels at server reads in `fetchCloudWorkspace`: `workspace-root`, `boards-query`, `lists-query`, and `cards-query`.
- `app.js` carries only the normalized existing error code plus the fixed stage into the fail-closed UI state. No raw Firebase message, path, document ID, UID, email, token, or payload is shown.
- Bootstrap/recovery behavior and Firestore Rules were not broadened. Bootstrap failures without an adapter stage remain classified as the generic `session` stage until an authorized affected-account diagnostic identifies the exact boundary.

### Step 3

- Added a fresh synthetic Auth/Firestore Emulator fixture with a valid personal home, board, list, card, and a lifecycle tombstone that makes the real card query Rules-denied.
- Baseline regression was red: mode had no code/stage and generic copy.
- Candidate regression is green: the real adapter reports `permission-denied` at `cards-query`, with no fixture identifier in the visible message.
- Existing Rules and Emulator coverage continues to exercise fresh homes, hints, mixed-case claims, invalid canonical pointers, owner/editor/viewer denial, concurrency, revocation, lifecycle, and recovery. The user account's actual denied operation remains unconfirmed.

### Step 4

- The smallest justified correction is diagnostic attribution, not a speculative data repair or Rules change.
- No automatic replacement of a canonical home occurs on generic permission-denied. No existing board, membership, hint, backup, or authorization scope is changed.
- The source cap forced consolidation. The candidate is one byte under the hard raw-source cap.

### Step 5

- Synthetic startup denial -> Retry setup -> verified home -> New board -> persisted board remains green.
- The new failure screenshot states `Cloud unavailable (permission-denied at session). Retry setup or open Data recovery.` and does not claim the account is merely empty.
- 1440x900 and 960x540 failure captures show reachable Retry setup, Data recovery, and Close controls without clipping.
- Recovered capture shows an enabled New board control and a persisted first board.

### Step 6

- Final `npm.cmd run validate`: exit 0, 43 unit tests, static/build/isolation checks passed.
- Final `npm.cmd run test:rules`: exit 0, 44 Rules tests passed.
- Final packaged Emulator runner: exit 0, 19 tests passed. It includes the 18-test browser spec plus deletion-engine coverage.
- Exact CI-style configured Emulator selection: exit 0, 18 tests passed. The workflow selects only the browser spec and does not include deletion-engine coverage.
- Configured browser selection: exit 0, 8 tests passed.
- Lighthouse accessibility: score 1, zero failed audits.
- Source: 299999 / 300000. `src/cloud-workspace-ui.js`: 13990 / 14000.
- Unconfigured final build: initial shell gzip 25976, first-party lazy gzip 58861.
- Configured final build: initial shell gzip 26026, first-party lazy gzip 58861.
- No owned preview or emulator process remains after cleanup.

### Step 7

Package the local candidate, record implementation/evidence commit identities, verify a clean worktree, and stop. Production publication and affected-account acceptance remain separate owner gates.
