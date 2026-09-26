# Current-feature regression coverage map

## Supported commands

| Command | Purpose | Included category |
|---|---|---|
| `npm run test:current` | Supported cloud-first regression gate. Prints exact pass/fail/skip counts and returns non-zero for any supported failure. | Synthetic controller, demo Firestore Rules Emulator, demo Auth/Firestore Emulator browser, synthetic production-controller browser |
| `npm run test:legacy-diagnostic` | Runnable diagnostic for the historical local-first `tests/browser-smoke.spec.mjs` fixture. It is **not** a supported current-feature gate and preserves its raw failure count. | Historical local-first diagnostic |

`test:current` uses only named current specs. It does not glob, suppress, or skip historical tests. It builds an **unconfigured** shell for the two unavailable/empty-workspace cases and verifies the production isolation guard there; it separately builds with synthetic public Firebase values for configured signed-out/controller cases. Its owned preview uses port 4203 (override with `FLOWBOARD_CURRENT_SUITE_PORT`) and the tracked fresh demo Emulator jobs. No production credentials, data, or account are used.

Both `audit-access-and-entry.spec.mjs` and `audit-visual.spec.mjs` are required in the supported suite. A missing file fails before the browser build rather than being silently omitted. The runner's disposable npm cache and temporary directory are under ignored `node_modules/.cache/flowboard-current-suite/`, inside the allowed repository.

## Historical classification

| Historical path | Status | Reason and disposition |
|---|---|---|
| `tests/browser-smoke.spec.mjs` | Diagnostic only | Mixed historical browser-local starter-board, recovery/import, retired-menu, and old copy fixtures. Run it explicitly with `npm run test:legacy-diagnostic`; modernize cases into named cloud-first fixtures before promoting any case. Do not delete it, restore retired UI, or mask its failures. |
| `tests/local-workspace-adapter.test.mjs` | Supported safety contract | Browser-local bytes and adapter behavior remain a protected legacy-data boundary, not proof of the current signed-in product. |
| `tests/local-storage-lifecycle-acceptance.test.mjs` | Supported safety contract | Preserves non-destructive local-storage/lifecycle behavior. |
| `tests/cloud-first-session.spec.mjs` | Supported current contract | Verifies unavailable/unconfigured behavior and an authentic empty cloud workspace; it does not re-enable local-first startup. |

## Control family to scenario map

The audit inventory counted 74 static controls plus runtime row/card/member/comment families. This table records representative supported scenarios, not a claim that every control/role/state combination is automated.

| Control family | Supported scenario(s) | Environment | Remaining boundary |
|---|---|---|---|
| Signed-out account entry and safe local-data boundary | `cloud-first-configured-session`, `cloud-first-session`, `audit-access-and-entry` when integrated | Synthetic production-controller browser | Complete Google OAuth/provider policy needs a real account acceptance pass. |
| Boards manager, create, archive, restore, permanent delete | `board-creation-confirmation`, `board-controls-simplification`, `board-row-actions`, Emulator lifecycle UI | Synthetic browser + demo Auth/Firestore Emulator | Real-account lifecycle mutation is manual and must not be automated against production. |
| Board selection/directory races and empty home | Emulator browser workspace/directory scenarios; `single-workspace-board-ux` | Demo Emulator + synthetic browser | Large real-account directories and network fault timing require manual acceptance. |
| Lists, list menu, list ordering | Existing model/controller tests; Emulator convergence scenarios; `audit-access-and-entry` when integrated | Synthetic controller + demo Emulator | Native touch/trackpad drag behavior and every filtered/reorder permutation are manual. |
| Cards, card details, comments, assignment and archive | `card-details-edges-comments`, card-details Emulator UI, deletion engine | Synthetic browser + demo Emulator | Clipboard/browser permission behavior and every comment/member combination remain manual. |
| Search, filters, board/list views, keyboard paths | Existing state/view-model tests; `audit-access-and-entry` when integrated | Synthetic controller/browser | Full filter Cartesian product and physical assistive-technology output remain manual. |
| Account, appearance, theme/canvas preferences | `ui-preferences`, selected current controller scenarios, `audit-visual` when integrated | Synthetic controller/browser | Actual provider photo failures, system settings, and screen-reader announcements are manual. |
| Members, invitations, ownership and role controls | Adapter/controller contracts, Rules tests, multi-user Emulator browser | Synthetic controller + demo Emulator | Pointer/keyboard invite acceptance, clipboard permissions, ownership transfer, leave-board, and provider-photo failure combinations need manual role acceptance. |
| Authorization, revocation, conflict, retry/repair and protected maintenance | Firestore Rules suite; packaged Emulator browser workflow | Demo Auth/Firestore Emulator | Production data/account repair is forbidden from automated coverage and remains owner-gated. |
| Focus, contrast, responsive header, forced colors/reduced motion | `audit-access-and-entry` and `audit-visual` once integrated | Synthetic production-controller browser | Native Safari/Firefox/iOS, physical coarse-pointer, and real screen-reader acceptance remain manual. |

## Required manual acceptance gates

Before calling a release fully accepted, record each applicable result separately from `test:current`:

1. **Real account, signed-in:** Complete Google sign-in with an approved non-production workspace; inspect account entry, Boards, create/open, and sign-out without collecting tokens, storage dumps, or production data.
2. **Role GUI:** Owner/editor/viewer clickthrough for invitation acceptance, role/ownership transfer, member removal/leave, clipboard denial, and provider-photo failure behavior.
3. **Real devices/browsers:** Native Chrome, Firefox, Safari/iOS and a physical touch/trackpad pass at the supported desktop and narrow layouts.
4. **Assistive technology:** Keyboard-only and a real screen-reader pass for dialogs, focus return, filters, status/error announcements, and control names.
5. **Visual/accessibility matrix:** Light/dark palette states, zoom/reflow, forced colors, reduced motion, and the narrow-header widths called out in the audit plan.
6. **Release boundary:** A signed-out deployed smoke test. Any production workspace lifecycle action needs explicit owner approval and its own evidence; it is not part of this suite.

## Count reporting contract

The runner reports each category and a total as `passed, failed, skipped`:

- **Synthetic:** controller/local-data safety and production-controller browser fixtures.
- **Demo Emulator:** Firestore Rules and Auth/Firestore browser workflows, each launched through their named existing runner against `demo-*` projects.
- **Historical:** only `test:legacy-diagnostic`, never folded into the supported-current total.

A missing optional audit spec is reported as integration state, not counted as skipped. Any test framework skip is included in its category and total. A non-zero child exit makes `test:current` fail even if its reporter cannot print a test count.
