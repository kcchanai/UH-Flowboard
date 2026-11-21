# Release notes

## Find the current release

- [Main branch](https://github.com/kcchanai/UH-Flowboard/tree/main)
- [Validation runs](https://github.com/kcchanai/UH-Flowboard/actions/workflows/validate.yml)
- [Pages deployment runs](https://github.com/kcchanai/UH-Flowboard/actions/workflows/deploy-pages.yml)
- [Live app](https://kcchanai.github.io/UH-Flowboard/)

For a release check, match a successful validation run and Pages deployment to the same commit, rather than using a historical test count or comparing only workflow names. The Pages workflow does not publish Firestore Rules or indexes. Active production Rules parity and authenticated live behavior need their own evidence.

### Recent shipped changes

- [PR #34](https://github.com/kcchanai/UH-Flowboard/pull/34) added per-list colors and gradients that stay in the current browser. See the exact-client [validation run](https://github.com/kcchanai/UH-Flowboard/actions/runs/36972915683) and [Pages deployment](https://github.com/kcchanai/UH-Flowboard/actions/runs/36973400343).
- [PR #33](https://github.com/kcchanai/UH-Flowboard/pull/33) changed shared-card deletion and realtime access handling. [PR #31](https://github.com/kcchanai/UH-Flowboard/pull/31) updated invitations and member access. Their repository Rules changes, unlike PR #34, do not establish which Rules are active in production.

## Historical release notes

The notes below describe earlier releases. Their checkpoints, budgets, and commands are not current release instructions. For current checks, use the [validation checklist](VALIDATION_CHECKLIST.md#current-validation).

### Earlier collaboration and lifecycle release

- Firebase-authenticated owner/editor/viewer collaboration, granular revision-aware editing, realtime convergence, activity, assignments, comments, invitations, member administration, revocation, and ownership transfer are deployed.
- Owner-only workspace rename and recoverable archive/Restore retain descendants, deny archived content access, return active sessions to independent local data, and keep parent hard deletion denied.
- The last production-accepted behavior-changing lifecycle client release is `0b97993b43093e6cb0ccdda1a706d3e2f8d2b391` (`Restore cloud workspace open control`). A corrective release now propagates workspace-root name and archive status through the existing realtime listener and remains subject to independent-context production acceptance.
- Production owner archive/Restore, retained-content reopening, visual local restoration, and exact localStorage equality passed. Independent-context and lifecycle-specific role gates remain in `TERRA_NEXT_PHASES_PLAN.md`.
- Current source usage is 209,453 of 210,000 bytes. New feature development is frozen until practical headroom is restored.
- The current repository checkpoint passes 20 application/tooling tests, 23 Firestore Rules tests, and 10 browser checks. Regressions verify the exact stale-lifecycle message, active-name propagation, and one-time listener shutdown without reconnect after an archived root snapshot.

### Phase 8 — Performance, testing, and release maturity

- Added a dependency-free `state-core.js` boundary for versioned state helpers used by Flowboard filtering, CSV export, and import validation.
- Added Node built-in unit coverage for migration/normalization, filtering, import recognition, CSV quoting, and bounded undo snapshots.
- Added Chromium browser smoke tests for card creation + reload persistence and card-dialog Escape/focus return.
- Added a GitHub Actions validation workflow for pull requests and `main`: unit/syntax/static checks, static asset budgets, browser workflows, and a Lighthouse accessibility gate.
- Established initial static asset budgets: 140 KB total across `index.html`, `styles.css`, `state-core.js`, and `app.js`; individual file ceilings are enforced in `scripts/validate-performance.mjs`.

### Earlier dependency decision

The published application uses the pinned modular Firebase Web SDK for optional authenticated collaboration. The local-first UI remains vanilla HTML, CSS, and JavaScript with no framework runtime. Playwright and Lighthouse are installed **ephemerally in GitHub Actions only** for browser/accessibility validation and are not shipped to browsers.

### Earlier release procedure

Run locally:

```bash
npm test
npm run check
```

GitHub Actions additionally runs the browser smoke tests and Lighthouse accessibility audit against a temporary local static server. Pages deployment is separately smoke-tested after each release because a successful push is not deployment proof.
