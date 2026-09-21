# Flowboard board-row actions implementation progress

Plan: `FLOWBOARD_BOARD_ROW_ACTIONS_LUNA_PLAN.md`
Branch: `fix/board-row-actions`
Base SHA: `5a40a6376c028f8a35f5d8c0ae67d98b30b7a502`

## Authorization boundary

- Aaron explicitly authorized implementation of the attached plan.
- This work is local only. Stop before push, PR creation, merge, Pages deployment, Firestore Rules/index publication, real-account acceptance, or production data mutation.
- Existing untracked plans and evidence directories were present before this work and must remain untouched.

## Step checkpoints

| Step | Status | Verification |
|---|---|---|
| 1 | complete | `artifacts/board-row-actions-implementation/step-01-baseline.json`; baseline commands all passed |
| 2 | complete | `tests/board-row-actions.spec.mjs`; 1 safety pass and 3 expected baseline contract failures |
| 3 | complete | scoped source/CSS implementation; affected browser matrix `16/16`; budgets and immutable files pass |
| 4 | complete | responsive/media/role/a11y suites `8/8` plus confirmation/directory regressions `12/12` |
| 5 | complete | fresh Rules `46`; packaged Emulator `19 + 1 + 4`; cleanup and protected resources verified |
| 6 | complete | configured repository/browser gates pass; evidence captures `5/5`; local-only stop before push/deployment |

## Baseline identity

- Local branch before feature work: `main`.
- Local and `origin/main` matched at the base SHA above.
- `firestore.rules` blob: `296b595276122918f521d3f86ee6820a5cc876b7`.
- `firestore.indexes.json` blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`.
- Existing untracked plans/evidence were preserved; no blanket cleanup or reset is permitted.

## Environment inventory

- Node: `v22.23.0`
- npm: `10.9.8`
- Java: Temurin OpenJDK `21.0.12`
- Playwright: `1.55.0`
- Lighthouse: `12.8.2`
- Standalone `firebase` executable: unavailable; use the pinned `npx firebase-tools@15.25.1` path already used by the repository scripts.
- No production credentials, signed-in browser profile, or real account is used.

## Baseline command record

The following commands are run before source implementation:

- `npm.cmd run validate`
- `node scripts/validate-static.mjs`
- `node scripts/validate-workflow-gating.mjs`
- `git diff --check`

Record exact exit codes, counts, measured budgets, generated-artifact cleanup, and any pre-existing failures in the implementation evidence directory. The final implementation must rerun all affected gates from the final source.

## Change inventory

Expected production changes are limited to `src/board-lifecycle-ui.js` and scoped `styles.css` rules, with focused tests and CI selection wiring. Keep `src/confirmation-dialog-ui.js`, deletion/lifecycle adapters, `firestore.rules`, and `firestore.indexes.json` unchanged.
