# Step 1 of 10: Pin current release and reproduce failures

## Scope

Synthetic local/browser and Emulator preparation only. No authentication, production reads/writes, migration, protected workspace access, Rules publication, push, PR, merge, or deployment occurred.

## Baseline pin

- Implementation branch: `luna/single-workspace-board-ux`
- Baseline commit: `2e86332133b1387c484e17fcfefe56455c163153`
- Rules blob: `ab892fb38e3c371d533ffc59c739adf7a9300ffb`
- Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Node: `v22.23.0`
- npm: `10.9.8`
- Java: `21.0.12`
- Fresh origin/main was fetched before branch creation.

## Executed validation

- `npm.cmd run validate`: passed **43/43** unit/domain/adapter tests, syntax/static checks, production build, source budget, and asset isolation.
- `npm.cmd run test:rules`: passed **40/40** Firestore Rules tests. Emulator permission-denied and Rules expression-limit diagnostics were expected negative-case output; process exit was 0.
- `npm.cmd run test:emulator-browser`: passed **14/14** packaged Auth/Firestore Emulator browser tests.
- Built preview at owned strict port `4291`, unconfigured:
  - scrolling/Filters browser gate: **2/2 passed**;
  - configured-session test: failed with a 30-second wait because this preview was intentionally unconfigured. This is recorded as a baseline configuration mismatch, not treated as an application failure.
- Built preview at owned strict port `4292`, synthetic configured values:
  - configured-session and loaded-board accessibility: **2/2 passed**;
  - source contained only synthetic non-production configuration.
- `tests/single-workspace-board-ux.spec.mjs`: synthetic pre-fix reproduction **2/2 passed**.
- `git diff --check`: passed.

## Reproduction results

`tests/single-workspace-board-ux.spec.mjs` uses a synthetic owner and legacy-scope directory. It proves the current pre-fix behavior without a real account:

1. The board manager renders a cloud workspace scope in the recovery surface, shows an active board, and hides `#new-board-form` because no personal destination is identified.
2. An archived board row exposes a disabled `Archived` control and a `More` disclosure, with no direct `Restore` or `Delete permanently` buttons.

Screenshot: `baseline-workspace-rows.png`. It was inspected after capture and contains synthetic labels only.

## Budget observation

- Raw reachable source: **295,374 / 300,000 bytes**.
- Raw headroom: **4,626 bytes**.
- Maintainability warning threshold: **210,000 bytes**, intentionally exceeded.
- Unbudgeted reachable files: **0**.
- Existing configured-build observation: initial shell **26,114 gzip**, first-party lazy **57,982 gzip**. Final configured and unconfigured builds must be remeasured after implementation. No cap increase is authorized.

## Known baseline warning

Node emits the existing `MODULE_TYPELESS_PACKAGE_JSON` warning during the unit run. It did not fail validation and is not part of this feature scope.

## Acceptance

Step 1 reproduction and baseline pin are complete. The application has not been repaired in this checkpoint.
