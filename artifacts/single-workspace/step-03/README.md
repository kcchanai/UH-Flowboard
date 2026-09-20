# Step 3 of 10: Automatic account-home setup

## Delivered

- `ensurePersonalWorkspace()` no longer treats existing `workspaceIds` hints as a workspace-selection requirement.
- An account without `personalWorkspaceId` now atomically creates one empty personal root, owner membership, and profile pointer while preserving existing hints and memberships.
- An existing pointer is verified with server reads. The target must be owner-owned, `personal == true`, `status == ready`, and migration `state == verified`.
- A broken, inaccessible, archived, transferred, or incompatible established pointer returns `needs-recovery`; it does not clear the pointer, adopt another scope, or create a replacement.
- The normal session gate no longer renders workspace selection. It uses an account-recovery state with truthful retry/recovery wording.
- Rules now require pointer targets to be personal, ready, verified owner scopes when a pointer is first assigned, and reject ordinary clearing, deletion, or replacement of an established nonempty pointer.
- Hints-only profile updates remain possible when the established pointer is unchanged.
- The Emulator harness has a real adapter case for an existing-hints account and uses an explicit recovery override only for the pre-seeded shared fixture.

## Verification

- `npm.cmd test`: **43 passed, 0 failed**.
- `npm.cmd run check`: passed syntax, static, adapter-boundary, performance, and workflow guards.
- `npm.cmd run test:rules`: **40 passed, 0 failed**.
  - New pointer tests cover forged replacement, null clearing, field deletion, preserved pointer on hints update, and existing hints creating a new personal scope.
- `npm.cmd run test:emulator-browser`: **15 passed, 0 failed**.
  - Includes real adapter coverage for existing workspace hints without a personal pointer.
  - Existing concurrent first-login, empty-home, legacy-preservation, role, conflict, revocation, and lifecycle coverage remained passing.
- `git diff --check`: passed before checkpoint.

## Budget history and final result

The first post-change unconfigured build measured first-party lazy gzip at **58,013 / 58,000**, a hard-cap failure. No cap was raised. Redundant recovery-status copy in the lazy auth UI was shortened while preserving the recovery meaning, then both modes were rebuilt.

Final Step 3 measurement in `budget.json`:

| Mode | Raw source | Raw headroom | Initial shell gzip | Lazy gzip |
| --- | ---: | ---: | ---: | ---: |
| Unconfigured | 294,968 / 300,000 | 5,032 | 25,949 / 26,250 | 57,995 / 58,000 |
| Synthetic configured | 294,968 / 300,000 | 5,032 | 25,994 / 26,250 | 57,995 / 58,000 |

The maintainability warning remains active at 210,000 bytes. No cap increase was made. Only 5 lazy gzip bytes remain.

## Production boundary

No real account, normal browser profile, protected workspace, production document, migration, Rules publication, push, PR, merge, or deployment was used. Rules changes are local candidate changes only.
