# Flowboard single-workspace / board-only implementation progress

Plan: [[FLOWBOARD_SINGLE_WORKSPACE_BOARD_UX_PLAN]]
Implementation branch: `luna/single-workspace-board-ux`
Baseline: `2e86332133b1387c484e17fcfefe56455c163153`
Rules blob at baseline: `ab892fb38e3c371d533ffc59c739adf7a9300ffb`
Indexes blob at baseline: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
Production: unchanged. No push, PR, merge, deployment, Rules publication, migration, real-account testing, or protected-workspace access is authorized by this implementation request.

## Status

| Step | Title | Status | Checkpoint | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Pin current release and reproduce failures | complete | pending commit | `artifacts/single-workspace/step-01/` |
| 2 | Lock account-home contract and budget | in_progress | pending | `artifacts/single-workspace/step-02/` |
| 3 | Implement automatic account-home setup | not_started | pending | `artifacts/single-workspace/step-03/` |
| 4 | Board-only discovery and secondary recovery | not_started | pending | `artifacts/single-workspace/step-04/` |
| 5 | Visible, reliable New board | not_started | pending | `artifacts/single-workspace/step-05/` |
| 6 | Archived-board Restore and Delete permanently | not_started | pending | `artifacts/single-workspace/step-06/` |
| 7 | Session, realtime, and recovery edge cases | not_started | pending | `artifacts/single-workspace/step-07/` |
| 8 | Onboarding, copy, accessibility, and layout | not_started | pending | `artifacts/single-workspace/step-08/` |
| 9 | Full qualification and CI coverage | not_started | pending | `artifacts/single-workspace/step-09/` |
| 10 | Local release candidate package | not_started | pending | `artifacts/single-workspace/step-10/` |

## Step protocol

Only one step may be `in_progress`. Commit only intended files after that step's acceptance checks pass. Each checkpoint records actual commands, counts, budget values, evidence paths, full commit SHA, worktree status, and the production boundary. Historical release results are not reused as final evidence.

## Step 1 baseline record

- Current branch was created from freshly fetched `origin/main` at `2e86332133b1387c484e17fcfefe56455c163153`.
- Planning files and planning audit were preserved as untracked implementation inputs.
- Installed prerequisites observed: Node `v22.23.0`, npm `10.9.8`, Java `21.0.12`.
- Baseline commands and isolated synthetic reproductions remain to be run before any application repair.
- The anonymous planning audit is historical context only; it is not Step 1 acceptance.
