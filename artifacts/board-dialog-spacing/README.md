# Your boards and Archived cards spacing fix

This receipt records prepublication validation of the presentation-only change. Release state and live smoke must be verified separately. No Rules/index publication or production-data testing is part of this change.

- `#cloud-workspaces-status` now has balanced space below the status line as well as the existing intro spacing above it. The previous `.cloud-workspaces-dialog` selector did not match the actual `#workspace-dialog` element.
- Active board `Archive` now has direct separation from `Delete` inside its native `<details>` content. The `<details>` flex gap alone did not separate its two rendered action buttons. Archived board `Restore`/`Delete` vertical separation is also 12px.
- Archived card rows group `Restore` and `Delete` with a stable 12px gap and aligned actions for different title lengths. Only this row entry label changed from `Delete permanently` to `Delete`; the existing card deletion preflight, permanent confirmation, permissions, and deletion path are unchanged. Owner/viewer visibility was checked with synthetic fixtures.
- CSS rules for `.cloud-workspaces-dialog` and `.workspace-lifecycle-card` were removed only after verifying these classes have no production HTML/controller references. This leaves adequate headroom under the existing asset cap without relaxing it.
- Updated the affected synthetic browser regression and the Emulator lifecycle row selector. No production fixture, account, or browser profile was inspected.

## Verification

- Affected built-product browser specs: **18/18**, using isolated local production preview and synthetic fixtures. Status gaps, active/archived board action gaps, Archived cards action alignment and short label were measured at desktop and narrow viewports.
- Final `npm run validate`: exit **0**, 41/41 unit/static tests, build, static/workflow guards, budgets, and 18 production-isolation assets passed. Full output: `validate.log`.
- CI-shaped public-variable build and budget measurement: exit **0**, initial-shell gzip **26,174 / 26,250** bytes; source manifest **288,404 / 300,000** bytes; CSS **36,332 / 40,000** bytes. Public build variable values were not stored in evidence. Details: `configured-budget.json`.
- Final `npm run test:current`: exit **0**, **164 passed, 0 failed, 0 skipped**: 41 unit/static safety; 46 demo Rules; 24 demo Auth/Firestore Emulator browser; 2 unconfigured cloud-first browser; 51 configured synthetic-controller browser. Full output: `current-suite.log`.
- An earlier run timed out in the card-details Emulator test. A subsequent run exposed the stale Archived cards selector in the board-lifecycle test; its captured page showed the new `Delete` button, and that selector was corrected. The final full suite passed on the resulting source.
- `firestore.rules`, `firestore.indexes.json`, and `src/confirmation-dialog-ui.js` were not edited. Only suite-generated tracked screenshots were restored; pre-existing untracked plans and previous release evidence were preserved.
