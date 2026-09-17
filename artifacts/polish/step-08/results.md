# Step 8 results: discovery, onboarding, and secondary workflows

## Changes

- Reworded Start here guidance for routine office use: Board actions now explicitly mention search, export, recovery, and import; cloud browsing and retained archives remain clear.
- Added desktop board-discovery coverage with eight long board names, searchable filtering, board selection, and focus return.
- Existing onboarding, recovery, import, archive, cloud-boundary, phone discovery, and empty/error-state tests remain active.

## Verification

- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- Built-preview browser suite: 40 passed, 0 failed, 0 skipped.
- Emulator browser workflow: 1 passed, 0 failed.
- Public copy remains free of newly introduced em dashes.

## Final budget

- Reachable source: 216,103 / 217,500 bytes.
- Headroom: 1,397 bytes.
- Maintainability warning threshold: 210,000 bytes, still a warning by design.
- Initial-shell gzip: 23,767 / 25,000.
- First-party-lazy gzip: 44,248 / 55,000.
- Document gzip: 5,455, reported separately.
- Reachable sources: 23; production asset isolation passed.

## Boundaries

- Firestore Rules source and production cloud data unchanged.
- No protected workspace, real account, merge, push, or deployment touched.
- Raw runner logs and generated emulator debug output were removed after extracting sanitized results.
