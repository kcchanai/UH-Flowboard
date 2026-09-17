# Step 4 results: cloud state transitions and feedback

## Confirmed race conditions addressed

- Activity loading now captures the session/workspace generation and discards late results, errors, and stale `finally` control updates after workspace changes, sign-out, or dialog closure.
- Assignment member loading now captures the active workspace, card, mode, session, and generation. Late member results cannot repaint a closed or different card.
- Member and invitation administration now ignores delayed responses from an earlier workspace/session and invalidates pending work when the dialog closes.
- Cloud comments now invalidate subscriptions, pagination, and mutations together. Closing a card resets busy state and controls, while late pages/errors/status messages are discarded.
- Existing cloud sync controller generation guards remain unchanged and continue to cover listener teardown, board changes, sign-out, archive, and access loss.

## Regression coverage

Added browser regressions using synthetic delayed adapters for:

- stale member results after switching cloud workspaces;
- stale activity after returning to local mode;
- stale assignment members after card closure;
- stale comment pagination after card closure.

## Verification

- `npm.cmd run validate`: exit 0. Unit tests: 29 passed, 0 failed, 0 skipped. Syntax, static, build, budget, and isolation checks passed.
- `npm.cmd run test:rules`: exit 0. Rules tests: 23 passed, 0 failed, 0 skipped.
- Built-preview browser suite: 37 passed, 0 failed, 0 skipped.
- Emulator browser workflow: 1 passed, 0 failed.
- No persistent Firestore cache, offline write queue, Rules change, or new infrastructure was added.

## Final budget

- Reachable source: 215,718 / 217,500 bytes.
- Headroom: 1,782 bytes.
- Maintainability warning threshold: 210,000 bytes, still a warning by design.
- Initial-shell gzip: 23,694 / 25,000.
- First-party-lazy gzip: 44,248 / 55,000.
- Document gzip: 5,433, reported separately.
- Reachable sources: 23; production asset isolation passed.

## Review note

The delayed adapter-forwarding refactor proposed by the background budget review was not applied. Step 2 had already been independently implemented, validated, and committed; reopening it during cloud-transition work would expand risk without a current defect requiring it. The review also confirmed there are no proven-unused CSS selectors or safely removable HTML dialog scaffolds.

## Boundaries

- Firestore Rules source and production cloud data unchanged.
- No protected workspace, real account, merge, push, or deployment touched.
- Raw runner logs and generated emulator debug output were removed after extracting sanitized results.
