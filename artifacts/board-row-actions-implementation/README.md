# Board-row actions implementation evidence

Plan: `../../FLOWBOARD_BOARD_ROW_ACTIONS_LUNA_PLAN.md`

## Final local result

- Branch: `fix/board-row-actions`
- Base SHA: `5a40a6376c028f8a35f5d8c0ae67d98b30b7a502`
- Final implementation commit is recorded after the local commit; no push or deployment was authorized.
- Rules blob remained `296b595276122918f521d3f86ee6820a5cc876b7`.
- Indexes blob remained `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`.
- No Rules/index publication, real-account acceptance, production Firestore access, or existing browser-profile access occurred.

## Final configured validation

Synthetic non-production public Firebase configuration was used to mirror CI. It was not a real project or account.

- `npm.cmd run validate`: exit `0`; unit tests `41/41`.
- `node scripts/validate-static.mjs`: exit `0`; 10 semantic/runtime guards.
- `node scripts/validate-workflow-gating.mjs`: exit `0`.
- `git diff --check`: exit `0`.
- Production asset isolation: `18` assets passed.
- Source: `285391 / 300000` bytes.
- `styles.css`: `34600 / 40000` bytes.
- Initial shell gzip: `25656 / 26250` bytes.
- First-party lazy gzip: `56788 / 60000` bytes.
- Document gzip: `4800` bytes.
- The existing maintainability warning threshold remains `210000`; it was not changed.

## Browser and accessibility selections

- New `tests/board-row-actions.spec.mjs`: `8/8` passed.
- Exact CI critical selection: `11/11` passed.
- Confirmation, board-controls, and card-details regressions: `22/22` passed.
- Focused planning-era affected selection: `16/16` passed.
- Lighthouse accessibility: score `1.0`, zero failed audits.
- Rules Emulator: `46/46` passed.
- Packaged Emulator browser runner: `19` multi-user/deletion, `1` card-details UI, `4` board-lifecycle UI, exit `0`.

The CI workflow now explicitly runs `tests/board-row-actions.spec.mjs`, and `scripts/validate-workflow-gating.mjs` requires that exact selection. Existing validation, Emulator, accessibility, and same-SHA Pages gates were retained.

## Final captures

`final-captures.json` records five fresh implemented-product captures made against the built preview using synthetic directory fixtures:

- `screenshots/final-desktop-light-active.png`
- `screenshots/final-desktop-dark-active.png`
- `screenshots/final-short-dark-archived.png`
- `screenshots/final-phone-light-archived.png`
- `screenshots/final-desktop-light-confirmation.png`

All five returned HTTP `200`, with zero console errors, page errors, and failed requests. The active captures show `Archive` and `Delete`; the short and phone archived captures show `Restore` above equal-width `Delete`; the confirmation capture retains `Delete permanently`, counts, the exact-name field, warning, and Cancel.

The planning-only DOM concept under `../board-row-actions-plan/` remains separate from these final captures and was not used as implementation evidence.

## Cleanup and boundary

- Owned preview ports `4175` and `4176` were stopped and verified closed.
- Auth/Firestore Emulator ports `8080`, `9099`, and `9150` were verified closed.
- Pre-existing tracked diagnostic screenshots touched by browser runs were restored.
- Disposable `firestore-debug.log` was removed.
- Existing untracked plans and evidence directories were preserved.
- This work stops before push, PR creation, merge, Pages deployment, Rules/index publication, and real-account acceptance.
