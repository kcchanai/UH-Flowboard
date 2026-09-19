# Step 4 evidence - safe legacy migration and schema upgrade

## Scope

This checkpoint adds two separate, explicit migrations:

1. Read-only browser legacy inspection followed by an owner-approved import into the signed-in personal scope.
2. Owner-only legacy cloud snapshot conversion into granular board, list, and card documents.

No migration runs on sign-in. The browser legacy payload keys are never rewritten or removed. Imported history remains labeled `browser-legacy`, and free-text assignees remain non-authoritative legacy labels.

## Safety invariants

- Import identity binds the authenticated UID, destination workspace, and canonical source digest.
- Import receipts are immutable except for the verified state transition.
- Import targets use deterministic IDs and remain hidden with lifecycle state `importing` until atomic finalization.
- Imports support at most four boards per operation and reject five before any write.
- Migration/import document work uses groups of four. The real adapter and Rules passed a same-board four-card group.
- Final verification uses server-only document reads and field equivalence, not counts alone.
- Snapshot migration supports interrupted `migrating` state, verifies granular records, then scrubs the duplicate snapshot.
- Generic board create/update cannot add or change `snapshot` or `granularVersion`.
- Ordinary members cannot read importing, migrating, deleting, or archived-owner-maintenance payloads.
- Cloud backup includes active and archived board/list/card content plus paginated authenticated comments. Membership, invitations, activity, and lifecycle controls are explicitly excluded.

## Verified fixtures

- No legacy data.
- Browser export schemas 1 through 5.
- Legacy `flowboard-data` fallback.
- Empty current workspace.
- Malformed preferred source.
- Duplicate names and IDs across imported boards.
- Exact raw-string preservation before and after success and denial.
- Account-bound import denial and idempotent retry.
- Four-board supported import and five-board preflight rejection.
- Paginated 27-comment backup.
- Snapshot-only board with seven cards, including a four-card Rules write group.
- Interrupted migration retry and already-verified reinvocation.
- Archived board owner backup visibility and viewer denial.

## Verification

- `npm.cmd run validate`: passed.
  - Unit/domain/adapter: 42 passed, 7 intentional later-step TODO reproductions, 0 failed.
  - Syntax/static/performance/workflow guards: passed.
  - Production build and production-asset isolation: passed.
- `npm.cmd run test:rules`: 39 passed, 0 failed.
- `npm.cmd run test:emulator-browser`: 9 passed, 0 failed.
- Configured signed-out built-preview test: 1 passed.
- Unconfigured built-preview tests: 2 passed.
- Focused built manager/migration/dialog tests: 3 passed.
- `git diff --check`: passed.

## Budgets

- Raw source: 285,691 / 300,000 bytes, 14,309 bytes headroom.
- `index.html`: 25,687 / 27,250 bytes.
- Unconfigured initial shell: 25,758 / 26,250 gzip bytes.
- Configured initial shell: 25,804 / 26,250 gzip bytes.
- First-party lazy graph: 56,510 / 58,000 gzip bytes in both builds.
- All per-file caps passed. `firebase-migration.js`: 15,972 / 16,000 bytes.

## Local-only boundary

Rules blob: `4b6dbe1f82724ff764e71f47b650a5e5b4da8b07`

Index blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

Nothing was pushed, deployed, published, migrated in production, or tested with a real account or protected workspace.
