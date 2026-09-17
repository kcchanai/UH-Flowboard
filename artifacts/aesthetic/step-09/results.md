# Step 9 results: visual, accessibility, resilience, and performance qualification

## Visual and accessibility qualification

- Contrast sampler exercised **32 states**: 8 palettes x 2 modes x 2 finishes.
- Final minimums across sampled gradient interiors/endpoints and solid states:
  - Canvas text: **6.22:1**.
  - Canvas control text: **4.77:1**.
  - Focus color: **3.65:1**.
  - Card text: **10.53:1**.
- The Lagoon light-gradient control token was adjusted after the first measurement found 4.37:1; the corrected run passed the 4.5:1 normal-text and 3:1 focus/UI targets.
- Lighthouse accessibility: **100/100**, zero failed scored audits.
- Full built-preview browser smoke: **48 passed**.
- Existing browser coverage passed for keyboard focus/menus, Escape/focus return, forced colors, reduced motion, 200% reflow, intentional board scrolling, local persistence, cloud-preview read-only controls, and roster/profile contracts.
- Public production-source em dash count: **0**.

## Performance qualification

Synthetic desktop fixture: 10 lists x 100 cards, 1440x900, three isolated samples.

- Initial render median: **561.8 ms**, maximum **562.2 ms**.
- Browser navigation to usable median: **582 ms**, maximum **584 ms**.
- Single-term filter median: **49.6 ms**, maximum **49.9 ms**.
- Console errors: **0** in all samples.
- Page errors: **0** in all samples.

Evidence:

- `artifacts/aesthetic/step-09/contrast.mjs`
- `artifacts/aesthetic/step-09/contrast.json`
- `artifacts/aesthetic/step-09/lighthouse.json`
- `artifacts/aesthetic/step-09/benchmark-1000-1.json`
- `artifacts/aesthetic/step-09/benchmark-1000-2.json`
- `artifacts/aesthetic/step-09/benchmark-1000-3.json`

## Budget

- Reachable raw source: **239,382 / 240,000 bytes**.
- Headroom: **618 bytes**.
- Initial shell gzip: **24,426 / 25,000 bytes**.
- First-party lazy gzip: **49,391 / 55,000 bytes**.
- Document gzip: **5,587 bytes**, reported separately.
- Vendor gzip: **139,736 bytes**, reported separately.

No production feature code was added during qualification. The raw-source margin is intentionally preserved as a release constraint.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. All benchmarks and visual checks used synthetic data and isolated local browser contexts.
