# Step 7 final qualification evidence

## Final gates

- Configured `npm.cmd run validate`: passed, **41 unit tests**, static/syntax/build/isolation checks passed.
- Firestore Rules Emulator: passed, **46/46**.
- Packaged Auth/Firestore Emulator browser workflow: passed, **19/19**.
- Exact configured CI browser selection: passed, **11/11**.
- Lighthouse accessibility: passed, score **1.0**, zero failed audits.
- Production asset isolation: passed, **17 assets** with no Emulator-only markers.
- Expected Rules negative probes emitted sanitized permission-denied diagnostics; all tests passed with exit code 0.

## Final budgets

Configured and unconfigured raw source: **284258 / 300000** bytes, **15742** bytes headroom.

Configured:

- Initial shell gzip: **25868 / 26250** bytes.
- First-party lazy gzip: **55568 / 60000** bytes.
- Document gzip: **4989** bytes.
- Reachable production sources: **34**.

Unconfigured:

- Initial shell gzip: **25813** bytes.
- First-party lazy gzip: **55568** bytes.
- Document gzip: **4987** bytes.
- Reachable production sources: **34**.

No source or gzip cap changed.

## Final synthetic visual capture

Receipt: `artifacts/recovery-menu-retirement/final/capture-report.json`

- Account signed-in at 1440x900.
- Boards with personal, shared read-only, and archived board states at 1440x900.
- Boards at 320x720.
- Transient setup/retry at 960x720.
- Repair account setup confirmation at 960x720.
- HTTP statuses: 5 x 200.
- Console errors: 0.
- Page errors: 0.
- Failed requests: 0.
- Document overflow: none.
- Visible recovery/legacy text counts: zero on every captured surface.
- Visual reinspection found one duplicate Retry action in the first capture; the gate renderer was made idempotent, then the final capture was refreshed and rechecked with exactly one Retry setup control.

Rules and indexes remain byte-identical to baseline. No production account, document, protected workspace, Rules publication, index publication, migration, push, PR, merge, or deployment was used.
