# Legacy profile bootstrap compatibility fix

## Status

Verified local release candidate. No push, PR, merge, Pages deployment, Firebase Rules/index publication, production document inspection/mutation, migration, or real-account acceptance was performed for this fix.

## Proven compatibility defect

Repository history shows that earlier shipped adapter commit `5dad247` wrote two fields to `users/{uid}`:

- `displayName`
- `updatedAt`

Current bootstrap Rules permitted only `uid`, `emailLower`, `workspaceIds`, and `personalWorkspaceId`. The client updates the profile with merge semantics, so those historical fields remained in `request.resource.data`; `validUserProfileShape()` rejected the transaction with `permission-denied` before workspace reads. This matches the live diagnostic result `permission-denied at session` and its deterministic Retry result. It is a proven code path and a strong account-specific hypothesis, but no production profile was inspected.

## Fix

`firestore.rules` now recognizes only those two retired fields on existing profiles, with strict historical types:

- `displayName`: string, at most 120 characters
- `updatedAt`: timestamp

The existing update diff allowlist does not include either field, so they remain immutable. New profile creation explicitly rejects both retired fields. Bootstrap may add the canonical home pointer and preserve historical metadata without widening normal profile mutation authority.

No client production source changed. No data is deleted, rewritten, migrated, or automatically repaired outside the existing canonical-home transaction.

## Regression evidence

Baseline against deployed Rules:

- Personal-workspace Rules file: 9 passed, 1 failed.
- Failure: historical metadata profile received `permission-denied` during canonical-home bootstrap.
- New-profile retired-field rejection already passed.

Candidate:

- Focused personal-workspace Rules: 10 passed.
- Full validation: exit 0, 43 unit tests plus static/build/isolation checks.
- Full Rules suite: 46 passed.
- Packaged Emulator browser workflow: 20 passed.
- Exact configured CI Emulator selection: 19 passed.
- Real production adapter historical-profile test: bootstrap, first-board creation, metadata preservation, and reload passed.

## Identities and budgets

- Baseline main: `a68d4da741496b344ae6d01ee1761967ebf6c350`
- Candidate Rules blob: `296b595276122918f521d3f86ee6820a5cc876b7`
- Unchanged indexes blob: `79fc192e9b71eb3c18b7fd504b77fc9b07bcd18a`
- Raw client source remains `299999 / 300000`; this Rules-only fix does not consume client source budget.

## Release boundary

A production release requires a new explicit deployment instruction. The release must publish the Rules change; a Pages-only deployment cannot fix this transaction denial. Since client source is unchanged, Pages publication is unnecessary unless the normal PR workflow republishes the same client. After Rules publication, Aaron should reload the live app and press Retry setup once. That affected-account action is acceptance evidence, not a prerequisite for Rules publication.
