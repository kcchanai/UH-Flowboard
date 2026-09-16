# Luna Execution Prompt - Complete Flowboard Source Headroom Recovery

You are Luna. Execute this prompt as an implementation task, not as a planning exercise.

## Repository and authority

Work only in:

```text
C:/Code/Stacie-Hermes/UH-Trello
```

Required branch:

```text
luna/flowboard-operational-v1
```

Planning checkpoint:

```text
9cf03a7cfe021ef6c13925a9140f227070c96acc
```

Production baseline that must remain unchanged:

```text
5a17747e3c9cb526a534659aff39f46f2fd35cbc
```

Read and follow these files before editing:

```text
LUNA_FULL_WORKFLOW_IMPLEMENTATION_PLAN.md
LUNA_SOURCE_HEADROOM_IMPLEMENTATION_PLAN.md
WORKFLOW_QUALIFICATION.md
LUNA_CONTINUATION_HANDOFF.md
TERRA_NEXT_PHASES_PLAN.md
.hermes.md
```

Aaron has authorized continuous non-production development through Development Phases 0-6. Do not ask for another phase approval. Stop before the Phase 7 Final Human Gate.

## Safety boundary

Do not:

- modify or merge `main`;
- push unless Aaron separately requests it;
- deploy GitHub Pages;
- publish Firestore Rules;
- access or mutate production Firebase data;
- use real Google accounts or browser profiles;
- open or mutate `My Flowboard workspace`;
- open or mutate `Lifecycle realtime probe`;
- enable persistent Firestore caching;
- add paid services, credentials, custom infrastructure, or machine-level changes;
- print raw `flowboard-workspace`, `flowboard-data`, credentials, emails, UIDs, workspace IDs, invitation links, tokens, cookies, or browser storage contents;
- raise the `210,000`-byte source cap;
- use unreadable source minification merely to pass the cap;
- remove or shorten safety, privacy, authorization, retention, or accessibility copy to save bytes.

Public Flowboard copy must contain no em dashes.

## Goal

Reduce measured production raw source from:

```text
204,095 / 210,000 bytes
```

to at most:

```text
200,000 / 210,000 bytes
```

while making the code and product boundary clearer.

Implement both coherent reductions below. Their combined dry-run estimate is approximately 6 KB, which should produce roughly 198 KB of measured source and more than 10 KB of headroom. Measure the real result.

## Phase A - remove the proven-dead legacy mutation adapter surface

Before editing, repeat repository-wide reference searches and confirm the dependency facts below. Do not rely only on this prompt if the branch has changed.

### Dependency facts at the planning checkpoint

- `app.js` calls `cloudAdapter.applyWorkspaceMutation(...)`.
- `tests/emulator/entry.mjs` calls `applyWorkspaceMutation(...)`.
- No production source, test, or script calls adapter method `applyMutation`.
- `applyCloudMutation` appears only in its implementation and the unused adapter facade.
- `inviteMember` and `exportRemoteWorkspace` appear only as obsolete contract method names.
- `createWorkspace` is an obsolete adapter contract name, but separate UI functions named `createWorkspace` are live. Do not delete or rename those UI functions.
- `CloudFeatureUnavailableError` exists only for the Firebase adapter fallback population loop.
- `CloudNotConfiguredError` remains required by `createUnavailableCloudAdapter`; do not remove that class from `adapter-contract.js`.

### Required edits

#### `src/adapters/firebase-cloud-workspace.js`

Remove the complete exported `applyCloudMutation` function. Keep `applyCloudWorkspaceMutation` unchanged.

#### `src/adapters/firebase-workspace-adapter.js`

1. Remove the `REMOTE_METHODS` import.
2. Remove `CloudFeatureUnavailableError`.
3. Remove the unused `applyMutation` facade.
4. Remove the fallback loop that populates missing adapter methods.
5. Return the explicit frozen adapter object only.
6. Keep every implemented authentication, workspace, lifecycle, activity, comment, invitation, membership, migration, upload, and `applyWorkspaceMutation` method unchanged.

#### `src/adapters/adapter-contract.js`

1. Remove obsolete contract method names:
   - `createWorkspace`
   - `applyMutation`
   - `inviteMember`
   - `exportRemoteWorkspace`
2. Keep `REMOTE_METHODS` for `createUnavailableCloudAdapter`.
3. Keep `CloudNotConfiguredError` and the unavailable adapter behavior.
4. Confirm every remaining contract method is either implemented by the Firebase adapter or intentionally returns `CloudNotConfiguredError` when Firebase is unavailable.
5. Add a parity test that compares the explicit configured-adapter method object with the unavailable-adapter `REMOTE_METHODS` surface, including `listActivity`.

### Focused validation after Phase A

Run:

```text
node --input-type=module --check < src/adapters/adapter-contract.js
node --input-type=module --check < src/adapters/firebase-workspace-adapter.js
node --input-type=module --check < src/adapters/firebase-cloud-workspace.js
npm test
npm run check
npm run test:rules
```

Confirm adapter static guards still pass. If a live caller of the deleted API appears, restore the deletion and report the exact caller instead of weakening tests.

## Phase B - retire the obsolete browser-local Collaboration planner

Flowboard now has real Firebase-authenticated owner/editor/viewer roles and Firestore Rules. The old browser-local `Collaboration plan` editor duplicates those concepts and can misleadingly imply authorization. Remove the complete planner as one coherent feature.

Preserve legacy `board.collaboration` fields in `state-core.js` normalization, migration, imports, exports, and persisted data. Do not change the schema or erase old metadata.

### `index.html`

1. Remove `#collaboration-button`.
2. Remove the complete `#collaboration-dialog` and `#collaboration-form`, including:
   - `#current-member`
   - `#collaboration-access`
   - planner close/cancel controls
3. Keep `#collaboration-summary` as the local/cloud mode summary.
4. Set its initial local text to:

```text
Browser-local workspace · editable
```

5. Do not change account, cloud migration, invitation, membership, lifecycle, activity, Recovery, import/export, or card dialogs.

### `app.js`

1. Remove `collaborationDraft` runtime state.
2. Remove:
   - `renderCollaborationDraft`
   - `showCollaboration`
   - `saveCollaboration`
3. Remove all listeners that target only the deleted planner trigger, form, or dialog.
4. Remove `cleanAccess` from the `FlowboardState` destructure if no live use remains.
5. Remove the local `currentMember()` runtime helper.
6. Browser-local mode must always be editable. Legacy planned viewer metadata is compatibility data, not authorization.
7. Preserve real cloud behavior exactly:
   - cloud owner/editor is editable;
   - cloud viewer is denied by the central mutation guard;
   - cloud-preview remains read-only.
8. Simplify the central denied-mutation message so it applies only to real cloud viewer access. Remove the obsolete message that tells a local user to switch roles in `Collaboration plan`.
9. Render local `#collaboration-summary` as:

```text
Browser-local workspace · editable
```

10. Keep the existing cloud owner/editor/viewer summary wording unchanged.
11. Do not change persistence, exact localStorage handling, Recovery, undo, import/export, rich cards, cloud transactions, revisions, conflict handling, archive/restore, or listener teardown.

### `styles.css`

1. Keep the shared summary styling.
2. Remove planner-only selectors:
   - `.collaboration-dialog .field + .field`
   - `.collaboration-dialog select`
3. Remove `.collaboration-dialog` from shared selector lists while preserving account and cloud-migration dialog styling.
4. Remove `.collaboration-summary[data-role="viewer"]` only after confirming real cloud viewer state remains explicit in visible text and does not rely on color.
5. Do not compact unrelated CSS.

### `state-core.js`

Do not remove:

- `makeCollaboration`
- `normalizeCollaboration`
- `cleanAccess`
- persisted `board.collaboration` data

These remain compatibility boundaries for old browser data and exports.

## Phase C - remove unused bootstrap payload

Repository-wide searches at the planning checkpoint show that `app.js` consumes only these `globalThis.FlowboardRuntime` properties:

```text
cloudStatus
localAdapter
cloudAdapter
```

### `src/main.js`

1. Remove the unused `CloudNotConfiguredError` import and bootstrap argument.
2. Stop passing `cloudConfig` to `bootstrapFlowboard`.
3. Keep `cloudConfig` in Firebase initialization exactly as required.
4. Keep `cloudConfigured` and `cloudInitializationError` bootstrap arguments because bootstrap control flow uses them.

### `src/runtime-bootstrap.js`

1. Remove `cloudConfig` and `CloudNotConfiguredError` from the function parameters.
2. Reduce the public runtime object to:

```text
{cloudStatus, localAdapter, cloudAdapter}
```

3. Keep `cloudConfigured` and `cloudInitializationError` as private control-flow inputs.
4. Keep local-only, configured-cloud, and Firebase-initialization-error behavior unchanged.

Add or update static validation so every `FlowboardRuntime.<property>` reference is present on the reduced runtime object.

## Required focused tests

Add or update deterministic tests proving:

1. Browser-local mode displays `Browser-local workspace · editable`.
2. No `Collaboration plan` trigger or dialog exists.
3. A legacy workspace whose collaboration metadata points to a planned viewer remains editable in browser-local mode.
4. Legacy collaboration metadata still normalizes and round-trips without loss.
5. Cloud-preview controls remain read-only while dialog close controls remain usable.
6. Emulator cloud owner/editor/viewer behavior is unchanged.
7. Adapter contract validation has no deleted method and no dangling facade.
8. No production bundle contains Emulator-only markers.

Do not rewrite existing tests merely to hide regressions.

## Source-budget gate

Run the repository validator and record the exact measured result:

```text
npm run check
```

Required result:

```text
production source <= 200,000 / 210,000 bytes
```

Do not commit if this threshold is not met. Do not raise the cap. Do not exclude live production files from measurement.

## Complete validation chain

After focused checks pass, run all of the following against fresh disposable local/Emulator state:

```text
npm test
npm run check
npm run build
npm run test:rules
npm run test:emulator-browser
git diff --check
```

Then serve the production build at the derived repository base path and run the production browser suite. Before the repository rename, use `FLOWBOARD_REPOSITORY_NAME=UH-Trello`; repeat with `FLOWBOARD_REPOSITORY_NAME=UH-Flowboard` for the future Pages path.

```text
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' npx playwright test tests/browser-smoke.spec.mjs --reporter=line
```

Run Lighthouse accessibility against the served production build:

```text
FLOWBOARD_REPOSITORY_NAME=UH-Trello npx lighthouse http://127.0.0.1:4173/UH-Trello/ --only-categories=accessibility --chrome-flags='--headless --no-sandbox' --output=json --output-path=lighthouse-report.json
FLOWBOARD_REPOSITORY_NAME=UH-Flowboard npx lighthouse http://127.0.0.1:4173/UH-Flowboard/ --only-categories=accessibility --chrome-flags='--headless --no-sandbox' --output=json --output-path=lighthouse-report.json
node scripts/assert-lighthouse.mjs
```

Required Lighthouse result:

```text
score 1, zero failed audits
```

Cleanly terminate preview/Emulator processes and remove generated artifacts such as:

```text
firestore-debug.log
lighthouse-report.json
test-results failure artifacts
```

Keep normal Playwright `.last-run.json` handling consistent with repository policy.

## Final review before commit

1. Inspect the entire diff.
2. Scan public HTML/CSS/JavaScript for em dashes.
3. Scan production source/build output for Emulator hosts, synthetic project IDs, test globals, seed controls, credentials, and sensitive identifiers.
4. Confirm `firestore.rules` is byte-identical unless an unrelated pre-existing difference is discovered. Do not change Rules for this task.
5. Confirm exact `flowboard-workspace` and `flowboard-data` string handling is unchanged without printing their contents.
6. Obtain an independent read-only review of:
   - adapter contract completeness;
   - local/cloud authorization boundaries;
   - legacy-data compatibility;
   - persistence and Recovery non-regression;
   - accessibility and focus behavior.
7. Resolve every serious review finding and rerun affected validation.

## Commit boundary

Commit only intended source, tests, and validation changes on `luna/flowboard-operational-v1`.

Suggested commit message:

```text
Retire obsolete collaboration planning paths
```

Do not push, merge, deploy, publish Rules, or mutate production.

## Required completion report

Report all of the following:

- exact starting and ending source bytes;
- exact raw-byte reduction and resulting headroom;
- changed files and removed obsolete APIs;
- focused test results;
- unit test count;
- Firestore Rules test count;
- production browser test count;
- Emulator browser test count;
- production build and asset-isolation result;
- Lighthouse score and failed-audit count;
- public-copy and credential/privacy scan result;
- independent-review outcome;
- confirmation that legacy collaboration metadata remains preserved;
- confirmation that browser-local mode remains editable;
- confirmation that real cloud role enforcement is unchanged;
- commit SHA;
- clean worktree status;
- confirmation that production, `main`, Rules, production data, protected workspaces, and real accounts were untouched.

If all gates pass, update the task tracker: mark source headroom complete, continue Development Phase 6 qualification, and stop only at the consolidated Phase 7 Final Human Gate.
