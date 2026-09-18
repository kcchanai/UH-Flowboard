# Step 1 of 10 results: baseline and isolation

## Pinned state

- Implementation branch: `luna/ux-discoverability`
- Baseline revision: `48690bc9024c947250488428bffc86f70b8974a2`
- `origin/main`: refreshed and matches the baseline revision
- Rules source: no diff from `origin/main`
- Production: unchanged

## Commands and results

| Check | Result |
|---|---|
| `npm.cmd test` | 31 passed, 0 failed |
| `npm.cmd run check` | Passed: 11 semantic/runtime guards and adapter-boundary checks |
| `npm.cmd run build` | Passed: 47 modules transformed |
| `npm.cmd run measure:mvp-v2` | Passed; source and distribution budgets within limits |
| `npm.cmd run test:rules` | 24 passed, 0 failed |
| `node scripts/validate-test-isolation.mjs` | Passed: 25 production assets without Emulator-only markers |
| Built browser suite on fresh port 4215 | 48 passed, 0 failed |
| Anonymous live audit | 0 console errors, 0 page errors in the limited route |
| `git diff --check` | Passed |

Expected denied Rules probes print Firebase Emulator permission diagnostics. They are expected negative cases, and the test process exited successfully.

## Budget baseline

- Reachable production source: 239,380 bytes
- Hard cap: 240,000 bytes
- Headroom: 620 bytes
- Warning threshold: 210,000 bytes
- Initial shell gzip: 24,512 / 25,000
- First-party lazy gzip: 50,269 / 55,000
- Document gzip: 5,587
- Vendor gzip: 139,736
- Reachable sources: 27
- Unbudgeted reachable sources: 0

## Safety boundary

The audit used an anonymous deployed route and isolated local preview contexts only. No real Google account, protected workspace, cloud workspace, credential, token, raw workspace payload, or production mutation was accessed. The existing listener on port 4173 was not killed or reused; the fresh build was served on port 4215.

## Confirmed findings carried into implementation

- Account toolbar initials do not reflect an available provider photo.
- Profile sharing is nested under Cloud workspaces and Manage members.
- Signed-in account and cloud chooser labels are ambiguous.
- Appearance is icon-only in the toolbar.
- Profile changes have no explicit roster invalidation route.
- Members controls exist in source and contract tests; the cropped screenshot is not evidence they are absent.
