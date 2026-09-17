# Step 2 results: safe engineering headroom

## Behavior-preserving consolidation

- Added small shared query/event helpers in the main local UI and lazy cloud workspace UI. The first verification run caught self-referential helper rewrites introduced by the automated compaction; those exact helpers were repaired before the final run.
- Added shared Firestore context and page-size normalization helpers without changing authentication or query limits.
- Added one local storage-write helper while preserving all current, legacy, fresh, and ordinary-save write paths.
- Removed non-runtime source comments only. No public safety, authorization, accessibility, or user-facing copy was removed.
- Removed inter-tag HTML whitespace only after verifying normalized visible text was identical.
- Removed CSS declaration spacing only; selector/property meaning and responsive/accessibility rules remain present.

## Measured budget

- Baseline reachable source: 217,207 bytes.
- Final reachable source: 213,410 bytes.
- Net reduction: 3,797 bytes.
- Final cap: 217,500 bytes.
- Final headroom: 4,090 bytes.
- Maintainability warning threshold: 210,000 bytes, still exceeded and intentionally retained as a warning.
- Final initial-shell gzip: 23,581 bytes of 25,000.
- Final first-party-lazy gzip: 44,011 bytes of 55,000.
- Final document gzip: 5,434 bytes. Document transfer remains reported separately.
- Reachable sources: 23. Unbudgeted reachable sources: 0.
- Production asset isolation: 21 assets passed with no Emulator-only markers.

## Verification

- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped. Syntax/static/build/budget/isolation checks passed.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- Built-preview browser suite: final run 29 passed, 0 failed, 0 skipped.
- Emulator browser workflow: final run 1 passed, 0 failed.
- Focused startup and lazy cloud-workspace migration tests passed after the helper repairs.
- Earlier failed attempts are retained in the progress narrative: first startup timeout from the self-referential main `$$` helper; later 28/29 run exposed self-referential lazy cloud `$`/`el` helpers. These were fixed and the complete final suite passed.

## Boundaries

- Firestore Rules source and hash unchanged.
- No production Firestore data, protected workspace, real account, merge, push, or deployment touched.
- Disposable raw runner logs and emulator debug output were removed after extracting sanitized counts. Curated evidence is this file plus the committed Step 1 baseline.
