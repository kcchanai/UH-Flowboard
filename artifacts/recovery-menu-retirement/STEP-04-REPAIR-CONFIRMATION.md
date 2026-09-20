# Step 4 account repair and board confirmation evidence

## Implementation

- Added `src/confirmation-dialog-ui.js` as the neutral native confirmation primitive.
- Rewired `src/board-lifecycle-ui.js` to the neutral confirmation module so board Archive, Restore, and Delete permanently retain typed/explicit confirmation, Escape, focus return, and error handling.
- Changed `accountSetupActions` to receive the actual opener and render only the relevant Retry or Repair action.
- Added explicit Repair account setup confirmation with copy explaining new empty destination creation, unchanged inaccessible data, and no import.
- Retained the existing `ensurePersonalWorkspace({recover:true})` path; no Rules or backend maintenance capabilities were removed.
- Registered the new confirmation module in the production source budget and syntax chain.

## Verification

- Full board-first spec: **7 passed**.
- Repair contract proves:
  - Repair is shown only in synthetic `needs-recovery` state;
  - Data recovery is absent;
  - confirmation copy names the new empty destination and no-import behavior;
  - Escape closes and returns focus to Repair;
  - explicit confirmation invokes the repair callback.
- Board Archive confirmation proves:
  - retained-content copy remains visible;
  - Escape cancels and returns focus;
  - explicit Archive confirmation remains available after recovery UI retirement.
- `npm.cmd run check`: passed, including static validation, source graph, workflow gating, and syntax for the new confirmation module.
- Configured build budget:
  - raw source: **294687 / 300000** bytes;
  - initial shell gzip: **25866 / 26250** bytes;
  - first-party lazy gzip: **55547 / 60000** bytes;
  - document gzip: **4989** bytes;
  - reachable production sources: **34**.

The old workspace-container lifecycle browser test is intentionally stale and will be replaced in Step 6 because its dialog is no longer an ordinary customer path. Rules/backend maintenance remains protected.
