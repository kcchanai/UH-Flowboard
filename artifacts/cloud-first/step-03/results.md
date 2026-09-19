# Step 3 - Cloud-only session bootstrap and empty states

Status: complete

## Product behavior implemented

- Flowboard now boots into account resolution rather than loading or seeding `flowboard-workspace`.
- Unconfigured and initialization-failure builds show an honest cloud-unavailable gate with no editable board.
- Signed-out users see a sign-in gate. Sign-out, account change, revocation and workspace archival clear in-memory board content instead of falling back to a local editor.
- Fresh verified users atomically receive one empty personal owner workspace, membership and self-profile pointer.
- Competing first-login transactions converge on the single winning pointer.
- Existing workspace hints produce a selection/recovery state and never silently create another authorization container.
- Empty cloud workspaces remain empty. They do not normalize into the Website Launch sample board.
- Legacy `flowboard-workspace` and `flowboard-data` strings are never loaded as active task state and remain byte-identical through signed-out, unavailable, empty and cross-context flows.
- Normal local persistence, local Undo, local recovery/import/reset handlers and Return to local behavior were removed from the initial app. Legacy recovery/migration remains adapter-backed for the explicit Step 4 flow.
- Start here was removed from application markup. Its dedicated Board-header style was removed.

## Authorization and query hardening

- Self profile Rules now constrain `personalWorkspaceId` to an atomically available owner workspace and reject unknown profile fields or forged pointers.
- Board-root reads are lifecycle-aware. Viewers cannot read a snapshot-bearing board after its deletion lock starts.
- Board/list/card documents carry `lifecycleState`; normal collection queries are active-only.
- Generic updates cannot change snapshot or lifecycle fields.
- List/card deletion starts couple the payload's deleting state to the job, tombstone and board lock.
- Active cards are queried/listened to by active list ID plus lifecycle state; the source-controlled composite card index was added.
- Realtime card listeners are grouped in bounded sets of 30 active lists and generation-guarded when the list set changes.
- The security-review findings were reflected back into the Step 2 ADR and results.

## Verification

- Unit/domain: 38 passed, 0 failed, plus 7 later-feature TODO entries.
- Firestore Rules: 34 passed, 0 failed.
  - Includes four personal-workspace concurrency/profile tests.
  - Includes the six bounded-deletion tests with the new lifecycle query model.
- Tracked Auth/Firestore Emulator browser workflow: 2 passed.
  - Fresh account, two isolated contexts, one empty personal workspace, legacy byte equality, zero captured runtime errors.
  - Existing owner/editor/viewer convergence, denial, conflict, downgrade, removal, archive and restore workflow.
- Unconfigured built-preview session tests: 2 passed.
- Synthetic-configured signed-out built-preview test: 1 passed.
- Lighthouse accessibility:
  - Unconfigured cloud-unavailable gate: score 1, zero failed audits.
  - Synthetic-configured signed-out gate: score 1, zero failed audits.
- Aggregate `npm.cmd run validate`: passed.
- Production asset isolation: 29 assets passed.

Expected authorization denials were sanitized to count-only Rules evidence. No document payloads, credentials, IDs or account addresses are retained in Step 3 artifacts.

## Budgets

- Raw source: 270,700 / 300,000 bytes.
- `index.html`: 26,171 / 27,250 bytes.
- Unconfigured initial shell: 25,973 / 26,250 gzip bytes.
- Synthetic-configured initial shell: 26,028 / 26,250 gzip bytes.
- First-party lazy graph: 57,941 / 58,000 gzip bytes.
- Document gzip: 5,803 unconfigured; 5,805 configured.

All hard budgets pass. Lazy headroom is only 59 bytes, so Step 4 must replace obsolete chooser/migration code rather than append another module.

## Candidate identities

- Rules candidate blob: `24ef78903ddf74001ff72711471d9be69536459f` before this checkpoint commit.
- Index candidate blob: `3d27467ebfd11554ff8099b084dad7fbf434ba2e` before this checkpoint commit.

## Boundary

No Rules or indexes were published. No production account, configuration, workspace, fixture or browser profile was used. No push, PR, merge or deployment occurred.
