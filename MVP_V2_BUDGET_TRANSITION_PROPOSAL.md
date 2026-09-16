# MVP V2 source-budget transition proposal

Status: decision required. The 210,000-byte hard cap has not been changed.

## Measured guard

The current validator measures raw filesystem bytes for the exact 23 reachable first-party production files listed in `scripts/source-budget.mjs`. It excludes tests, Markdown, scripts, `node_modules`, generated `dist/`, screenshots, and reports. It also enforces the existing per-file limits and fails when the aggregate is greater than 210,000 bytes. The reachable graph contains 23 files and the manifest contains all 23; no reachable source is unbudgeted.

This is a source-maintainability guard, not a download-size, runtime-memory, Firebase-quota, or billing metric.

## Evidence

| Checkpoint | Raw source | Headroom / overage |
| --- | ---: | ---: |
| Step 6 accepted checkpoint | 209,631 bytes | 369 bytes headroom |
| Step 7 current implementation draft | 212,506 bytes | 2,506 bytes over cap |

The Step 7 draft is 2,875 bytes above the accepted Step 6 source total. It adds the required touch-friendly Move workflow, shared card movement command, IME-safe capture, filtered-drag guard, whole-list drop handling, focus return, and regression coverage. It also removes the obsolete preview delete X and legacy opaque card metadata badge. The Step 7 source remains readable and retains safety, authorization, retention, and accessibility wording.

The current built-output measurement is:

| Category | Raw bytes | Gzip bytes |
| --- | ---: | ---: |
| Initial shell | 77,041 | 22,746 |
| First-party lazy | 154,906 | 48,989 |
| Vendor | 477,895 | 139,736 |

The latest synthetic 10-list/200-card browser benchmark for the Step 7 candidate recorded 563.2 ms usable render, 584 ms navigation to a usable board, 43.2 ms single-term filter response, zero console errors, and zero page errors. This is a local sample, not a p95 or universal device claim.

## Semantic-removal audit already performed

The following safe reductions have already been applied and verified:

- removed the hover-only destructive card-preview X while retaining explicit detail-level Delete/Archive actions;
- removed the opaque legacy `meta` badge from card previews while preserving the field in normalization, migration, import, and export;
- removed dead completion and card-delete CSS selectors;
- collapsed card draft wrapper state and redundant dirty assignments;
- routed card movement through the existing pure `moveCard` helper;
- removed unused destructured helper names;
- preserved the validator-required explicit state-helper references and adapter probe paths.

The earlier branch-specific headroom plan's obsolete Collaboration planner and adapter-facade paths are already absent or intentionally retained behind static validation in this branch. Further removal would require deleting a live recovery, collaboration, card-detail, or authorization boundary, or reducing the newly required Step 7 behavior.

## Candidate transition for approval

If Aaron approves a measured transition, use the following as a candidate for the remaining MVP V2 scope, subject to fresh stress and device evidence before final release:

- raw source cap: **217,500 bytes**;
- retain the existing per-file limits and the 210,000-byte value as a visible maintainability warning;
- add an initial-shell gzip ceiling of **25,000 bytes**;
- add a first-party-lazy gzip ceiling of **55,000 bytes**;
- continue reporting vendor bytes separately rather than attributing Firebase SDK transfer to first-party UI work;
- rerun the 10-list/200-card and 20-list/1,000-card benchmarks, narrow viewport checks, production build, browser smoke, Emulator browser workflow, Lighthouse, and isolation guard before accepting the replacement thresholds.

The 217,500-byte candidate is derived from the documented remaining provisional allocations: 2,500 bytes for Steps 8-10, 1,000 bytes for Steps 11-13, and a 771-byte safety reserve, plus a small transition margin. It is not a production acceptance claim and must not be applied without explicit approval.

## Alternatives

1. **Keep 210,000 unchanged.** Reduce or defer enough live Step 7 scope to recover at least 2,506 bytes, or authorize a new semantic-retirement plan. Do not delete safety copy, cloud boundaries, recovery, or accessibility behavior.
2. **Approve the candidate transition above.** Update the validator and budget documentation together, preserve the 210,000 warning, and require the replacement transfer/performance checks before Step 7 can close.
3. **Pause MVP V2.** Leave the Step 7 draft uncommitted and resume only after a budget decision.

## Current safety state

- `firestore.rules` is unchanged.
- No production deployment, Rules publication, merge to `main`, real-account test, protected-workspace access, or production fixture mutation occurred.
- The Step 7 implementation and tests remain uncommitted until the budget decision is made.
