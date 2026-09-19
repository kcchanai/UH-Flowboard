# Future release and cutover checklist

No item below is authorized by the local-candidate instruction. Obtain a new explicit instruction before starting.

## Source and review

- [ ] Confirm the implementation and package commits from `MANIFEST.json` and `ATTESTATION.md`.
- [ ] Re-run the full validation matrix on the exact reviewed commit.
- [ ] Confirm Rules and index blobs match the manifest.
- [ ] Review the 6-byte configured-shell and 18-byte lazy headroom risk.

## Compatibility gate

- [ ] Emulator-test old client with new Rules.
- [ ] Emulator-test new client with old Rules.
- [ ] Decide and document the coordinated client/Rules cutover order.
- [ ] Prepare a tested maintenance/version gate if mixed versions cannot coexist safely.

## Rules and indexes

- [ ] Obtain separate authorization to publish Rules and indexes.
- [ ] Publish the exact source-controlled files, not edited fragments.
- [ ] Verify the active Rules revision and index readiness.
- [ ] Do not treat a Pages deployment as Rules publication.

## Client release

- [ ] Push the reviewed branch under the authorized GitHub account.
- [ ] Create a PR and require checks on the exact head SHA.
- [ ] Merge only after approval and green checks.
- [ ] Verify the Pages workflow and deployment object use the merged full SHA.
- [ ] Load a cache-busted live URL and inspect errors anonymously.

## Human production acceptance

- [ ] Use newly created disposable workspaces only.
- [ ] Test separate owner, editor, viewer, and non-member accounts.
- [ ] Verify direct Firestore authorization as well as hidden/disabled UI.
- [ ] Test archive/restore, deletion, revocation, conflicts, and cross-session convergence.
- [ ] Never use the protected workspace as a fixture.
- [ ] Never send tokens, cookies, verbose Firestore logs, or identifiers through chat.

## Migration

- [ ] Export approved real data before any migration.
- [ ] Run owner-reviewed preview and count verification.
- [ ] Migrate only explicitly approved data.
- [ ] Preserve original browser exports and record a redacted verification report.

## Stop conditions

Stop immediately on Rules mismatch, missing index, unexpected account, protected-workspace selection, failed backup, unexplained count difference, budget regression, or any result that could imply partial deletion.
