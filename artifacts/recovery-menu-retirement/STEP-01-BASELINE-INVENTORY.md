# Step 1 baseline and retirement inventory

## Pinned baseline

- Main SHA: `8d3a66750885cccb3b6a5ac3136ecc1b9e2c5f9e`
- Branch: `fix/remove-recovery-menus`
- Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
- Indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Raw source: `297945 / 300000` bytes
- Configured initial shell gzip: `25872 / 26250` bytes
- Configured first-party lazy gzip: `58360 / 60000` bytes
- Configured document gzip: `5342` bytes
- Configured CI browser selection: 10 tests

## Synthetic capture

Built preview: `http://127.0.0.1:4174/UH-Flowboard/`

- Browser: isolated anonymous system Chrome
- Boundary: synthetic adapter/directory data only; no real account, protected workspace, token, cookie, or production document
- Capture report: `artifacts/recovery-menu-retirement/baseline/capture-report.json`
- HTTP statuses: 5 x 200
- Console errors: 0
- Page errors: 0
- Document overflow: none at 1440x900 or 960x720

Captured and visually inspected:

- `account-signed-in-1440x900.png`: signed-in Account with Data recovery and Review legacy browser data.
- `boards-normal-1440x900.png`: ordinary Boards with active personal/shared rows, New board, and the Older data is available in Data recovery notice.
- `data-recovery-1440x900.png`: Data recovery with Older data rows, Open, Rename, Archive, and Download cloud backup.
- `legacy-recovery-1440x900.png`: Legacy Recovery with exact-backup safety copy, counts, Your boards destination, Download original backup, and Import boards.
- `setup-unavailable-960x720.png`: synthetic Boards unavailable gate with no recovery action in the direct unavailable state.

## Dependency inventory

### Data recovery route

- Account trigger: `#open-cloud-recovery`, rendered by `index.html` and visibility-controlled by `src/auth-ui.js`.
- Boards controller: `src/cloud-workspace-ui.js` binds the trigger to `openManager(recoveryButton, true)`.
- Recovery mode hides normal board/search/new-board regions and shows `#legacy-spaces-section` and `#legacy-spaces-list`.
- Recovery rows are rendered by `initializeLegacyImportUI(...).renderRecovery()`.
- Recovery rows expose workspace Open and owner lifecycle actions; selected-source actions expose backup and upgrade.
- Failure/setup fallback: `accountSetupActions()` dynamically creates a Data recovery button.
- Close returns focus to the normalized Account or Boards opener.

### Legacy Recovery route

- Account trigger: `#open-cloud-migration`, hidden until `localAdapter.inspectLegacyWorkspace()` finds valid legacy data.
- Controller: `src/legacy-import-ui.js`, initialized indirectly by `src/cloud-workspace-ui.js`.
- Dialog: `#cloud-migration-dialog`; controls include `#download-migration-backup`, `#create-cloud-workspace`, and `#close-cloud-migration`.
- Current safety sequence: inspect counts, download exact original backup, then call `cloudAdapter.importLegacyWorkspace()` and save a receipt.
- Close returns focus to the removed Account trigger and must be replaced with a Boards-owned or no-route decision.

### Shared dependencies that must survive

- `src/board-lifecycle-ui.js` imports generic `requestLifecycleConfirmation` from `src/workspace-lifecycle-ui.js`. Extract this generic confirmation before removing workspace-specific UI.
- Board archive, board restore, and Delete permanently actions must remain in normal Boards navigation.
- Manage members and View activity already have normal Boards-manager controls and must not depend on Data recovery.
- Board actions Local recovery is a separate browser-snapshot feature and is outside this retirement scope.
- `ensurePersonalWorkspace({recover:true})`, pointer Rules, migration/lifecycle Rules, and backend maintenance remain protected for historical states.

## Step 1 acceptance

Baseline identity, source/budget/Rules hashes, synthetic screenshots, visible dependency inventory, and cleanup boundary are recorded. No application source was changed in Step 1.
