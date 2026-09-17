# Step 9 results: desktop accessibility and mouse/keyboard qualification

## Automated accessibility

- Pinned Lighthouse accessibility audit against the built preview: score 100/100.
- Scored accessibility audits: 73.
- Failed scored audits: 0.
- Report: `artifacts/polish/step-09/lighthouse.json`.

## Browser qualification

The existing browser suite covers:

- Keyboard board-action menu traversal, Home/End/Arrow movement, Escape closure, and focus return.
- Card dialog Escape closure and focus return.
- Viewer dialog pointer-close behavior.
- Filter controls and chips.
- Card movement, confirmation dialogs, recovery, import, and failed-save behavior.
- Forced colors and reduced motion.
- Coarse-pointer target sizing.
- Page-width bounds and intentional board-lane horizontal scrolling.
- Desktop office viewports, resized desktop windows, and limited narrow-width regression.

Final current run:

- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped.
- Built-preview browser suite: 40 passed, 0 failed, 0 skipped.
- Public source scan: 0 em dashes.

Native browser zoom was not claimed as automated proof. Existing 200% reflow coverage uses a bounded CSS viewport method; actual browser zoom remains a disclosed manual acceptance item for the final human gate.

## Final budget

- Reachable source: 216,103 / 217,500 bytes.
- Headroom: 1,397 bytes.
- Maintainability warning threshold: 210,000 bytes, still a warning by design.

## Boundaries

- No Rules, production cloud data, protected workspace, real account, merge, push, or deployment touched.
- Raw runner logs were removed after extracting sanitized results; the Lighthouse JSON remains as the intentional audit artifact.
