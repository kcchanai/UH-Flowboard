# Flowboard board controls simplification progress

Plan: `FLOWBOARD_BOARD_CONTROLS_SIMPLIFICATION_LUNA_PLAN.md`

Boundary: local repository and synthetic/disposable Emulator validation only. No production data, real accounts, Rules/index publication, push, PR, merge, or deployment.

Baseline main: `7d6da43cb8fc8eaa4a603ab01be6849350b6fd85`
Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
Implementation branch: `fix/board-controls-simplification`

## Cadence

After each verified step, report:

`Step X of 9 complete: [what changed]. Verification: [actual command/result]. Boundary: local/synthetic only; not published. Continuing to Step Y of 9.`

## Steps

- [x] Step 1: Pin baseline, branch, ledger, prerequisites, and baseline qualification.
- [x] Step 2: Add focused failing contracts and record baseline failures.
- [x] Step 3: Remove duplicate New board shortcut.
- [x] Step 4: Replace Board actions with direct Archived cards.
- [x] Step 5: Widen Board access and owner forms through the real opening path.
- [x] Step 6: Qualify archive interaction and responsive accessibility.
- [x] Step 7: Prove fresh Emulator workflows.
- [ ] Step 8: Integrate CI and run final qualification.
- [ ] Step 9: Package evidence and stop before publication.

## Evidence ledger

| Step | Status | Evidence |
|---|---|---|
| 1 | complete | `artifacts/board-controls-simplification/baseline.json`; 41 unit tests, build, isolation, static/workflow gates, budget measurement; pre-existing CRLF per-file check recorded |
| 2 | complete | `tests/board-controls-simplification.spec.mjs`, `artifacts/board-controls-simplification/step-2-baseline.json`; 6 selected, 2 pass, 4 intended baseline failures |
| 3 | complete | `artifacts/board-controls-simplification/step-3.json`; lower form and creation regressions pass; three later-scope expected failures remain |
| 4 | complete | `artifacts/board-controls-simplification/step-4.json`; direct archive/browser smoke selection 8/8; static/workflow/budget gates pass |
| 5 | complete | `artifacts/board-controls-simplification/step-5.json`; real opening-path geometry 1440/960/680/390, viewer/no-mutation checks, lazy budget pass |
| 6 | complete | `artifacts/board-controls-simplification/step-6.json`; populated archive/viewer/responsive tests pass; configured coarse-pointer test pass |
| 7 | complete | `artifacts/board-controls-simplification/step-7.json`; packaged Emulator 19+4, Rules Emulator 46, Rules/index blobs unchanged |
| 8 | pending | |
| 9 | pending | |
