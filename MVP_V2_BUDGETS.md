# Flowboard MVP V2 budgets

Status: Step 2 baseline and foundation measurement. This is a source-maintainability guard, not a network-transfer or backend-quota claim.

## Measurement scope

Measured production source files are the exact 23 files listed in `scripts/source-budget.mjs`. The import-graph audit starts from `index.html`, `styles.css`, and `src/main.js`, follows relative static and dynamic module imports, and requires every reachable first-party HTML/CSS/JS/MJS source to be in the budget manifest.

The guard excludes tests, Markdown, scripts, `node_modules`, generated `dist/`, screenshots, and reports from the raw source total. Generated build output is measured separately below. Splitting a source file does not create aggregate headroom.

## Current source measurement

| Metric | Result |
| --- | ---: |
| Reachable first-party source files | 23 |
| Budgeted source files | 23 |
| Unbudgeted reachable source files | 0 |
| Raw source bytes | 200,729 |
| Existing hard cap | 210,000 |
| Remaining raw headroom | 9,271 bytes |
| Per-file limit violations | 0 |

The cap remains unchanged. The next feature steps must preserve readable safety, authorization, and accessibility copy. If the required feature set cannot fit through semantic consolidation and measured removal of obsolete paths, pause before changing the cap and present an evidence-based transition proposal.

## Built output measurement

Measured after `npm.cmd run build` from the candidate source. Raw and gzip values below are build artifacts and are not added to the raw source total.

| Category | Files | Raw bytes | Gzip bytes |
| --- | ---: | ---: | ---: |
| Initial shell | 3 | 69,598 | 20,499 |
| First-party lazy | 16 | 154,095 | 48,802 |
| Vendor | 2 | 477,895 | 139,736 |

The vendor category is reported separately because the Firebase SDK dominates it and is not evidence that first-party UI additions have the same transfer cost. No vendor dependency was added for this step.

Full machine-readable result: `artifacts/mvp-v2/step-2-budget-measurement.json`.

## Synthetic browser benchmark

Fixture: 10 lists and 200 cards, local-only, fresh isolated browser context, 1440x900 viewport, installed Edge executable. No sign-in, cloud workspace, production fixture, raw storage, or credential access.

| Metric | Result | Interpretation |
| --- | ---: | --- |
| In-page usable board render | 608.2 ms | One local baseline sample, not a p95 claim |
| Browser navigation to usable board | 633 ms | Includes local preview navigation |
| Single-term filter response | 43.7 ms | One local baseline sample; 1 matching card remained |
| Console errors | 0 | Pass |
| Page errors | 0 | Pass |

Full result: `artifacts/mvp-v2/step-2/benchmark.json`.

The Step 12 lab targets are provisional: typical-fixture usable render at or below 1 second and p95 filter response at or below 200 ms on the recorded test machine. Stress fixtures and repeated samples are required before calling those targets passed.

## Provisional implementation allocation

The 9,271 bytes of remaining raw headroom are a constraint, not a feature budget guarantee. Re-measure after every top-level step.

- Steps 3-5: prioritize replacement of existing markup/CSS and removal of misleading controls; provisional net allowance 2,500 bytes.
- Steps 6-7: reuse the Step 2 commands and existing dialog shell; provisional net allowance 2,500 bytes.
- Steps 8-10: add only fields and filters that replace or consolidate existing behavior; provisional net allowance 2,500 bytes.
- Steps 11-13: reserve at least 1,000 bytes for accessibility, release evidence, and CI guards.
- Unallocated safety reserve: 771 bytes.

This allocation is intentionally conservative. It does not authorize code golf, deletion of safety wording, weakening Rules, or silently raising the cap. A budget transition proposal is required if the plan cannot fit while preserving the stated acceptance criteria.

## Step 5 remeasurement

After the list-menu, title-validation, and list-reorder implementation, the exact source total is **209,611 / 210,000 bytes**, leaving **389 bytes**. All 23 reachable production files remain represented in the manifest. The remaining feature steps must first recover semantic headroom through replacement or removal of obsolete paths; the cap remains unchanged.

## Step 7 budget-transition boundary

The Step 6 accepted checkpoint measured **209,631 / 210,000 bytes** with 369 bytes of headroom. The accepted Step 7 implementation measures **212,506 / 217,500 bytes**, with the original 210,000-byte maintainability warning active and **4,994 bytes** of cap headroom. The approved build-transfer limits are initial shell gzip **25,000 bytes** and first-party lazy gzip **55,000 bytes**; the latest measured values are **22,737** and **48,990**. The Step 7 draft behavior passed the new capture/movement/filter browser cases and the full built-preview suite at **19/19**; the latest 10-list/200-card benchmark recorded 563.2 ms usable render, 584 ms navigation to a usable board, 43.2 ms single-term filtering, zero console errors, and zero page errors. See `MVP_V2_BUDGET_TRANSITION_PROPOSAL.md`; the 217,500-byte cap was explicitly approved before adoption.