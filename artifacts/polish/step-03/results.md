# Step 3 results: core state and persistence reliability

## Confirmed defects reproduced and fixed

- Clear filters now synchronizes the Due select as well as the canonical filter state, visible results, and chips. The new browser regression reproduced `today` remaining selected before the fix and passes after it.
- Failed local Undo now keeps the current in-memory state, preserves the Undo entry, preserves exact raw `flowboard-workspace` content, and reports an actionable failure. Safety backup and main-workspace-write failures are distinct paths.
- Failed local import now validates a safety backup, persists a candidate workspace before replacing in-memory state, leaves the current board and import review open on failure, and preserves exact raw local storage.
- Failed card saves retain the dialog draft and do not create a false success or consume the recoverability entry.
- Move dialog positions now allow append-after-end for populated destination lists while preserving empty-destination and same-list bounds. The regression proves exact ordering and position announcement.
- Existing no-op movement behavior remains covered: self-drops do not persist or announce a move.

## Implementation scope

- `app.js`: canonical due-filter rendering, safety-before-mutation, rollback/undo-history handling, candidate import persistence, target-aware board merging, and correct populated-destination position bounds.
- `tests/browser-smoke.spec.mjs`: regressions for due-filter clearing, failed Undo, failed import, and populated-destination append.

## Verification

- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped. Syntax, static, build, budget, and isolation checks passed.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- Built-preview browser suite: 33 passed, 0 failed, 0 skipped.
- Emulator browser workflow: 1 passed, 0 failed.
- Failure diagnostics before fixes were intentionally recorded in the session process, then removed from the repository after extracting sanitized results.

## Final budget

- Reachable source: 214,385 / 217,500 bytes.
- Headroom: 3,115 bytes.
- Maintainability warning threshold: 210,000 bytes, still a warning by design.
- Initial-shell gzip: 23,694 / 25,000.
- First-party-lazy gzip: 44,011 / 55,000.
- Document gzip: 5,435, reported separately.
- Reachable sources: 23; production asset isolation passed.

## Boundaries

- Firestore Rules source and production cloud data unchanged.
- No protected workspace, real account, merge, push, or deployment touched.
- Raw test/emulator logs and generated debug output were removed after extracting counts. This sanitized report and the Step 1 curated evidence remain the durable checkpoint.
