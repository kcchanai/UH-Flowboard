# Step 10 results: performance and browser resilience

## Deterministic 1,000-card benchmark

The existing benchmark runner was parameterized for synthetic fixture sizes and run at 10 lists x 100 cards on a 1440x900 desktop viewport.

Three samples:

- Sample 1: render 626.5 ms, navigation 648 ms, filter 46.2 ms, console/page errors 0/0.
- Sample 2: render 623.1 ms, navigation 645 ms, filter 50.8 ms, console/page errors 0/0.
- Sample 3: render 571.1 ms, navigation 588 ms, filter 47.2 ms, console/page errors 0/0.

Summary:

- Median render: 623.1 ms; maximum: 626.5 ms.
- Median navigation to usable: 645 ms; maximum: 648 ms.
- Median single-term filter: 47.2 ms; maximum: 50.8 ms.
- Filtered result count: 1 card.
- Document width remained 1440px; board scroll width remained intentional.
- No console or page errors.

Historical 200-card baseline for context: 608.2 ms render, 633 ms navigation, and 43.7 ms filtering. These are local synthetic comparisons, not universal device guarantees.

## Resilience coverage

- Existing browser tests cover malformed/legacy/recovery data, failed storage writes, IME input, repeated UI actions, bounded page layout, forced colors, reduced motion, and configuration-dependent boot.
- Rules and Emulator suites passed on the exact current source.
- No persistent Firestore cache, offline queue, or production network path was introduced.

## Verification

- `node --check scripts/benchmark-mvp-v2.cjs`: passed.
- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped.
- Built-preview browser suite: 40 passed, 0 failed, 0 skipped.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- Emulator browser workflow: 1 passed, 0 failed.

Structured benchmark evidence:

- `benchmark-1000.json`
- `benchmark-1000-2.json`
- `benchmark-1000-3.json`

## Final budget

- Reachable source: 216,103 / 217,500 bytes.
- Headroom: 1,397 bytes.
- Maintainability warning threshold: 210,000 bytes, still a warning by design.

## Boundaries

- Synthetic local data only. No sign-in, cloud workspace, production fixture, raw storage, credentials, Rules change, merge, push, or deployment.
