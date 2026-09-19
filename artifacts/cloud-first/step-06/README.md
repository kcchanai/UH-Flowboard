# Step 6 evidence - reliable command, confirmation, and lifecycle engine

## Command boundary

Cloud mutations now return an awaitable command handle rather than a boolean that means only "started".

Results distinguish:

- `pending`
- `committed`
- `rejected`
- `conflict`
- `denied`
- `offline`
- `verification-pending`
- `failed`
- `stale`

Each started command retains one cryptographically random mutation ID and a retry function that reuses that ID. Session, workspace, board, and role/context transitions advance a generation and invalidate late command completions. An older result cannot replace a newer board or workspace.

The adapter recognizes idempotent retries for newly created, updated, and deleted granular documents. Mutation readback uses server-only reads. A transaction that committed but whose readback is unavailable reports `verification-pending`, retains the optimistic state, and does not falsely roll back committed cloud truth.

## Confirmation boundary

The shared confirmation close handler now:

1. snapshots the completed action and trigger;
2. clears the completed request and stale `returnValue`;
3. resets move-only fields;
4. invokes the completed callback;
5. restores old focus only if the callback did not open another confirmation.

The production dialog test proves dirty-card discard opens and preserves the second cloud lifecycle confirmation rather than clearing it.

## Bounded lifecycle engine

`src/adapters/firebase-deletion.js` implements the Rules-qualified known-tree lifecycle protocol:

- server-only preflight and count verification;
- supported caps of 100 lists, 1,000 cards, 10,000 comments per board, and 500 comments per card;
- one atomic start batch binding job, board lock, lifecycle control, and target tombstone;
- current-role checks through Rules on every maintenance operation;
- comment purge pages of 10;
- card and list tombstones before payload deletion;
- bottom-up comment, card, list, and board deletion;
- server-only absence verification against the exact preflight records;
- atomic finish/unlock for card/list jobs;
- durable deleted board control for board jobs;
- interrupted board-job resumption by operation ID;
- completed-job re-verification and residue cleanup;
- owner takeover remains possible after editor revocation.

Rules expose locked board metadata only to the current authorized lifecycle actor. Viewers remain denied. Missing tombstoned card reads are payload-free verification probes.

`complete` is advisory, not trusted proof of purge. Firestore Rules cannot prove a descendant collection is empty, so an authorized client can finalize early. Immutable job scope, lifecycle control, and non-removable list/card tombstones prevent legitimate reuse of the target identifiers. Resuming a complete job safely re-inventories only its original scope and removes retained residue. Treating completion as read-only would strand descendants after early or forged finalization.

## Verified scenarios

- Awaitable committed command from real Auth/Firestore Emulator UI.
- Read-only command returns an awaitable rejected result without mutation.
- Delayed command completion cannot replace a newer workspace context.
- Commit/readback ambiguity retains optimistic data and reports `Verification pending`.
- Same-ID board creation retry creates exactly one board and one activity record.
- Dirty-draft discard preserves a nested lifecycle confirmation.
- Account switching clears and closes the prior account directory immediately.
- Real lifecycle adapter deletes and verifies a card with 12 comments.
- Real lifecycle adapter deletes a list with active and archived cards plus comments.
- Real lifecycle adapter resumes and completes an interrupted board job.
- Existing direct Rules denial, tombstone, scope, revocation, and resurrection tests remain green.

## Verification

- `npm.cmd run validate`: passed.
  - Unit/domain/adapter: 42 passed, 7 later-step TODO reproductions, 0 failed.
  - Syntax/static/performance/workflow guards: passed.
  - Production build and asset isolation: passed.
- `npm.cmd run test:rules`: 40 passed, 0 failed on the final tree.
- `npm.cmd run test:emulator-browser`: 18 passed, 0 failed on the final tree.
- Configured signed-out built-preview test: 1 passed.
- Unconfigured built-preview tests: 2 passed.
- Focused built command/confirmation browser tests: 2 passed.
- `git diff --check`: passed.

## Budgets

- Raw source: 296,682 / 300,000 bytes, 3,318 bytes headroom.
- `index.html`: 25,687 / 27,250 bytes.
- Unconfigured initial shell: 26,193 / 26,250 gzip bytes.
- Configured initial shell: 26,239 / 26,250 gzip bytes.
- First-party lazy graph: 57,988 / 58,000 gzip bytes.
- All per-file caps passed.

To fund the lifecycle engine without changing caps, obsolete browser-shipped Phase H diagnostic methods were removed from the reachable production graph. The standalone direct-access validation script remains available for the later explicitly authorized production gate.

## Local-only boundary

Rules blob: `79ef33714e1fd96092ecd1b23af473e90027548d`

Index blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

Nothing was pushed, deployed, published, migrated in production, or tested with a real account or protected workspace.
