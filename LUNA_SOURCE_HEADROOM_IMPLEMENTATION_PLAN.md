# Luna Source Headroom Implementation Plan

Designed by Sol for Luna execution.

Executable implementation prompt: `LUNA_SOURCE_HEADROOM_EXECUTION_PROMPT.md`

## Objective

Reduce measured production raw source from `204,095 / 210,000` bytes to at most `200,000 / 210,000` bytes without changing the cap, minifying readable source, weakening authorization, shortening safety/accessibility copy, or changing persisted workspace/export shapes.

Development branch: `luna/flowboard-operational-v1`

Planning baseline: `f55998f9438ba3c5d4a013a3345e26d9a10bdb41`

Production baseline remains `5a17747e3c9cb526a534659aff39f46f2fd35cbc`. Do not modify production resources.

## Chosen solution

Retire the obsolete browser-local `Collaboration plan` editor and fake local role preview.

Flowboard now has real Firebase-authenticated owner/editor/viewer roles with Rules enforcement. The older local planner duplicates those concepts and can misleadingly make a browser-local board appear authorization-protected. Removing that UI is a product clarification and a maintainability improvement, not feature compaction.

Preserve legacy `board.collaboration` fields in `state-core.js` normalization, imports, exports, and stored data. They remain compatibility metadata. Do not delete or migrate those fields in this change.

## Measured reduction

The following directly removable planner code totals approximately `3,614` raw bytes:

- `app.js` planner render/open/save functions: about `1,175` bytes.
- `app.js` planner dialog listeners: about `540` bytes.
- `index.html` planner trigger: about `201` bytes.
- `index.html` planner dialog: about `1,374` bytes.
- Planner-only CSS selectors: about `324` bytes.

The remaining reduction comes from removing fake local-role runtime behavior:

- remove `collaborationDraft` state;
- remove the local `currentMember()` runtime helper;
- stop deriving local mutation permission from legacy planned roles;
- simplify the local summary to honest browser-local wording;
- remove the planner-only viewer badge rule and unused selector prefixes;
- remove `cleanAccess` from the `app.js` State destructure after its last UI use disappears.

A final dead-runtime cleanup provides margin:

- remove `CloudNotConfiguredError` from the `src/main.js` import and bootstrap call because no application consumer references it;
- stop passing `cloudConfig` into `bootstrapFlowboard` because bootstrap does not use it after runtime-object cleanup;
- expose only `cloudStatus`, `localAdapter`, and `cloudAdapter` on `globalThis.FlowboardRuntime`, which are the only properties referenced by `app.js`;
- retain `cloudConfigured` and `cloudInitializationError` as private bootstrap inputs because bootstrap control flow still uses them.

Dry-run predicted total reduction: approximately `4,210` bytes, resulting in approximately `199,885 / 210,000` bytes. Required reduction: `4,095` bytes. Luna must measure the result rather than relying on the estimate.

## Exact implementation boundary

### `index.html`

1. Remove `#collaboration-button` and its `Collaboration plan` label.
2. Remove the complete `#collaboration-dialog` form, including `#collaboration-form`, `#current-member`, `#collaboration-access`, and its close/cancel controls.
3. Keep `#collaboration-summary`, because it remains the compact local/cloud mode summary.
4. Set its initial local text to `Browser-local workspace · editable`.
5. Do not change cloud account, invitation, member, lifecycle, activity, Recovery, import/export, or card dialogs.

### `app.js`

1. Remove `collaborationDraft` from runtime state.
2. Remove `renderCollaborationDraft`, `showCollaboration`, and `saveCollaboration`.
3. Remove all listeners whose only targets are the deleted planner trigger/form/dialog.
4. Remove `cleanAccess` from the `FlowboardState` destructure if no live use remains.
5. Remove the local `currentMember()` helper from authorization and rendering.
6. Keep cloud authorization behavior unchanged:
   - `cloud` owner/editor remains editable;
   - `cloud` viewer remains denied by the central mutation guard;
   - `cloud-preview` remains read-only.
7. Treat browser-local mode as editable. Legacy planned viewer metadata must not impersonate authorization.
8. In `render()`, keep cloud role summaries unchanged. Render local mode as `Browser-local workspace · editable` and use a neutral local role data value only if styling still requires one.
9. Replace the obsolete local-denial explanation mentioning `Collaboration plan` with no new branch. The denial path should now apply only to real cloud viewer access.
10. Do not change local persistence, Recovery, undo, import/export, card behavior, cloud mutations, revisions, or conflict handling.

### `styles.css`

1. Keep the shared `.collaboration-summary` visual treatment, or rename it only if every reference and test is updated coherently.
2. Remove `.collaboration-summary[data-role="viewer"]` if local fake viewer styling is its only remaining purpose. Confirm real cloud viewer summary remains understandable without color-only meaning.
3. Remove `.collaboration-dialog .field + .field` and `.collaboration-dialog select`.
4. Remove `.collaboration-dialog` from shared selector lists while preserving `.account-dialog` and `.cloud-migration-dialog` behavior.
5. Do not compact unrelated CSS.

### `state-core.js`

Do not remove collaboration normalization or schema fields in this checkpoint. Keeping them makes old local exports and persisted workspaces forward-compatible and prevents a data-shape migration from being hidden inside a source-budget change.

### `src/main.js` and `src/runtime-bootstrap.js`

1. Remove the unused `CloudNotConfiguredError` import, bootstrap argument, and runtime-object property.
2. Remove `cloudConfig` from the `bootstrapFlowboard` call and parameter list. Keep its use in `src/main.js` Firebase initialization unchanged.
3. Reduce `globalThis.FlowboardRuntime` to `{cloudStatus, localAdapter, cloudAdapter}`.
4. Keep `cloudConfigured` and `cloudInitializationError` as bootstrap parameters and control-flow inputs, but do not expose them globally.
5. Add or retain a static assertion that `app.js` references only properties present on the reduced runtime object.

## Focused tests to add or update

1. Browser-local mode shows `Browser-local workspace · editable`.
2. No `Collaboration plan` trigger or dialog exists.
3. A legacy normalized board whose `currentMemberId` points to a planned viewer remains locally editable through the UI. This proves fake local planning no longer acts as authorization.
4. Cloud-preview controls remain read-only and dialog close controls remain usable.
5. Cloud owner/editor/viewer behavior in the Emulator workflow remains unchanged.
6. Existing state-core tests continue proving legacy collaboration metadata normalizes and round-trips without loss.
7. Static validation fails if deleted planner IDs are reintroduced into `app.js` without matching markup, or if dangling planner listeners remain.

## Required execution sequence

1. Confirm branch and clean worktree at `f55998f` or its direct descendant.
2. Record `npm run check` source usage before editing.
3. Add focused browser/static regression assertions first.
4. Remove only the planner/runtime paths listed above.
5. Run syntax and focused browser checks.
6. Run the complete chain:

```text
npm test
npm run check
npm run build
npm run test:rules
npm run test:emulator-browser
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' npx playwright test tests/browser-smoke.spec.mjs --reporter=line
npx lighthouse http://127.0.0.1:4173/UH-Trello/ --only-categories=accessibility --chrome-flags='--headless --no-sandbox' --output=json --output-path=lighthouse-report.json
node scripts/assert-lighthouse.mjs
git diff --check
```

7. Remove generated Emulator/Lighthouse artifacts.
8. Scan public HTML/CSS/JavaScript for em dashes.
9. Inspect the complete diff and obtain independent review for local/cloud mode, persistence, and accessibility boundaries.
10. Commit only after measured source usage is at most `200,000 / 210,000` bytes and all gates pass.

## Stop and rollback conditions

Rollback this reduction if any of the following occurs:

- legacy workspace normalization or export shape changes;
- browser-local mutations become blocked;
- cloud viewer mutations become allowed;
- cloud owner/editor controls disappear;
- Recovery or localStorage behavior changes;
- a deleted planner selector/listener remains dangling;
- accessibility score or browser focus behavior regresses;
- measured source remains above `200,000` bytes after the complete coherent removal.

If the coherent removal saves less than required, do not minify source or raise the cap. Report the exact remaining byte gap to Sol for a second semantic-removal plan.

## Completion result Luna must report

- exact before/after source bytes;
- exact test counts;
- build and production-isolation result;
- Lighthouse score and failed-audit count;
- confirmation that legacy collaboration metadata remains preserved;
- confirmation that local mode is honestly editable and real cloud role enforcement is unchanged;
- commit SHA;
- confirmation that production was not changed.
