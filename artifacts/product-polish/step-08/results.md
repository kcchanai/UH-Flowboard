# Step 8 of 10 results: card details and feedback

## Delivered

- Added explicit **Cancel** to card details. It uses the existing `closeCard()` path, so unsaved drafts still require the existing accessible Discard changes confirmation.
- Added a live `Unsaved changes` status for card drafts.
- Failed local/cloud card saves retain the draft and now expose an actionable `Could not save. Your draft is still here.` status alongside the existing toast/error behavior.
- Existing Save changes, Escape, pointer Close, draft isolation, cloud read-only guards, archive/delete/move/duplicate safety and focus return remain intact.
- No Rules, schema, comment storage or identity model changes were needed.

## Qualification

- Unit suite: **37/37 passed**.
- Built browser smoke before the final test-only assertion: **58/58 passed**.
- Focused final card-edit test after the Cancel/status assertion: **1/1 passed**.
- Lighthouse accessibility: **score 1; zero failed audits**.
- Production asset isolation: **28/28 passed**.
- Static/syntax/build/measure/diff checks passed.
- Existing failed-save draft retention, unsaved-close confirmation, dialog focus return, cloud conflict, viewer/read-only and short-height dialog tests remain green.

## Measurements

- Raw source: **265,366 / 300,000 bytes**; **34,634** headroom.
- Initial shell gzip: **25,942 / 26,000 bytes**; **58** headroom.
- First-party lazy gzip: **55,798 / 58,000 bytes**; **2,202** headroom.
- Document gzip: **5,997 bytes**.
- Index source: **27,051 / 27,250 bytes**.

The Step 8 index ceiling transition was measured and approved under Aaron's standing pre-approval. Shell and lazy caps remain unchanged from Step 7.

## Safety and cleanup

- No workspace payload, identity data, Firestore Rules, cloud schema or production configuration changed.
- No push, PR, merge, deployment, Rules publication or real-account testing.
- Owned preview on port 4249 was stopped. Pre-existing services on ports 4173 and 4214 were untouched.
- Generated Lighthouse/test/emulator residue was removed and unrelated validation screenshots were restored.
