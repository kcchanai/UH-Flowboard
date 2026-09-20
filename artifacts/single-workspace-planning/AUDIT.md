# Single-workspace / board-only UX planning audit

Status: planning evidence, not a repaired or qualified application.
Date: 2026-09-19 HST.

## Sources inspected

- Aaron's two supplied screenshots were visually inspected. They show an authenticated workspace-choice gate, no visible creation action, and a Your boards dialog combining an empty board list with legacy workspace rows. The screenshots are private user evidence; they were not copied into this package.
- Source: app.js, index.html, runtime-bootstrap, auth, cloud-workspace UI/adapter, board/workspace lifecycle controllers, personal-workspace Rules tests, selected Rules helpers, package scripts, local CI workflow, and packaged Emulator browser runner.
- Current cloud-first progress ledger and candidate cutover checklist were read for context. Their historical counts and statuses are not new verification.
- The remote-main CI workflow was independently read through the GitHub contents API at the pinned main SHA. It uses the same `cloud-first board|Filters stays bounded` browser filter and explicitly runs only `tests/emulator/emulator-browser.spec.mjs` for its Emulator browser step. New regressions must be explicitly included rather than assuming a green workflow selects them.

## Exact baseline observations

- Local branch: release-final. HEAD: d9d8a47ec9491c354047b09b615f6ee31031c878.
- Worktree was clean before planning artifacts were written.
- Fresh GitHub main: 2e86332133b1387c484e17fcfefe56455c163153.
- GitHub compare reports divergent commit history with file differences in .github/workflows/validate.yml and tests/emulator/emulator-browser.spec.mjs. Application source was not listed among those differences.
- Pages endpoint reports built at https://kcchanai.github.io/UH-Flowboard/.
- Local Rules blob: ab892fb38e3c371d533ffc59c739adf7a9300ffb.
- Local indexes blob: 79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a.

## Confirmed source causes

1. ensurePersonalWorkspace returns needs-selection for any existing hints without a pointer. It does not distinguish stale/shared references from eligible personal roots.
2. activateSession displays that selection demand, but the board directory does not implement a corresponding personal-workspace selection completion flow.
3. New board form visibility depends on a ready verified personal-marked directory entry; the creation destination is chosen by a first-match heuristic rather than the authoritative profile pointer.
4. Recovery renders all directory workspaces, including active ones. This maintains the unwanted workspace-facing model.
5. Board queries skip archived/unverified roots and require lifecycle metadata. Failed reads can yield empty board arrays marked unavailable; the UI needs explicit partial/error classification rather than an unconditional synchronized/empty message.
6. Archived board rows use a disabled Archived button plus More actions. The requested two direct actions are not the current presentation.
7. The personal-workspace test suite intentionally locks in selection for existing hints. Update its product expectation without weakening preservation or negative authorization tests.

These findings explain a code path consistent with the screenshots. They do not establish the contents or failure cause of any particular production workspace.

## Browser audit actually run

Command:

```text
node artifacts/single-workspace-planning/audit-live.cjs
```

Outcome: exit 0. Fresh anonymous Playwright context, repository-local temporary browser files, no login or production mutation.

- HTTP 200.
- Viewport: 1440x900; document width: 1440.
- Heading: Sign in to access your boards.
- Status: Sign in required.
- Boards navigation visible and disabled for the anonymous user.
- New board form not visible in the anonymous state; this is not a defect by itself.
- Captured console errors: 0; page errors: 0. Listeners were registered before navigation.
- Screenshot: live-anonymous.png, visually inspected. It proves only the anonymous gate.
- Scratch browser directory was removed in the audit's finally block.

Machine-readable result: live-audit.json.

## Budget observation actually run

Command:

```text
node scripts/measure-mvp-v2-budgets.mjs
```

Outcome: exit 0; maintainability warning emitted. Snapshot: budget-observation.json.

- Source: 295,374 / 300,000 bytes; headroom 4,626; warning threshold 210,000.
- No unbudgeted reachable files.
- Existing dist: initial shell 26,150 gzip; lazy 57,982 gzip; document 5,385 gzip; vendor 139,809 gzip.
- This task did NOT rebuild dist. Do not use these artifact measurements as a fresh configured-build acceptance result.
- Raw, per-file, configured/unconfigured shell, and lazy budgets must be requalified in implementation.

## Not performed

- No application, test, Rules, index, or CI changes.
- No source commits, pushes, PRs, branch switches, merges, or deployments.
- No authentication, real-account or protected-workspace access, Firebase API publication/readback, or production data migration.
- No fresh unit, Rules, Emulator, Lighthouse, or authenticated browser qualification.
- No claim that the active Rules revision or index readiness was independently verified by this audit.

## Follow-up planning review

A read-only delegated review agreed with canonical-pointer authority, automatic atomic creation when the pointer is absent despite existing hints, preserved legacy/shared ACLs, and two direct archived-board actions. Its late summary recommended stricter handling of an already-established pointer.

The parent independently checked `firestore.rules` functions `validPersonalWorkspacePointer` and `validUserProfileUpdate`: current source permits empty/null/absent pointers and does not enforce established-pointer immutability. The plan now explicitly requires negative Rules tests and narrow guards against ordinary pointer clearing/replacement. Broken or incompatible established pointers retain an actionable recovery state rather than silently provisioning a replacement. Any replacement-pointer repair is a separate design/approval boundary.

This is a planning revision only. No application or Rules change was made, and the review is not production authorization proof.

## Planning conclusion

Use one automatic canonical account home and a board-only directory. Preserve historical/shared authorization containers internally. Restore New board as a visible action backed by canonical setup and reliable cloud acknowledgement. Present two direct owner actions for archived boards. Move special legacy recovery out of ordinary board navigation, without deleting its capabilities.

Plan: [[FLOWBOARD_SINGLE_WORKSPACE_BOARD_UX_PLAN]].
