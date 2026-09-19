# Step 2 - Cloud/deletion architecture proof

Status: complete

## Decision artifacts

- `ARCHITECTURE.md`: cloud-only runtime, personal-scope bootstrap, migration invariants, known-tree deletion protocol, roles and failure semantics.
- `BUDGET_AND_COST.md`: measured semantic-removal candidates, source/gzip allocation, operation/read/delete estimates and index decision.

## Executable Rules proof

New synthetic-only `tests/deletion-rules.test.mjs` exercises the real Firebase Web SDK against the Firestore Rules Emulator.

Final Rules result: **30 passed, 0 failed**.

- Existing authorization suite: 24/24.
- New deletion protocol suite: 6/6.

Proved cases:

- Coupled card job/control/board/tombstone start and viewer denial.
- A 27-comment card is read and deleted through multiple bounded pages/chunks.
- Unbounded comment queries remain denied while bounded maintenance queries pass.
- Early client completion does not expose/recreate a tombstoned card; authorized cleanup remains resumable.
- List deletion covers active and archived sibling cards by exact `listId`; an unrelated list/card remains unchanged.
- Cross-scope tombstone creation, stale expected revisions, mutable job/tombstone fields, competing board jobs and same-batch normal-write bypass are denied.
- Board deletion is owner-only; parent-first deletion leaves descendants hidden from viewers and owner-cleanable after completion.
- Board/list/card identities cannot be recreated after their durable lifecycle marker exists.
- Revoking an initiating editor stops cleanup; the current owner can take over.
- Legacy snapshot boards reject list/card deletion and direct snapshot tampering; whole-board deletion remains possible.
- Workspace root deletion remains denied.

Expected `PERMISSION_DENIED` diagnostics are negative-test evidence. TAP exit code was 0.

## Security invariant

Rules never trust a client count or `complete` field as collection-emptiness proof. Permanent minimal tombstones deny ordinary target access and ID reuse, while immutable-scope jobs permit only current authorized cleanup. The target remains safe if the client closes, lies about completion, loses its role, or deletes a parent before descendants.

List/card deletion is denied while a legacy board `snapshot` field remains, preventing stale duplicate content from resurrecting deleted entities. A dedicated owner-only verified snapshot scrub will be implemented with migration in Step 4.

## Bounds proven

- Comment query limit: 25.
- Purge comment write chunk: 10.
- Metadata enumeration page: 25.
- One tombstone per entity write for v1.
- One active operation lock per board.
- Job completion can be resumed by the current authorized role.

Proposed total preflight caps are documented in the ADR and must receive boundary unit/Emulator coverage before release. Total counts are client safety gates, not Rules authorization facts.

## Budget and identifiers

- Production source remained **272,829 bytes**; Step 2 added Rules/tests/docs, not shipped JavaScript.
- Rules candidate: 42,040 bytes.
- Rules candidate blob: `3c74224080a1849b98b35a3a27bdcd30fac601ee`.
- Index source remains unchanged at blob `415027e5ddaf944819977c1d5e9aaf49e835093f`; no composite deletion index is needed.
- Syntax/static/performance/workflow guards passed.

## Boundary

No Rules or indexes were published. No production project, account, browser profile, workspace or fixture was accessed. No remote Git action occurred.
