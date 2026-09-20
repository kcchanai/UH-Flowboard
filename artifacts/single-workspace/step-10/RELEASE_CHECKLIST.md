# Future release checklist

This checklist is a handoff. It is not authorization to perform the following operations.

## Local candidate

- [x] Exact implementation commit recorded.
- [x] Exact Rules and index blobs recorded.
- [x] Unit, static, build, budget, Rules, Emulator, browser, and accessibility evidence recorded.
- [x] Synthetic screenshots inspected and hashed.
- [x] Worktree returned clean before packaging.

## Compatibility and server gate

- [ ] Re-run old-client/current-Rules and candidate-client/current-Rules compatibility in Emulator if Rules are changed again.
- [ ] Obtain separate authorization for any Rules/index publication.
- [ ] Publish only the exact source-controlled `firestore.rules` and `firestore.indexes.json`.
- [ ] Verify the active Rules release and index readiness through an authenticated operator route.

## Client release gate

- [ ] Obtain separate authorization for push, PR, merge, and Pages deployment.
- [ ] Push the exact reviewed branch under the intended GitHub account.
- [ ] Require checks on the exact PR head.
- [ ] Merge only after the exact head passes.
- [ ] Verify Pages deployment uses the merged full SHA and status is `built`.
- [ ] Run anonymous cache-busted live smoke and inspect console/page errors.

## Real-account acceptance gate

- [ ] Use newly created disposable production workspaces only.
- [ ] Test separate owner, editor, viewer, and non-member accounts.
- [ ] Verify direct Firestore reads/writes as well as UI boundaries.
- [ ] Exercise account bootstrap with existing hints and no pointer.
- [ ] Exercise board creation, archive, restore, permanent deletion, stale conflicts, revocation, and account switching.
- [ ] Do not use protected workspaces or administrator Console writes as Rules evidence.
- [ ] Do not send tokens, cookies, verbose logs, emails, UIDs, workspace IDs, or document bodies through chat.

## Migration gate

- [ ] Export approved legacy data before migration.
- [ ] Preview owner-approved destination and count/content equivalence.
- [ ] Migrate only explicitly approved data.
- [ ] Preserve original browser exports and a redacted verification report.

## Stop conditions

Stop on any Rules mismatch, missing index, unexpected account, protected fixture, failed backup, count difference, budget regression, stale-target ambiguity, or result that could imply partial deletion.
