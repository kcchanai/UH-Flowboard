# Flowboard visual cleanup local release candidate

Status: **verified local release candidate**

This package contains the completed ten-step visual cleanup pass for Flowboard. It is local-only. It has not been pushed, merged, deployed, or accepted against real accounts.

## Identity

- Branch: `luna/visual-cleanup`
- Implementation source commit: `c7f21fab9a5bac553d42bc610c250fabee3a4535`
- Qualification evidence commit before packaging: `10cf6e155bb5557a6d9cabb48f9fa3b89c153cfb`
- Base production main: `a9d2ff46add71aa246da468ff2e343cce47dd276`
- Rules source blob: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`
- Rules source unchanged by this cleanup.

## Product work included

- Shared control, select, focus, dialog scroll, and action-group foundations.
- Board header and Start here alignment at office and narrow widths.
- Account section rhythm, profile/workspace hierarchy, photo-action separation, and footer grouping.
- Cloud chooser row identity/action separation, long-name wrapping, archived identity, Restore, and footer grouping.
- Members, invitations, role controls, ownership transfer, profile sharing, and responsive narrow layouts.
- Board/List/card-editor rhythm refinements.
- Quick Add optional-action spacing and Appearance palette tile text layout.
- Explicit audit disposition for all remaining dialogs, menus, confirmations, status, loading, and error surfaces.

## Final qualification

- Unit tests: **37/37**.
- Firestore Rules Emulator: **24/24**.
- Tracked Emulator-browser workflow: **1/1**.
- Unconfigured built-preview browser smoke: **59/59**.
- Synthetic configured built-preview browser smoke: **59/59**.
- Lighthouse accessibility: **score 1 with zero failed audits**.
- Production asset isolation: **31/31**.
- Visual matrix: **11 captures**, zero console errors, zero page errors, zero page-level overflow.
- Production-markup synthetic cloud/access audit: six captures, zero console/page errors, zero chooser/member/account overflow in final evidence.
- Performance: three samples at 1,000 cards, render median **563.8 ms**, navigation median **582 ms**, filter median **48.6 ms**.

## Final budgets

- Raw source: **272,807 / 300,000 bytes**.
- Unconfigured initial shell: **26,100 / 26,250 gzip bytes**.
- Configured initial shell: **26,166 / 26,250 gzip bytes**.
- First-party lazy graph: **57,940 / 58,000 gzip bytes**.
- Document gzip: **6,004 bytes**.
- `index.html`: **26,777 / 27,250 bytes**.
- `src/members-ui.js`: **11,993 / 12,000 bytes**.
- `src/cloud-workspace-ui.js`: **12,971 / 13,000 bytes**.

The shell and lazy graph have intentionally small remaining headroom. Do not add further UI code without remeasuring both unconfigured and synthetic configured builds.

## Evidence map

- Step 1 through Step 9 results: `artifacts/visual-cleanup/step-01/` through `step-09/`.
- Visual screenshot index: `SCREENSHOT_INDEX.md` in this directory.
- Remaining surface disposition: `../step-08/SURFACE_INVENTORY.md`.
- Planning audit and concept: `../../visual-cleanup-planning/`.
- Ten-step ledger: `../../FLOWBOARD_VISUAL_CLEANUP_PROGRESS.md`.
- Detailed plan: `../../FLOWBOARD_VISUAL_CLEANUP_PLAN.md`.

## Reproduction commands

From `C:/Code/Stacie-Hermes/UH-Trello`:

```text
npm.cmd run validate
npm.cmd run test:rules
PLAYWRIGHT_EXECUTABLE_PATH="C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" npm.cmd run test:emulator-browser
npm.cmd run build
npm.cmd run measure:mvp-v2
```

Browser and Lighthouse tools are test-only ephemeral dependencies. They are not production dependencies and were removed after qualification.

## Release boundary

This handoff stops before:

- Push or remote branch publication
- Pull request creation
- Merge or Pages deployment
- Firestore Rules publication
- Google sign-in with a real account
- Real workspace, invitation, member, profile, ownership, archive, restore, migration, or cloud mutation

Production release requires a new explicit authorization and a separate real-account acceptance gate. The protected workspace and lifecycle fixture were not accessed or mutated.
