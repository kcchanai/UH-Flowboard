# Flowboard MVP V2 progress

Plan: [`LUNA_TRELLO_STYLE_MVP_EXECUTION_PLAN.md`](LUNA_TRELLO_STYLE_MVP_EXECUTION_PLAN.md)
Execution branch: `luna/trello-style-mvp-v2`
Baseline SHA: `07859a752e56fd2f01a0b8ff62d1264e2096de93`
Production: unchanged. Step 14 is not authorized.

## Status

| Step | Title | Status | Checkpoint |
| --- | --- | --- | --- |
| 1 | Reconcile baseline and establish evidence | complete | `bd6ea6a8f03d11a22f7d94fff4cf4ea3a2a82494` |
| 2 | Create a maintainable, testable foundation | complete | `66b6c854d68087d887273d3204364396e7241811` |
| 3 | Implement the coherent visual system | complete | `edb969a1e3ff5f74f69572f875582941acdae6d3` |
| 4 | Make board and workspace navigation obvious | complete | `71fc682509b9b4b42fe3bdb4e526ee47fc66ed6b` |
| 5 | Finish practical board and list operations | complete | `aa2cec04f886e2d7b6b6868f1a4f3652021c46b2` |
| 6 | Fix card draft safety and redesign card details | complete | `07d4eaf95086aae36f7c8819ad2b6fa29d553122` |
| 7 | Make card capture and movement fast on every device | blocked | |
| 8 | Add meaningful completion, scheduling, and filters | not started | |
| 9 | Make existing collaboration understandable | not started | |
| 10 | Improve onboarding, truthful samples, and recovery | not started | |
| 11 | Complete mobile and accessibility qualification | not started | |
| 12 | Run full regression and repair release gating | not started | |
| 13 | Package and review the release candidate; stop at human gate | not started | |
| 14 | Authorized release and real-user acceptance | pending explicit approval | not authorized |

## Capability matrix

| Capability | Local source | Cloud source | Automated evidence | Production acceptance |
| --- | --- | --- | --- | --- |
| Multiple boards and templates | implemented | not applicable | existing tests | historical/deployed, recheck candidate |
| Lists and card CRUD | implemented | granular adapter | existing tests | historical/deployed, recheck candidate |
| Rich card details | implemented | granular adapter | existing tests | historical/deployed, recheck candidate |
| Card drag and Alt+Arrow movement | implemented | granular mutation | existing tests/Emulator | historical/deployed, recheck candidate |
| Card archive and local recovery | implemented | cloud archive/lifecycle | existing tests/Emulator | historical/deployed, recheck candidate |
| Import/export and CSV | implemented | cloud export | existing tests | historical/deployed, recheck candidate |
| Google sign-in and roles | local-safe UI | Firebase Auth and Rules | Rules/Emulator | real-account gate only |
| Realtime, conflicts, revocation | local-safe mode | memory-only listeners | Emulator browser | real-account gate only |
| Mobile board navigation | gap identified | role-aware behavior required | to add | not accepted |
| Explicit completion | gap identified | schema/Rules impact to audit | to add | not accepted |
| Safe card draft lifecycle | implemented | revision-aware adapter retained | 26 unit + 15 built-browser + 1 Emulator browser | real-account gate only |
| Combined named-label/member filters | partial | role-aware identity filter required | to add | not accepted |

## Baseline evidence

Evidence directory: `artifacts/mvp-v2/baseline/`

- `report.json`: local built-preview capture at `http://127.0.0.1:4191/UH-Flowboard/`.
- Screenshots: `desktop-light.png`, `desktop-dark.png`, `desktop-card.png`, `tablet-light.png`, `mobile-light.png`, and `narrow-light.png`.
- `scripts/capture-mvp-v2-evidence.cjs`: reproducible fresh-context capture utility.
- Data boundary: synthetic seeded local data only. No sign-in, cloud workspace, production fixture, raw storage, or credentials accessed.
- Capture result: HTTP 200, **0 console errors**, **0 page errors**. The board had 4 lists and 10 seeded cards. The baseline confirmed the board switcher is hidden at 390px and 320px; this is a Step 4 defect target.
- Existing validation result: `npm.cmd run validate` passed **24/24** unit tests, static guards, build, isolation, and **198,304 / 210,000** source bytes. `npm.cmd run test:rules` passed **23/23**. Packaged `npm.cmd run test:emulator-browser` passed **1/1**. Built-preview browser smoke passed **12/12**. Lighthouse accessibility passed with score **1** and zero failed audits.
- Rerun history: one initial browser attempt used the Vite development server and produced three expected hashed-asset import failures; the corrected built-preview run passed. One concurrent Edge context-start flake was isolated and the complete single-worker rerun passed. No application failure was carried forward.

## Step completion protocol

After each completed step, send a Discord update using the exact form:

```text
Step X of 14 complete: [title]
Delivered: [specific changes]
Verified: [actual test names/results and evidence paths]
Checkpoint: [commit SHA or explicitly uncommitted]
Production: unchanged
Next: Step X+1 of 14 - [title]
```

At the final authorized checkpoint report:

```text
Steps 1-13 of 14 complete. Step 14 awaits your approval.
```

## Step 6 checkpoint evidence

- Code checkpoint: `07d4eaf95086aae36f7c8819ad2b6fa29d553122`.
- Draft safety: labels, checklist, descriptions, dates, assignments, and title edits stay in an isolated draft until a confirmed Save; Close, Escape, Archive, Duplicate, and Delete use explicit discard confirmation when changed.
- Failed-save behavior: the browser test injects a storage-boundary failure and verifies the dialog and draft remain open without a false success.
- Validation: `npm.cmd run validate` passed 26/26 unit tests, static/runtime guards, production build, and asset isolation; `npm.cmd run test:rules` passed 23/23; the tracked Emulator browser workflow passed 1/1; built-preview browser smoke passed 15/15; Lighthouse accessibility scored 1.0 with zero failed audits; `git diff --check` passed.
- Budget: 209,631 / 210,000 raw bytes, 369 bytes headroom, 23 reachable production sources, zero unbudgeted sources.
- Evidence: `artifacts/mvp-v2/step-6/report.json`, six sanitized screenshots in the same directory, and `artifacts/mvp-v2/step-6-budget-measurement.json`.
- Rules and production: `firestore.rules` was unchanged; no Rules publication, deployment, real-account testing, protected-workspace access, or production fixture mutation occurred.

## Blockers and decisions

- Step 7 is blocked pending Aaron's explicit choice in `MVP_V2_BUDGET_TRANSITION_PROPOSAL.md`: keep the 210,000-byte cap and reduce/defer live scope, or approve a measured cap transition. The cap has not been changed.
- Step 7 behavior is validated but intentionally uncommitted: 27 unit tests pass; the focused Move/drop/capture/filter browser cases pass; the full built-preview suite passed 19/19; the fresh benchmark passed with zero console/page errors; the remaining failure is only the binding raw-source cap at 212,506 / 210,000.
- Step 7 evidence is in `artifacts/mvp-v2/step-7/`, with the current budget report at `artifacts/mvp-v2/step-7-budget-measurement.json` and benchmark at `artifacts/mvp-v2/step-7-benchmark.json`.
