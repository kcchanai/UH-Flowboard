# Step 4 of 10 results: inline workspace-scoped sharing

## Controller behavior

- Reused the existing membership controller as the single profile-sharing controller and mounted its profile section in Account. Members no longer contains a duplicate profile-sharing surface.
- Added explicit loading state while the active workspace member record is checked.
- Added a bounded Retry action for profile-read failures. Read failure is not presented as unshared.
- Added workspace-specific status wording and audience explanation. The status names the active workspace when available and says the photo is visible to workspace members.
- Share, Update, and Stop capture the current actor, workspace ID, and request generation before asynchronous work. Late responses cannot update a different session or workspace.
- Share and Update write only the current member's existing presentation fields through `updateOwnMemberProfile`.
- Every successful profile mutation performs a targeted `listMembers` readback and compares the validated photo URL. A mismatch becomes an actionable verification failure instead of a false success.
- Stop sharing keeps the existing accessible confirmation dialog and states that the Google profile itself is unchanged.
- Rapid repeat clicks are disabled during the captured request. The controller re-enables only the controls belonging to the still-current context.
- A successful profile mutation emits an internal profile-change event for the roster step. No workspace ID or payload is placed in the event.

## Verification

- `npm.cmd test`: **31 passed, 0 failed**
- `npm.cmd run check`: passed; static and per-file budgets passed
- `npm.cmd run build`: passed; 47 modules transformed
- `npm.cmd run measure:mvp-v2`: passed
- `node scripts/validate-test-isolation.mjs`: passed; 25 production assets without Emulator-only markers
- Built browser suite: **50 passed, 0 failed**
- Focused Account/profile tests: **3 passed, 0 failed**
- Firestore Rules Emulator: **24 passed, 0 failed**
- Emulator-browser wrapper: **1 passed, 0 failed**, using system Chrome through `PLAYWRIGHT_EXECUTABLE_PATH` and a fresh alternate base port because the incumbent port 4180 was left untouched
- Negative readback test: passed; the UI showed verification failure and Retry rather than a sharing-success message
- Rules source: no diff
- `git diff --check`: passed

Expected denied Rules probes emit permission diagnostics in the Emulator output. They are expected negative cases and the suite exits successfully.

## Budget

- Reachable production source: **243,861 / 247,500 bytes**
- Headroom: **3,639 bytes**
- Warning threshold: **210,000 bytes**
- Initial shell gzip: **24,544 / 25,000**
- First-party lazy gzip: **51,186 / 55,000**
- Document gzip: **5,712**
- Vendor gzip: **139,736**
- Reachable sources: **27**
- Unbudgeted reachable sources: **0**

## Safety

No real account, protected workspace, production cloud mutation, Rules publication, push, PR, deployment, or production acceptance was used. Emulator fixtures and browser identities remained synthetic. Generated emulator logs and screenshots were removed or restored before the checkpoint.
