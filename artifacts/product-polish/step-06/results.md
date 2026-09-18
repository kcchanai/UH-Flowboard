# Step 6 of 10 results: lazy List view

## Delivered

- Added a lazy-loaded first-party List view over the existing active-board projection.
- Board and List share the same search, filters, archived exclusion, due semantics and current UID mapping.
- Semantic table columns: Task, List, Assignees, Due, Checklist and Status.
- Stable title and due sorting with `aria-sort`; missing due dates sort last and ties retain original order.
- Explicit `Show 100 more` pagination. The List view never silently hides rows.
- Card rows open the existing card-detail dialog through `FlowboardApp.openCardById`; no duplicate mutation path or cloud listener was added.
- Returning to Board restores the existing card renderer. List view preference is stored in the isolated UI-preference record.
- Saved List preference reopens through the lazy module after boot; a failed lazy import leaves the Board view available.
- Table overflow is contained in the board region, preserving page-width bounds at narrow sizes.

## Qualification

- Unit suite: **37/37 passed**.
- Built browser smoke: **56/56 passed** on strict port 4247.
- Lighthouse accessibility: **score 1; zero failed audits**.
- Production asset isolation: **27/27 passed**, including the List-view lazy chunk.
- Static/syntax/build/measure/diff checks passed.
- Browser proof covers lazy chunk absence before selection, 105-card parity, 100-row pagination, title sorting, card-dialog focus return, Board/List return, and view preference persistence.
- Rules source remains unchanged at SHA-1 `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`; no new cloud listeners or Rules behavior were introduced.

## Measurements

- Reachable raw source: **259,778 / 300,000 bytes**; **40,222** headroom.
- Initial shell gzip: **25,635 / 26,000 bytes**; **365** headroom.
- First-party lazy gzip: **54,293 / 55,000 bytes**; **707** headroom.
- Document gzip: **5,925 bytes**.
- List-view lazy chunk: **5,813 bytes**, gzip **2,389 bytes**.

The lazy budget is now close to its unchanged cap. Future optional UI must be measured carefully and should remain lazy; no further gzip-limit increase was made in Step 6.

## Safety and cleanup

- No workspace payload, identity data, Firestore Rules, cloud schema or production configuration changed.
- No push, PR, merge, deployment, Rules publication or real-account testing.
- Owned preview on port 4247 was stopped. Pre-existing services on ports 4173 and 4214 were untouched.
- Generated Lighthouse/test/emulator residue was removed and unrelated validation screenshots were restored.
