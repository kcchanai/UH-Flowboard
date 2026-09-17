# Step 2 results: source-budget capacity decision

## Measured baseline and recovery

- Step 1 working-tree source: 216,498 / 217,500 bytes; 1,002 bytes headroom.
- Safe adapter dispatch candidate dry run: syntax checked; initial arrow-property form saved 534 bytes, but failed the existing adapter-contract static parser. The contract-preserving method-syntax implementation saves 308 bytes.
- Safe CSS duplicate candidate: removed the repeated `top-action` display and repeated narrow-width input width declarations while retaining the distinct narrow search-wrap padding. Measured saving: 63 bytes.
- Current working-tree source: 216,127 / 217,500 bytes; 1,373 bytes headroom.
- Initial shell gzip remains 23,767 / 25,000 in the current build measurement.
- First-party lazy gzip remains 44,248 / 55,000 in the current build measurement.
- Reachable production graph remains 23 files with no unbudgeted reachable source.

The adapter change preserves all `REMOTE_METHODS` keys and method syntax required by `tests/adapter-contract.test.mjs`; it only routes fixed named exports through cached dynamic-import dispatch helpers. The CSS change removes declarations already supplied by the enclosing max-width rule and does not alter the intended 440px search padding.

## Regression verification after recovery

- `npm.cmd run validate`: passed; 29 unit tests, static checks, build, budget, and isolation.
- `npm.cmd run test:rules`: passed; 23 Rules tests.
- `PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser`: passed; 1 Emulator browser test.
- Built-preview Playwright smoke on strict port 4198: passed; 40 browser tests.
- `node --check src/adapters/firebase-workspace-adapter.js`: passed.
- Focused adapter-contract and granular-workspace tests: passed; 3 tests.

## Feature allocation estimate

These are conservative planning estimates, not an authorization to exceed the cap:

| Scope | Estimated new raw source | Reason |
| --- | ---: | --- |
| Allowlisted palette catalogue and board-specific token selectors | 0.8-1.3 KB | Eight presets need identifiers, mode-specific colors, and safe rendering state. |
| Appearance dialog markup, draft behavior, storage adapter, and tests | 2.0-3.2 KB | Requires accessible radios, preview/save/cancel/reset, malformed-storage handling, and browser-local persistence. |
| Own-account photo badge and card/member badge renderer | 0.8-1.4 KB | Requires image allowlisting, initials fallback, load/error lifecycle, accessible names, and fixed layout. |
| Workspace-scoped profile sharing, adapter contract, UI, Rules/tests | 2.0-3.5 KB | Requires exact self-update authorization and Emulator negative coverage; Rules bytes are separate but client/tests still need source. |
| Roster reuse and card/assignment integration | 1.2-2.0 KB | Requires current-member resolution, former-member behavior, overflow badges, lifecycle teardown, and stale-response guards. |
| **Conservative first-pass total** | **6.8-11.4 KB** | Excludes any large visual screenshot fixtures and test-only artifacts. |

With 1,373 bytes of headroom, the requested full scope cannot be implemented honestly under the current raw-source cap while retaining required safety/accessibility behavior and the existing test contract. Even a client-only canvas plus own-account avatar slice would need a separately reduced scope decision; shared photo sharing and roster integration cannot fit in the remaining margin.

## Blocker and available choices

Step 2 is blocked pending one of these explicit decisions:

1. **Authorize a quantified cap transition:** choose a new raw-source cap supported by measured transfer/build evidence. A provisional implementation target of at least 225,000 bytes would provide approximately 8.5 KB beyond the current source and should still be remeasured after each step. This is a proposal, not applied.
2. **Reduce scope:** implement only a compact client-only appearance subset, for example three palettes plus the existing theme toggle and no shared/team photos. The full 10-step avatar/profile scope would be deferred.
3. **Provide another approved source-budget allocation or consolidation target:** it must be behavior-preserving, syntax-checked, and not remove safety/accessibility/public copy.

No cap was changed. No appearance or avatar feature code was added. Firestore Rules are unchanged.

## Safety

No production data, protected workspace, real account, Rules publication, Pages deployment, or remote push occurred. Raw command logs were removed after this sanitized report was written.
