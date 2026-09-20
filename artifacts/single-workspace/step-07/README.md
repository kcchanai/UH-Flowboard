# Step 7 of 10: Session, realtime, and recovery edge cases

## Delivered

- New board submission captures the current session UID and directory generation before any asynchronous personal-home fetch; late account changes cannot open or mutate the prior account's destination.
- Recovery lifecycle callbacks capture the directory generation; late restore/archive results cannot repaint a closed or replaced account context.
- Board lifecycle refreshes capture session/generation and discard late workspace reads after sign-out, account switch, or another context change.
- Existing command-level generation guards remain active for optimistic cloud mutations, verification-pending results, stale retries, role changes, access removal, and listener teardown.
- The Emulator hints fixture now uses a unique synthetic account per run, preventing persisted Auth/Firestore emulator state from changing a `created` bootstrap assertion into an `existing` pointer result.

## Verification

- `npm.cmd test`: **43 passed, 0 failed**.
- `npm.cmd run test:rules`: **41 passed, 0 failed**.
- `npm.cmd run test:emulator-browser`: **15 passed, 0 failed**.
  - Covers account switching, stale board-open race, late command context replacement, verification-pending state, stale retry, role downgrade, member removal, workspace archive/access loss, recovery, and the unique existing-hints bootstrap.
- `npm.cmd run check`: passed syntax, static, adapter-boundary, performance, and workflow guards.
- `git diff --check`: passed during checkpoint validation.

## Budget

| Mode | Raw source | Raw headroom | Initial shell gzip | First-party lazy gzip |
| --- | ---: | ---: | ---: | ---: |
| Unconfigured | 297,740 / 300,000 | 2,260 | 25,949 / 26,250 | 58,545 / 60,000 |
| Synthetic configured | 297,740 / 300,000 | 2,260 | 25,994 / 26,250 | 58,545 / 60,000 |

Per-file caps pass. The maintainability warning remains active at 210,000 bytes.

## Production boundary

No real account, normal browser profile, protected workspace, production document, migration, Rules publication, push, PR, merge, or deployment was used.
