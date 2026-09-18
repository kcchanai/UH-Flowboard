# Step 7 of 10 results: dialog reachability and keyboard safety

## Scope

Step 7 qualifies Account, Appearance, Boards, Cloud workspaces, and rich dialog surfaces for short desktop heights and narrow compatibility widths. Production, Firestore Rules, protected workspaces, disposable fixtures, credentials, and real-account state were not accessed or changed.

## Implemented changes

- Rich dialogs whose content is held by `archive-dialog-card` now have a bounded viewport-height scroll surface with contained overscroll. Existing card-dialog sizing remains unchanged.
- Appearance captures its actual opener and restores focus to it when the opener remains visible.
- Appearance opened from the Account panel passes the Account Appearance shortcut as its opener; because the parent Account dialog closes before Appearance opens, close now falls back to the visible Account toolbar control instead of a hidden child of the closed dialog.
- Cloud workspaces captures the opener for both the topbar workspace-status button and the explicit Cloud workspaces button, then returns focus to that opener on close.
- Browser coverage now checks these behaviors at 1280x720, 1440x900, 1920x1080, 960x720, 390x720, and 320x720. It checks dialog bounds, close-button bounds, page-width containment, pointer Close, and focus return.

## Verification

All commands ran against the local repository and built preview only.

- `npm.cmd run build`: passed, 47 modules transformed.
- `npm.cmd run measure:mvp-v2`: passed.
  - Reachable source: **245,493 / 247,500 bytes**.
  - Maintenance headroom: **2,007 bytes**.
  - Warning threshold: 210,000 bytes, unchanged.
  - Initial shell: **24,681 / 25,000 gzip bytes**.
  - First-party lazy: **51,415 / 55,000 gzip bytes**.
  - Document: **5,730 gzip bytes**.
- `npm.cmd run check`: passed, including 11 semantic/runtime guards and adapter-boundary checks.
- `node --check tests/browser-smoke.spec.mjs`: passed.
- Focused Step 7 browser checks: passed, **4/4**.
- Complete built-browser smoke: passed, **53/53** on owned preview port 4224 using system Chrome.
- `npm.cmd test`: passed, **31/31**.
- `npm.cmd run test:rules`: passed, **24/24** Firestore Rules Emulator tests.
- `node scripts/validate-test-isolation.mjs`: passed, **25/25** production assets contained no Emulator-only markers.
- `git diff --check`: passed with only the repository's existing LF-to-CRLF notices for modified JavaScript files and no whitespace errors.

## Changed files

- `src/appearance-ui.js`
- `src/auth-ui.js`
- `src/cloud-workspace-ui.js`
- `styles.css`
- `tests/browser-smoke.spec.mjs`

## Boundary and cleanup

- Firestore Rules are byte-identical to the baseline.
- No production deployment, push, PR, merge, Rules publication, or real-account testing occurred.
- The owned preview was stopped after validation.
- Generated screenshots changed by browser smoke and the Emulator log were restored or removed before checkpointing.
- Step 7 is ready for its local commit; the commit identifier is recorded after commit, not inferred here.
