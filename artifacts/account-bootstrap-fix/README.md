# Account bootstrap and board-creation failure investigation

## Scope and current status

Local repair candidate, not deployed. The reported production account's underlying error code has NOT been observed, so this is not an attestation that the specific production failure is resolved.

- Baseline/live release inspected: `ebb03434982d5ff66cbed9845eecff6ca1e342d4`
- Local implementation: `f6ee5159bac57c0b16bf2c834882ed4141e50eb6`
- Branch: `fix/account-bootstrap-recovery`
- Candidate Rules blob: `c183d52b320675b28334709f738bbda772c6916b`
- Unchanged indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

No real-account browser session, production Firestore document access, protected-workspace access, data migration, push, PR, Pages deployment, or Rules/index publication was performed for this repair. An anonymous read of the public client assets confirmed the configured project matches the target identified in the prior release, without printing configuration values.

## Verified defects

1. `validUserProfileShape` compared normalized `emailLower` to an unnormalized authenticated token email. Two new Rules tests failed with `permission-denied` before the fix: fresh profile creation and an existing normalized profile with a mixed-case token email. Both now pass using `request.auth.token.email.lower()`. UID ownership, email verification, profile field allowlists, pointer immutability, and workspace authorization remain enforced. A different-email update is still denied.
2. Startup failures offered prose saying to retry but no retry control. The board directory could report a normal empty state and offer creation guidance while no verified creation destination existed. Added working Retry setup and Data recovery controls to both failure surfaces, safe allowlisted diagnostic codes, and honest blocked/loading copy.
3. The chooser inferred a creation destination from the first personal-looking owner workspace. It now requires the canonical account-home ID successfully verified by the startup path. A broken pointer cannot be bypassed by another personal-looking owner scope. Existing board browsing/recovery stays separate from that creation gate.
4. Creation controls now start disabled/hidden during directory loading and remain unavailable after a failed load. Stale directory results are discarded before they replace the current in-memory directory.

A duplicate JSON-download implementation was replaced with the existing download helper to keep the repair within existing source budgets. No caps changed.

## Evidence and limits

- `npm.cmd run validate`: exit 0; 43 unit tests; static, source budget, build, workflow selection contract and asset-isolation checks passed.
- `npm.cmd run test:rules`: exit 0; 43 Rules tests passed.
- `npm.cmd run test:emulator-browser`: exit 0; 18 tests passed through the actual packaged runner, including the deletion-engine test.
- CI's existing emulator command selects 17 tests from `emulator-browser.spec.mjs`, including every new startup regression. The local packaged runner additionally selects the deletion-engine test. No new GitHub CI run was performed because the branch is local only.
- Exact configured CI browser selection: 8 passed.
- Built failure dialog at 960x540: 0 axe violations, 0 page errors, successful pointer Close.
- Lighthouse accessibility: 1.0; 0 failed audits.
- Source: 299,004 / 300,000 bytes.
- Initial shell gzip: 25,903 unconfigured; 25,943 synthetic configured; cap 26,250.
- First-party lazy gzip: 58,707; cap 60,000.
- Every per-file cap passed. `scripts/source-budget.mjs` is unchanged.
- Validation-owned ports 4180, 4391, 8080 and 9099 were verified non-listening after completion.

The retry browser test injects a one-time adapter denial to reproduce the error UI, then calls the real production adapter against fresh Auth/Firestore emulators for bootstrap and persisted board creation. It is NOT evidence of the production account's error cause.

The Auth Emulator lowercases Google provider email even when the synthetic input is mixed-case. Thus mixed-case TOKEN authorization is proven by Rules tests, not by the Google-provider browser test. That browser test proves Google-style sign-in, canonical home creation, real board persistence, and reload through the adapter.

## Inspected screenshots

- `blocked-boards.png`: synthetic setup failure; no false empty/synchronized claim; New board disabled (also asserted by Playwright); visible Retry setup, Data recovery and Close.
- `recovered-boards.png`: real emulator-persisted first board after Retry setup; active board and creation controls visible.
- `built-error-short-desktop.png`: final built dialog at 960x540 with unclipped recovery and Close controls; zero axe violations.

`validation-summary.json`, `preview-results.json`, and budget summaries record redacted results. `qualify-preview.cjs` is a repository-local synthetic configured preview/browser/accessibility runner. Raw fixture and CLI logs were removed rather than committed.

## Remaining live diagnosis and release gate

Ask the operator to reload the live page with the browser Console open and share ONLY the short code after `Flowboard cloud session failed.` (for example, `permission-denied`, `failed-precondition`, or `auth/network-request-failed`). Do not request tokens, raw SDK logs, profile bodies, email addresses, workspace IDs, or browser-storage dumps. Do not clear browser storage or rewrite existing profile/workspace documents to make startup pass.

If the confirmed code points elsewhere, reproduce that condition synthetically before expanding the repair. Legacy profile shape, an actual email-address change, profile capacity, token refresh failures, and cloud service/index state are not repaired automatically by this candidate.

Publishing this candidate requires separate authorization for the exact client and Rules revisions and independent release readback. Signed-in production acceptance remains separate from anonymous deployment smoke.

## Reusable test lessons

- Distinguish unavailable directory data from a verified empty directory; creation needs a verified destination, not just an enabled button.
- Exercise error-to-retry-to-persisted-first-board through real adapters, not only injected empty-directory UI.
- Anchor creation to the verified canonical pointer and test a broken pointer alongside a still-discoverable personal-looking owner workspace.
- Account for Auth Emulator email normalization; explicit Rules claims tests are needed to cover mixed-case tokens.
- Do not use the return value of `withSecurityRulesDisabled` for assertions; assert inside its callback because the wrapper resolves without forwarding that value.
- Keep new regressions in both the packaged runner and CI's actual selected specs, and report any selection-count difference explicitly.
