# Flowboard Google sign-in permission-denied candidate

## Status

This is a verified local diagnostic candidate, not a confirmed production repair. It must stop before push, PR, merge, Pages deployment, Rules/index publication, production data access, migration, or real-account acceptance.

The supplied screenshot proves that the signed-in UI reached a `permission-denied` error and exposed Retry setup plus Data recovery. It does not identify whether the denial occurred during bootstrap, workspace-root verification, boards, lists, or cards loading. The current app previously used one catch around both account setup and `fetchWorkspace`, so its old wording was not diagnostic.

## Implemented correction

- Added fixed stage attribution at the real workspace root, boards, lists, and cards reads in `src/adapters/firebase-cloud-workspace.js`.
- Updated `app.js` to retain a safe Firebase code and fixed stage in the fail-closed mode, with copy such as `Cloud unavailable (permission-denied at cards-query). Retry setup or open Data recovery.`
- Kept canonical-home repair, authorization Rules, existing data, legacy hints, backups, and recovery behavior unchanged.
- Added a fresh Emulator fixture that proves a valid personal home can still fail at a descendant cards query when a lifecycle tombstone makes the list unreadable under the deployed Rules contract.
- Kept test-generated screenshots in this artifact directory so historical account-bootstrap evidence remains unchanged.

## Root-cause classification

### Proven locally

1. The old UI hid the operation boundary and reported a generic account-setup error.
2. A real Auth/Firestore Emulator account with a valid personal home can receive `permission-denied` from the cards query when a retained lifecycle tombstone invalidates the list parent. The candidate reports `cards-query` without exposing IDs or raw payloads.
3. The synthetic injected startup denial remains a generic `session` classification because it intentionally fails before the real adapter boundary. It validates presentation and recovery controls only.

### Still unconfirmed

The affected Google account's production denied operation and document state were not inspected. No production records, normal browser profile, tokens, cookies, or account identifiers were accessed. The screenshot alone cannot justify automatic pointer repair, a Rules change, data migration, or a query contract change.

## Qualification

- Unit and domain suite: 43 passed.
- Firestore Rules Emulator suite: 44 passed.
- Packaged Emulator runner: 19 passed.
- Exact CI-style configured Emulator selection: 18 passed. The tracked package additionally runs deletion-engine coverage, producing 19.
- Focused real-adapter descendant-denial regression: 1 passed.
- Focused synthetic startup Retry/create regression: 1 passed.
- Configured browser selection: 8 passed.
- Lighthouse accessibility: score 1, zero failed audits.
- Static, syntax, performance, build, workflow-gating, asset-isolation, and diff checks: passed.

## Budget

- Raw source: 299999 / 300000, one byte headroom.
- `src/cloud-workspace-ui.js`: 13990 / 14000.
- Unconfigured initial shell gzip: 25976 / 26250.
- Configured initial shell gzip: 26026 / 26250.
- First-party lazy gzip: 58861 / 60000 in both builds.
- No budget cap was increased. Further changes require semantic consolidation or an explicit budget decision.

## Visual evidence

See `SCREENSHOT_INDEX.md`. The failure state was inspected at normal, 1440x900, and 960x540 viewports. It retains visible Retry setup, Data recovery, and Close controls, gives a truthful unavailable state, and does not claim that the account is merely empty. The recovered state shows a persisted first board and enabled New board controls.

## Release boundary

No client push, PR, merge, Pages deployment, Firebase Rules/index publication, production document access, migration, or real-account acceptance was performed for this candidate. See `RELEASE_CHECKLIST.md` for the required owner decisions and acceptance gates.
