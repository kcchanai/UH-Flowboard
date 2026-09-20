# Flowboard board-first copy simplification

## Candidate status

This is a locally qualified, synthetic-only candidate on branch `fix/board-first-copy-simplification`. It is ready for review and intentionally stops before deployment.

Visible navigation is now Account -> Boards -> board. The internal workspace model remains intact for Firestore authorization, memberships, invitations, board roles, lifecycle, backups, migration receipts, and recovery.

## Immutable identities

- Baseline main: `88477363bac20cea90b8bfe78f0fb5b53964c16e`
- Final implementation and test source: `a3bb3052c7491c87184b8319ccfd421bd03883f9`
- Evidence source SHA: `a3bb3052c7491c87184b8319ccfd421bd03883f9`
- Firestore Rules blob at candidate: `296b595276122918f521d3f86ee6820a5cc876b7`
- Firestore indexes blob at candidate: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`

The package commit that adds this evidence is intentionally separate from the implementation/test source SHA. No push, PR, merge, Pages deployment, Rules publication, index publication, production account, protected workspace, or production data access was performed.

## Delivered behavior

- Account no longer shows the redundant current-workspace block.
- Profile photo and sync explanations describe people who can access boards.
- Boards is the normal top-level destination.
- Personal rows omit repeated workspace and owner metadata while retaining position/state.
- Shared rows retain `Shared · editor` or `Shared · read-only` context.
- New board remains gated to the verified canonical personal destination.
- Data recovery remains a separate retained-data route.
- People, invitations, activity, assignment, realtime access, and archive/restore copy is board-centric without flattening authorization scope.
- Archived owner boards retain direct Restore and Delete permanently actions.
- Close controls remain pointer-accessible and focus returns to their opener.

## Final qualification

- `npm.cmd run validate`: passed, 43 unit tests, syntax/static/workflow checks, production build, source/output budgets, and 17-asset production isolation.
- `npm.cmd run test:rules`: passed, 46/46 Rules Emulator tests.
- Configured CI browser selection: passed, 10/10 tests, synthetic non-production Firebase web configuration.
- Packaged Emulator browser runner: passed, 20/20 tests under fresh Auth/Firestore emulators.
- Required-width board-first regression: passed, 1/1 test at 1440x900, 1900x700, 960x720, 390x720, and 320x720.
- Lighthouse accessibility: passed, score 1.0 with zero failed audits.
- Final visual capture: five fresh isolated system-Chrome contexts, HTTP 200, zero console errors, zero page errors, and no document-width overflow at 1440px or 320px.

Expected negative Rules probes print SDK denial diagnostics during the Rules run. The test process exited 0 and all 46 tests passed; no raw fixture payloads or credentials were retained.

## Budgets

- Configured and unconfigured raw source: 297,945 / 300,000 bytes, 2,055 bytes headroom.
- Configured initial shell gzip: 25,872 / 26,250 bytes.
- Configured first-party lazy gzip: 58,360 / 60,000 bytes.
- Configured document gzip: 5,342 bytes.
- Unconfigured initial shell gzip: 25,817 bytes.
- Unconfigured first-party lazy gzip: 58,360 bytes.
- Unconfigured document gzip: 5,339 bytes.
- No source or gzip cap was increased. The existing maintainability warning above 210,000 raw bytes remains explicit.

Machine-readable results are in `validation-summary.json`, `budget-configured.json`, `budget-unconfigured.json`, and `final/capture-report.json`.

## Remaining visible workspace terminology

These are intentional and are not normal board selection language:

1. **Owner-only lifecycle dialogs:** `Workspace name`, `Rename cloud workspace`, `Archive cloud workspace?`, `Archive workspace`, and related retained-workspace status. These operations change the authorization container and affect all boards, members, invitations, and retained descendants, so the scope must remain explicit.
2. **Data recovery retained-source metadata:** `Cloud workspace · owner · editable` can remain on a retained recovery source because it identifies the source type and access scope inside the separate recovery workflow. Normal Boards rows do not expose it.
3. **Technical configuration and migration diagnostics:** unavailable-adapter, legacy-import, migration, and lifecycle errors may say workspace when that is the precise internal boundary, for example `Cloud workspaces are not configured`, `legacy workspace`, or owner-only upgrade diagnostics. These are not workspace-choice navigation.
4. **Internal identifiers and compatibility hooks:** `workspaceId`, `personalWorkspaceId`, Firestore paths, adapter methods, Rules names, DOM IDs, and hidden compatibility nodes remain unchanged. Synthetic fixture names and backup payload field names also remain unchanged to prove compatibility.

## Review boundary

Review this branch and the evidence locally. The next actions requiring separate authorization are push/PR, merge and Pages deployment, Firestore Rules/index publication, and real-account acceptance. This package does not authorize any of them.
