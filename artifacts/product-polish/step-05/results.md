# Step 5 of 10 results: focused filters and board summary

## Delivered

- Promoted existing detailed filter state into quick focus controls:
  - Overdue
  - Due today
  - Unassigned
  - Assigned to me, shown only for an authenticated cloud session with a current UID
- Quick controls reuse the existing Due and Member filter state. They combine with search, labels and completion using the existing AND semantics.
- Quick controls expose `aria-pressed`, clear through the existing chips/Clear filters paths, and do not create a second identity or assignment system.
- Added an active-board summary in the existing live search-count region:
  - `N cards` when unfiltered.
  - `N of M cards shown - use Move to reposition filtered cards` when filtered.
  - Always includes incomplete overdue, incomplete due today and completed totals.
- Archived lists/cards are excluded from totals. Empty lists remain distinct from filtered no-match states through the existing list renderer.
- Assigned to me maps only through `assigneeUids` and the current authenticated UID. Local free-text names are not treated as cloud identity.

## Budget transition

Step 5 measured the quick-controls/summary scope at:

- Raw source: **252,939 / 300,000 bytes**, 47,061 headroom.
- Initial shell gzip: **25,376 / 26,000 bytes**, 624 headroom.
- First-party lazy gzip: **51,904 / 55,000 bytes**, 3,096 headroom.
- Document gzip: **5,913 bytes**.
- Index source: **26,312 / 26,500 bytes**.

The initial shell moved 231 bytes above the Step 4 25,145 measurement. The approved 26,000 gzip and 26,500 index-file ceilings are retained. No raw cap increase was made. No safety or accessibility copy was shortened.

## Qualification

- Unit suite: **37/37 passed**.
- Built browser smoke: **55/55 passed** on strict port 4244.
- Lighthouse accessibility: **score 1; zero failed audits**.
- Production asset isolation: **26/26 passed**.
- Static/syntax/build/measure/diff checks passed.
- Rules source remains unchanged at SHA-1 `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`.
- Browser proof covers combined filters, clear-all, no-match states, local/cloud identity separation, responsive quick controls, touch targets and unchanged raw workspace strings for non-mutating preference/filter actions.

## Safety and cleanup

- No workspace payload, identity data, Firestore Rules, cloud schema or production configuration changed.
- No push, PR, merge, deployment, Rules publication or real-account testing.
- Owned preview on port 4244 was stopped. Pre-existing services on ports 4173 and 4214 were untouched.
- Generated Lighthouse/test/emulator residue was removed and unrelated validation screenshots were restored.
