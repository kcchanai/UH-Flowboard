# Step 9 of 10 results: complete UX qualification

## Scope

Step 9 qualifies the complete UX pass in unconfigured local mode, CI-like configured mode with synthetic public Firebase values, Rules Emulator, Emulator-backed browser flow, accessibility, storage isolation, source/build budgets, and the 1,000-card benchmark. No real Firebase project, real account, protected workspace, disposable production fixture, credential, or production deployment was accessed.

## Final qualification results

- The repository's `npm.cmd run validate` sequence passed during the qualification cycle. After the final accessibility-name correction, its constituent unit, syntax/static, build/budget, and asset-isolation commands were rerun individually and passed again.
- Final unconfigured source/build gates:
  - `npm.cmd run build`: passed, 47 modules transformed.
  - Reachable source: **245,459 / 247,500 bytes**.
  - Headroom: **2,041 bytes**.
  - Initial shell: **24,719 / 25,000 gzip bytes**.
  - First-party lazy: **51,429 / 55,000 gzip bytes**.
  - Document: **5,817 gzip bytes**.
  - `npm.cmd run check`: passed, including 11 semantic/runtime guards and adapter-boundary checks.
  - Production asset isolation: **25/25** assets passed.
- Final unconfigured built-browser smoke: **54/54** passed on owned preview port 4232.
- CI-like configured synthetic build/browser smoke: **54/54** passed on owned preview port 4231 using only non-production placeholder Firebase public values.
- Unit suite: **31/31** passed.
- Firestore Rules Emulator: **24/24** passed. Rules remained byte-identical to the baseline.
- Tracked Emulator-browser workflow: **1/1** passed using the verified system Chrome path and demo Emulator project.
- Lighthouse accessibility: **score 1 with zero failed audits** on the final unconfigured preview.
- Final 1,000-card synthetic benchmark: **3/3** samples passed with zero console/page errors.
  - Initial board render: median **563.7 ms**, maximum **566.3 ms**.
  - Navigation to usable: median **581 ms**, maximum **584 ms**.
  - Single-term filter: median **54.6 ms**, maximum **55.1 ms**.
  - Viewport: 1440x900; fixture: 20 lists and 1,000 cards; document width remained 1440px while the board lane retained intentional horizontal scrolling.
- `git diff --check`: passed with no whitespace errors; only repository line-ending notices remain for modified JavaScript files.

## Qualification fixes included

- Accessible status-button names now include visible status text plus the available action or unavailable explanation, satisfying Lighthouse `label-content-name-mismatch` checks.
- Auth rendering no longer replaces an active remote sync status with local sign-in text when an Appearance event arrives without a session.
- Configured and unconfigured browser paths now exercise the same status and navigation semantics.

## Evidence files

- `artifacts/ux-discoverability/step-09/benchmark-1.json`
- `artifacts/ux-discoverability/step-09/benchmark-2.json`
- `artifacts/ux-discoverability/step-09/benchmark-3.json`

The benchmark files contain synthetic local metrics only and no account, workspace, credential, or raw-storage payload.

## Boundary and cleanup

- Firestore Rules were not changed or published.
- No production deployment, push, PR, merge, or real-account testing occurred.
- Owned preview and Emulator processes were stopped after validation.
- Lighthouse report, Emulator log, browser reports, and generated screenshots were removed or restored before checkpointing.

## Step 9 decision

All automated and local qualification gates passed. Step 9 is ready for its isolated commit. Human real-account acceptance remains explicitly unperformed and is not part of this local release candidate.
