# Account bootstrap and board-creation failure investigation

## Scope and current status

This is a **verified local repair candidate**, not deployed. The reported production account's original error code was not observed directly, so the candidate addresses the proven failure classes without claiming real-account resolution.

- Baseline/live release inspected: `ebb03434982d5ff66cbed9845eecff6ca1e342d4`
- Implementation commit: `dbbd66ce06ab108db1b280c035ac34cab8e5b9a8`
- Branch: `fix/account-bootstrap-recovery`
- Candidate Rules blob: `71b5e7aa2fd1fae4b9f2c53d31f8fd6e081b333d`
- Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

No real-account browser session, production Firestore document access, protected-workspace access, data migration, push, PR, Pages deployment, or Rules/index publication was performed for this repair.

## Proven defects addressed

1. **Normalized email versus token email mismatch.** The client stores `emailLower`, while Rules previously compared it to the token email without normalization. Mixed-case token tests failed with `permission-denied`. Rules now compare against `request.auth.token.email.lower()`. A different-email update remains denied.
2. **Invalid canonical pointer could never self-heal.** An existing `personalWorkspaceId` was treated as immutable even when its workspace was non-personal, stale, archived, unready, or otherwise invalid. Initial startup still stops at recovery instead of silently repointing. The explicit **Repair account setup** action atomically creates a new personal home only after verifying that the prior pointer is invalid, updates the canonical pointer, and retains the old pointer in `workspaceIds` for recovery.
3. **Retry was not a real action.** Startup and Boards now expose working Retry setup, Repair account setup when the canonical pointer is invalid, and Data recovery controls.
4. **Failed directory loads looked like an empty account.** New board remains disabled until the verified canonical home is present. The dialog says boards cannot be listed until setup is verified instead of claiming that no boards exist.
5. **Creation destination is canonical-home-bound.** A legacy/shared or personal-looking owner scope cannot silently become the creation destination.

## Validation evidence

- `npm.cmd run validate`: exit 0; 43 unit tests; static, syntax, build, source budget, workflow contract and asset-isolation checks passed.
- `npm.cmd run test:rules`: exit 0; 44 Rules tests passed, including mixed-case email and explicit stale-pointer recovery.
- `npm.cmd run test:emulator-browser`: exit 0; 18 tests passed through the actual packaged runner, including 17 emulator-browser tests plus the deletion-engine test.
- Exact configured CI-style browser selection: 8 passed.
- Failure-state axe audit: 0 violations; page errors: 0.
- Lighthouse accessibility: score 1.0; failed audits: 0.
- Final visual evidence was inspected at the 960x540 built-preview viewport. Retry/repair, Data recovery, and Close were unclipped; unavailable boards were not presented as an empty workspace.

## Final budgets

- Raw source: 299,703 / 300,000 bytes.
- Initial shell gzip: 25,940 unconfigured; 25,981 synthetic configured; cap 26,250.
- First-party lazy gzip: 58,795; cap 60,000.
- `src/cloud-workspace-ui.js`: 13,990 / 14,000 bytes.
- Maintainability warning above 210,000 bytes remains visible and is not a runtime failure.
- No source or gzip cap was increased.

## Intentional artifacts

- `blocked-boards.png`: synthetic failure state with unavailable-board copy and recovery controls.
- `recovered-boards.png`: synthetic repaired account with a persisted first board.
- `built-error-short-desktop.png`: final built failure dialog at 960x540.
- `preview-results.json`, `validation-summary.json`, and budget JSON files: redacted test and budget summaries.
- `qualify-preview.cjs`: repository-local configured build, browser, axe, and Lighthouse qualification runner.

Disposable Emulator logs, browser traces, preview logs, and generated test residue were removed before packaging.

## Production boundary and next gate

The specific production account remains unaccepted. Do not clear browser storage, rewrite profile/workspace documents, or request tokens, cookies, raw SDK logs, email addresses, workspace IDs, or document bodies through chat.

Before release, obtain separate authorization for the exact client and Rules revisions, then push/PR/merge and publish through the normal same-SHA gates. Follow with redacted signed-in acceptance using the affected account only if separately authorized. If the production account still fails after this candidate, capture only the short allowlisted startup code from `Flowboard cloud session failed.` and reproduce that condition synthetically before changing scope.
