# Step 5 customer UI graph detachment evidence

## Retired customer graph

- Removed `src/legacy-import-ui.js` from the customer runtime graph.
- Removed `src/workspace-lifecycle-ui.js` and its obsolete unit test after extracting the neutral confirmation module.
- Kept `src/adapters/firebase-migration.js`, `src/adapters/firebase-workspace-lifecycle.js`, local inspection/receipt methods, and Rules paths intact for protected historical maintenance.
- Board lifecycle now imports `src/confirmation-dialog-ui.js` directly.
- `scripts/source-budget.mjs` and `package.json` syntax/test manifests no longer include deleted UI modules.
- `scripts/validate-static.mjs` now enforces retired-selector absence, neutral confirmation, board safeguards, and protected maintenance exports.

## Validation

- `npm.cmd test`: **41/41 passed**, 0 failed.
- `npm.cmd run test:rules`: **46/46 passed**, 0 failed. Expected negative authorization diagnostics remained test output only.
- `npm.cmd run check`: passed static, syntax, source graph, performance, and workflow guards.
- Configured build budget:
  - raw source: **284179 / 300000** bytes;
  - headroom: **15821** bytes;
  - initial shell gzip: **25866 / 26250** bytes;
  - first-party lazy gzip: **55547 / 60000** bytes;
  - document gzip: **4989** bytes;
  - reachable production sources: **34**.
- Rules and indexes remain byte-identical to the baseline blobs.

## Boundary

The customer UI no longer imports or calls the removed recovery/lifecycle renderers. Protected adapter and Rules maintenance remains available for archived roots, interrupted/non-verified migrations, and legacy support until a separate production inventory authorizes backend decommission.
