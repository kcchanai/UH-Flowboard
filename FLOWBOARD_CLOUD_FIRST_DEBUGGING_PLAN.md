# Flowboard: cloud-only workspace and lifecycle debugging plan

**Status: finalized planning handoff, not implemented.**

**Implementation model: gpt-5.6-sol.** Aaron will switch models and separately initiate implementation. The current request authorizes planning only.

**Repository:** `C:/Code/Stacie-Hermes/UH-Trello`

**Public app:** https://kcchanai.github.io/UH-Flowboard/

**Audited release:** `d1c00e619e9b9b907d599e0dcbd1981b80841bc0`

**Audited Rules blob:** `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`

## 1. Product outcome

Replace the user-facing local/cloud split with one familiar **My workspace** interface. Signed-in users create, open, and edit cloud-backed boards without manually copying a workspace or entering a separate cloud mode.

Required results:

- One My workspace board manager, not a second Cloud workspaces menu.
- Every newly created board and accepted content edit is persisted to Firestore automatically. No ordinary editable local workspace and no silent local fallback.
- Existing browser-only content is protected and offered a one-time, explicit migration. Do not silently upload previously private local data.
- Boards have distinct **Archive**, **Restore**, and **Delete permanently** operations.
- Lists can actually be deleted, including lists containing archived cards/comments, with explicit destructive confirmation.
- Cards have distinct, reliable **Archive**, **Restore**, and **Delete permanently** operations.
- The horizontal board scrolling control is reachable and visible at the bottom of the available board viewport, without first scrolling the page vertically.
- Remove **Start here** entirely.
- Filters closes when clicking/tapping outside the panel, while retaining toggle and Escape behavior. Correct the observed off-screen panel placement too.

This is a product/data-model transition, not a CSS-only patch. Firestore Rules, migration, authentication bootstrap, transaction completion, and realtime reconciliation are in scope.

## 2. Authorization and non-negotiable boundaries

### Planning and implementation gates

- This document is not permission to implement, push, publish Rules, deploy, or touch live data.
- After Aaron starts implementation, work continuously on an isolated local branch, with synthetic fixtures and Auth/Firestore Emulators. Stop at the fully qualified **local release candidate**.
- A model switch alone is not an execution instruction. The companion handoff supplies the explicit implementation request.
- No push, PR creation, merge, Pages deployment, Firebase Rules/index publication, production migration, or real-account acceptance without a later explicit release authorization.
- Send `Step X of 13 complete` after each verified checkpoint, not merely after code is written. Keep a repository-local progress ledger with evidence, current commit, blockers, and one active step.

### Safety boundaries

- Files and generated tools/artifacts must remain under `C:/Code/Stacie-Hermes`.
- Do not use normal browser profiles, production credentials/config files, or real-account sessions. Do not open or mutate `My Flowboard workspace` or `Lifecycle realtime probe` as test fixtures.
- Use fresh `demo-*` Emulator data and independent owner/editor/viewer/non-member browser contexts.
- Never print raw `flowboard-workspace`, `flowboard-data`, document bodies, auth material, emails, UIDs, workspace IDs, tokens, or cookies. Evidence uses counts and `[REDACTED]`.
- Keep Firebase Spark and static GitHub Pages hosting. No paid services, Cloud Functions, custom backend, persistent Firestore cache, automatic offline write queue, extra OAuth scopes, Gmail/People/Contacts access, or infrastructure changes are authorized by this plan.
- Permanent **board/card/list** deletion is requested. Permanent **workspace-root/account** deletion is not. Keep workspace roots, membership, invitations, and ownership boundaries intact.
- Preserve UID/member-ID authorization and assignments. Provider photos remain optional, workspace-scoped presentation only, validated to the existing HTTPS host allowlist.
- Preserve accessibility, visible dialog Close/Cancel, keyboard navigation, dirty-draft protection, read-only navigation, imports/exports appropriate to the new model, and explicit confirmations.
- No em dashes in public-facing copy.

### Intentional changes to older requirements

The new request supersedes local-first product behavior: normal sign-out/access loss must no longer activate a local editable board, and new boards must not default to browser-only persistence. It does **not** authorize erasing legacy local records or automatically merging sharing scopes.

Older local-isolation tests remain useful as **legacy-data preservation** tests. Replace obsolete assertions that require local fallback with assertions for the new signed-out/access-lost state. Do not remove the underlying privacy or byte-equality checks.

## 3. What the audit established

Full evidence: `artifacts/cloud-first-planning/AUDIT.md` and `public-audit.json`.

### Confirmed code and browser findings

- `src/main.js` always constructs the local adapter; `app.js` boots into local state. Account sign-in and the separate chooser do not change that automatically.
- `renderWorkspaceList()` lists only the currently loaded workspace. It is not an account-wide cloud board directory.
- Cloud chooser editability requires owner/editor **and** verified granular migration. A read-only label does not prove viewer membership. This explains why an owner can see Rename/Archive beside a preview-only entry, without establishing the state of Aaron's live data.
- `listMarkup()` disables cloud list deletion; `deleteList()` refuses it independently. Rules deny board/list/card/comment hard deletion.
- `#delete-card` deliberately archives cloud cards instead of deleting them. Board lifecycle actions are absent from the current board manager.
- `mutate()` returns before cloud commit. Several lifecycle handlers close or refresh UI immediately, so rollback and the archive view can disagree.
- The reused confirmation close handler invokes its shared callback before clearing it. A dirty-card discard callback that opens a second confirmation can have that second callback cleared by the first handler. Reused `returnValue` is not reset.
- At 1440x900 the board bottom is 959px, outside the viewport; horizontal content is 1658px wide in a 1351px client area. At 1280x720 the board bottom is 779px. The scroll track is genuinely below the visible region.
- Filters stays open after clicking the board heading. Escape works. The panel's left edge is approximately -132px at desktop width because it is right-aligned to a left-positioned trigger.
- Start here is present as a disclosure and should be removed, not restyled.

### Not claimed

No signed-in destructive action was performed in production. The user's exact archive failure sequence has not been reproduced against their account. Treat the transaction/confirmation problems as source-confirmed defects or risks requiring deterministic tests, not as proof of a particular live request failure.

Planning checks: 37 unit tests passed, zero failures; anonymous audit captured zero console/page errors. No full new Emulator or release qualification was performed.

## 4. Target UX and data ownership

### One board manager, existing tenancy retained

Use the existing My workspace / Your boards design as the starting point, not the old Cloud workspaces dialog.

Proposed information structure:

```text
My workspace                                      [Close]
[Find a board.................................]
[Active boards] [Archived boards]

Website Launch              Owner       Synced    [Open] [More]
CSS Tasks                   Can edit    Synced    [Open] [More]
Shared board                View only             [Open]

[New board name] [Template] [Create board]
```

- List accessible boards in one place, grouped or annotated by their underlying sharing scope only when needed to distinguish them.
- Backend workspaces remain authorization containers. Do not merge their documents, members, roles, or invitations to create a visually single workspace.
- Use `(workspaceId, boardId)` as the board identity everywhere. Never deduplicate by title or boardId alone across containers.
- Search must cover all loaded directory pages, with explicit loading/load-more behavior. Do not silently truncate a result set and label it all boards.
- New boards default to the user's personal owner scope. If creation into an existing shared scope is offered, make the destination and inherited access explicit in the same dialog, not a separate cloud chooser.
- Selecting a board changes its backend context automatically and starts only its content listeners. It must not require a second Open or cloud-mode confirmation.
- Default board rows retain title, counts where cheaply available, active state, and readable role. Keep row actions as sibling buttons, not nested interactive elements inside one giant button.
- Archive uses neutral/warning styling; Delete permanently uses danger styling. Do not make Archive look like irreversible deletion.
- Account becomes identity/sign-out/profile preferences plus a link to this same My workspace manager. Status is a concise `Saving`, `Synced`, `Offline`, `Conflict`, or error label, not another storage-mode menu.
- Members/invitations remain reachable from the selected board's sharing context. State clearly that existing workspace membership affects all boards in that context; this release does not invent board-specific ACLs.
- Existing archived backend workspaces must remain recoverable through a small **Archived spaces / legacy recovery** subsection inside this same manager for owners. Do not silently restore them or lose their Restore controls when removing the old chooser. This is not a second top-level workspace interface.

### Signed-out and failure behavior

- Before auth resolves: loading/skeleton state, no editable seed board flash.
- Signed out: a clear Sign in to access your boards screen, plus the non-mutating legacy export/import recovery route if old data exists. No normal anonymous task editor.
- Signed in: discover memberships and the personal workspace; resolve last selected accessible board, then show it. A loading/permission/network error is not an empty account.
- Fresh user: bootstrap one empty personal workspace atomically and idempotently; do not seed Website Launch unless the user explicitly chooses that template.
- Auth/config unavailable: honest unavailable/retry message, no false Synced status and no local write fallback.
- Offline: loaded content can remain visibly stale/read-only in memory; edits are not falsely accepted or saved locally. Preserve an unsent editor draft in memory with retry/copy/discard controls. Do not promise persistence after tab closure.
- Sign-out/account switch/access removal: stop listeners, invalidate pending requests, clear old account data and open entity dialogs, then show the appropriate gate/directory. Do not render the prior account's boards from browser storage.
- A deliberate account/board switch with dirty drafts requests Save/Discard/Cancel first. Security-driven revocation must revoke access immediately, even if a draft is open; do not retain confidential data to preserve convenience.

### Personal workspace bootstrap

Add a self-only user profile pointer such as `personalWorkspaceId`, with a documented schema. Resolve an existing owner container through an explicit one-time default selection rather than matching a workspace name. If none exists, create root + owner membership + profile reference atomically. Competing first-login tabs must converge to one chosen personal workspace, not duplicate containers.

Profile references are discovery hints only. Every open and mutation still checks current membership. A stale/missing pointer prompts safe rediscovery and recovery, not automatic overwrite of an existing account.

### Browser storage after transition

Allow browser storage for appearance/density/view preferences and account-scoped last selection. Do not store ordinary cloud board/card content as an alternative writable workspace. Keep auth persistence managed by Firebase; do not expose it.

Retain old workspace bytes as an inert recovery source until the user explicitly decides otherwise. A quarantined legacy export source is not an active local workspace. New cloud actions and UI preferences must leave legacy keys byte-for-byte unchanged.

## 5. Legacy-data migration and compatibility

Two distinct migrations must not be confused:

1. **Browser-only data -> cloud boards**, requiring explicit preview/consent.
2. **Legacy cloud snapshots -> current granular/lifecycle schema**, requiring owner-only, resumable conversion.

### Browser migration

- Detect whether raw legacy records exist without invoking a loader that seeds or rewrites them.
- Offer Export backup, Review import, and Not now. Signing in alone never uploads old data.
- Preview board/list/card counts, target account/scope, archive state, and conflicting IDs. Default destination is private personal scope, not a shared group.
- Import as new boards, not replacement of an existing cloud workspace. Never silently overwrite by title or ID.
- Use a durable migration/import operation ID and deterministic mapping for this attempt. A retry resumes the same targets; it does not mint another set of boards.
- Preserve titles, lists/order, card fields, labels/checklists, completion, archive state and legacy history. Free-text assignees remain legacy labels until explicitly mapped to current members. Never infer assignment identity from names/emails/photos.
- Verify both counts and stable content fingerprints/field equivalence from server reads before declaring success. Counts alone do not prove correct content.
- Export/retain original raw data and migration map locally without rewriting the two legacy payload keys. Do not publish fingerprints or payloads in logs.
- Malformed JSON, unsupported schema, storage errors, partial cloud writes, network failures, denial, and cancelled flow all preserve the original.
- Once explicitly imported and verified, subsequent work on those cloud boards synchronizes automatically. Do not repeatedly prompt or auto-reimport after a cloud board is deliberately deleted.

### Existing cloud snapshots

- Keep legacy owner/viewer discovery working during transition. Show `Upgrade needed` or `Preparing board`, not a misleading permanent viewer role.
- Upgrade only with owner permission and a visible backup/verification flow; editors/viewers get an accurate owner-action message.
- Use migration revision/state gates and an idempotent per-document plan; resume from initializing, migrating, or partially written granular states.
- Verify rich fields and active/archived counts, not just visible active cards.
- A complete pre-migration cloud backup must explicitly include paginated comment subcollections and card-local history. The current in-memory workspace JSON does not include remote comments; do not label that export a complete backup. Version the export/import bundle, map comment records to stable board/card identities, and document excluded immutable audit/control metadata. Do not include credentials, user-directory records or membership emails in a content backup.
- Inventory the retained board `snapshot` field and any other duplicate cloud copies. Remove/scrub these after a verified current-schema conversion and authorized retention transition, before claiming permanent entity deletion can remove all app-managed copies.
- Never regenerate a deleted card/list from an old retained snapshot on reload, migration retry, or rollback.
- Keep the existing interrupted-migration recovery path until its replacement is tested. Removing its menu without a recovery replacement is a regression.

### Empty states and schema

Current `normalizeWorkspace()` seeds a board if none exist, and `board()` assumes a fallback board. Cloud must support an actual empty account/space and the deletion or archival of the last board without creating a phantom local board.

Introduce explicit empty/loading/error runtime states. Preserve supported export versions deliberately, bump schema versions where necessary, and normalize lifecycle metadata without inventing revisions for raw cloud documents. Treat UI selections as personal preferences, not shared board content mutations.

## 6. Archive, deletion, and role contract

These are default implementation decisions, not claims about existing behavior.

### Board

- Owner/editor: create/edit where membership permits, archive, restore.
- Permanent board deletion: workspace owner only by default, clearly labeled for editors.
- Archive: reversible; retained cards, lists and comments; removed from Active boards and shown in Archived boards. Archived board content is read-only until restored.
- Restore: same identity/content/order, no new copy and no automatic restoration of cards that were independently archived.
- Delete permanently: available in both active and archived board actions to the owner; custom confirmation names board and sharing scope, shows verified descendant counts, warns no restore/undo, and requires typed board-name confirmation.
- Archiving/deleting the active or last board chooses another accessible active board or shows the honest empty manager. Other sessions converge without reload.

### List

- Owner/editor: Delete list; viewer: navigation only, no mutation.
- Empty list: still confirm named target, then permanently remove it.
- Nonempty list: confirmation explicitly includes active and archived cards and comments. Offer Cancel and Delete list and cards. An optional move-first path is acceptable but must not be required to make deletion work.
- Deleting a list permanently deletes its cards/comments through the lifecycle engine. Do not strand archived cards or claim they were preserved elsewhere.
- No list archive feature is required by this request. Do not add one as a substitute for deletion.
- A card move within a board preserves card identity/comments. List deletion must race safely with moves into/out of the list and prevent stale re-creation.

### Card

- Owner/editor: Archive, Restore, Delete permanently; viewer: inspect/search/export as allowed, no mutations.
- Archive: reversible and explicitly retained, not an alias for Delete.
- Restore: same card ID and comments, original live list where possible. If the original list is unavailable but the card was not itself deleted, require selection of a valid destination. Never create a hidden list automatically.
- Delete permanently: remove active or archived card content and all comment documents, including previously soft-deleted comments. Confirm card/board/list identity and irreversibility. No Undo or Restore entry for deleted cards.
- The card editor, archive dialog, Board view, and List view use the same command semantics.

### Confirmation/draft contract

- Use one robust custom confirmation service. Each request has its own action/target/trigger and cleared `returnValue`.
- Snapshot and clear the completed request before invoking its callback so a subsequent request is not erased. Do not let an old close handler clear or focus a new dialog.
- Dirty card -> Archive/Delete/Move must permit Save first, explicit discard, or Cancel without silently losing the draft.
- Revalidate target identity, revision, permissions, and counts at commit time. If target/counts changed since confirmation, refresh and require confirmation again rather than deleting unexpected new descendants.
- Disable repeat submission while pending. Treat double click, Enter, Escape, nested confirmation, pointer cancel and pending navigation as tested cases.
- On failure, retain or restore the proper editor/archive surface with actionable retry. Do not announce success or remove the last recovery surface before commit/readback.

## 7. Permanent deletion architecture and hard feasibility gate

### Why this needs design first

Firestore document deletion does not delete its subcollections. Current Rules intentionally retain authorization anchors and comments. Firebase recommends trusted-server handling for unbounded collection deletion. Spark/no-backend constraints mean a generic recursive client delete is not an acceptable shortcut.

**Preferred candidate under the existing no-cost boundary:** a narrowly scoped, bounded, resumable lifecycle/purge protocol for the known board/list/card/comment tree, with durable anti-recreation markers, server-enforced locks, and verified readback. This candidate must pass the Step 2 proof gate before its UI is implemented. If it cannot, stop and request a specific architecture decision; do not silently ship archive relabeled as deletion or enable a paid backend.

### Required schema inventory

Known relevant paths:

```text
workspaces/{workspaceId}                         retained authorization root
  members/{uid}                                 retained; unchanged scope
  invites/{inviteId}                             retained; unchanged scope
  boards/{boardId}                               metadata, legacy snapshot field
    lists/{listId}                               metadata
    cards/{cardId}                               listId reference; rich card fields
      comments/{commentId}                       bounded-query subcollection
  activity/{mutationId}                          immutable minimal audit metadata
```

Cards are siblings of lists beneath a board, not list subcollections. A list cascade must query cards by `listId`, not attempt deletion under `lists/{id}/cards`.

Proposed separate control metadata, finalized at the proof gate:

```text
workspaces/{workspaceId}/deletionJobs/{operationId}
workspaces/{workspaceId}/boardLifecycle/{boardId}
  deletedLists/{listId}
  deletedCards/{cardId}
```

Keep durable lifecycle markers outside the content board tree so removing a board document cannot remove the guards. Use strict exact-key schemas. Retain no card/board titles, descriptions, comments, snapshots or auth material in completed control records. Identity references, timestamps, operation state and bounded counts are sufficient.

### Required protocol

1. **Preflight:** require online server-authoritative access, current role, target revision, supported schema, known descendant collection inventory, and bounded count/size estimates. Do not interpret permission-denied as an empty collection.
2. **Confirm:** show the actual target and irreversible scope. Lock-time verification must match what was confirmed, including a contents revision or equivalent protection against descendants created since preview.
3. **Begin atomically:** create an immutable-scope deletion job/marker and transition the target to deleting, with a board-level mutation lock if needed for safe list/card cascades. Rules couple these writes using `getAfter`. A client-generated `deleting:true` without validated role/scope/revision is not authorization.
4. **Freeze:** all normal writes that could alter the target/descendant set, including comment writes, card moves, imports, old-client granular writes and parent recreation, check current and post-write lifecycle state. Do not rely on the new UI obeying the lock. A conservative temporary read-only lock for the whole affected board is preferable to an unproved narrow lock.
5. **Purge bottom-up:** page comments, including soft-deleted ones; delete comments before cards; delete scoped cards before lists; delete lists/cards before board metadata. Remove legacy cloud snapshot copies under the approved migration contract. Use a dedicated lifecycle adapter, not the generic `before/next` workspace diff.
6. **Checkpoint:** retain job progress on the server after bounded work. Re-read current role, job scope and revisions for each step. Duplicate requests and restarts are idempotent. Read every transaction dependency before any write.
7. **Resume:** a reload/new authorized session resumes an existing job. An editor's operation stops if their role is revoked; an authorized owner can take over. Closing a tab pauses work. Never claim server/background continuation when no worker exists.
8. **Verify:** use server-only reads (for example, `getDocFromServer` / `getDocsFromServer`) to confirm absence of the target payload, comment pages and all in-scope descendants/duplicate snapshots, then mark the UI operation complete. A network failure leaves verification pending. Do not trust cached snapshots, a client-owned count, or a forged `complete` flag as proof of deletion.
9. **Keep guards:** minimal permanent tombstones prohibit reuse of deleted identities and block stale clients from recreating data. They are control metadata, not retained card/board content and not a restore path. Rules and read paths must deny or safely isolate surviving partial descendants even if an authorized client stops early or lies about progress.
10. **Release lock:** only according to validated monotonic lifecycle transitions. Failed/incomplete operations remain visibly pending with owner recovery; do not strand the account behind an invisible lock.

### Rules and query proof requirements

- Workspace/account-root hard deletion stays denied. No generic recursive wildcard write grant.
- Job scope must bind exact workspace, board, entity type and target ID, permitted initiator role, operation ID, expected revision, and monotonic stage. Cannot edit a card job into a board purge or another workspace.
- Owner/editor purge rights are narrow subtree deletion rights, not a general permission to delete other users' comments outside that scope. Role is checked live, not trusted forever from job creation.
- Prevent both existing ID reuse and parent re-creation. Parent nonexistence alone is not a durable anti-recreation policy.
- Board/list/card create/update and comment create/update must validate the complete live parent chain and lifecycle guards, including changes in the **same** batch/transaction where appropriate.
- Rules cannot enumerate arbitrary collections or prove collection emptiness. Do not authorize safe finalization solely because a client writes `remaining=0`. A durable marker must make even an early/malicious parent deletion non-resurrectable and keep narrowly authorized cleanup possible, or use a server-proven bounded invariant. State the exact chosen security invariant in the ADR.
- Ensure all ordinary and recovery queries are Rules-compatible. Rules are not filters: a broad query can fail if it may return deleting/hidden records. Design lifecycle predicates, query limits, pagination, indexes and recovery reads together, and test them with the real SDK, not a fake adapter.
- Explicitly test archived parent and partial-deletion reads. Do not loosen all content reads to work around one maintenance query.
- Activity stays privacy-minimal and immutable. Add allowlisted lifecycle events with idempotent operation IDs. Document that minimal event/tombstone metadata remains after content deletion; do not copy deleted content into event text.

### Bounded work and truthful completion

- Declare hard operation bounds and work-per-resume bounds from actual Rules request-access counts, bytes, latency, and quota estimates, not an assumed large batch size.
- Existing 300-path generic-mutation guard is not proof that a deletion batch of that size is safe. Rules access-call limits may be reached earlier.
- Keep bounded comment queries; handle more than one page. Add indexes only as source artifacts until publication is separately authorized.
- Large supported jobs run in resumable chunks with progress. If a requested board is beyond qualified limits, block **before** starting irreversible work and report the exact limitation. Do not claim all-size deletion works.
- A cancelled confirmation makes zero writes. After destructive work starts, Pause is not Undo. Explain that resumption completes deletion; restoration is not promised.
- Quota exhaustion, lost connectivity, auth expiration and denial pause safely. Do not retry aggressively or convert them into success.
- Deletion removes app-managed cloud content. Previously downloaded exports, inert legacy browser copies on other devices and provider retention are not remotely erasable by this app. State this narrowly without confusing Archive with Delete.
- If this proof fails under Spark, prepare alternatives: separately authorized trusted backend/cascade infrastructure, or a consciously restricted product release. Do not select a paid plan or weaken security without Aaron's decision.

## 8. Mutation and realtime reliability foundation

Refactor `mutate()` into an awaitable command boundary or equivalent explicit completion contract before hooking up lifecycle UI.

- Return a result that distinguishes started/pending, committed, conflict, denied, offline and rejected. A boolean `true` must not mean both started and saved.
- Bind every operation to account/session generation, workspace, board, entity and expected revision. Never let a late resolution replace a different board/account or clear its pending indicator.
- Prefer updating/refetching the affected board/catalog instead of fetching every card in every workspace after each edit.
- All transaction reads precede writes. Preserve stable random mutation IDs across retries and add at most the intended idempotent activity events.
- Keep pending mutation and snapshot sequencing coherent: do not let a cached listener mark Synced before server acknowledgment; after conflict/denial force authoritative reconciliation without discarding a still-valid unsaved draft.
- Separate pre-commit failure from commit-succeeded/readback-failed. The latter is an unknown confirmation state, not permission to roll back cloud truth and create duplicates. Reconcile the operation ID before retrying.
- Archive views, board directories and open editors subscribe/reconcile after successful mutations, failures and remote events. No detached-object callbacks, duplicate restores or stale archived rows.
- Add explicit handling for remote board removal/archival. Current active-board subscription is not an account-wide board catalog and a missing board cannot just be ignored.
- Maintain a bounded metadata directory and active-board content listeners. Do not subscribe to every board's cards/comments to implement one manager. Comments stay scoped to the open card.
- Access revocation tears down all relevant listeners and prohibits queued operations after reconnect. Pending jobs require current authorization for resumption.

## 9. Layout and interaction contracts

### Persistent horizontal scroll

- Replace unrelated `calc(100vh - Npx)` minimum heights with a viewport-bounded app shell, natural-height header and `minmax(0,1fr)` board region. Use `100dvh` with fallback where appropriate.
- Apply `min-height:0`/`min-width:0` at every relevant flex/grid boundary. Board horizontal overflow must belong to the board region, not the document.
- The horizontal track lives at the visible bottom of the board region. It must remain reachable while a long column scrolls vertically, while filters are open and at resized/short desktop heights.
- Constrain each list to the available board height; its cards area scrolls vertically, while title/menu and add-card controls remain reachable. Do not hide bottom controls with `overflow:hidden` and call the layout fixed.
- Preserve native wheel/trackpad/touch/keyboard scrolling and drag autoscroll. Do not globally turn wheel events into horizontal scrolling or trap a card list's vertical wheel input.
- Prefer native `overflow-x:scroll` with reserved track space on classic-scrollbar platforms. OS overlay scrollbars can auto-hide despite CSS. If native styling cannot meet the literal always-visible requirement, provide a persistent author-rendered horizontal position control with a visible track, correct keyboard semantics and bidirectional synchronization to `scrollLeft`; do not claim `scrollbar-gutter` alone forces visibility. Avoid two competing visible scroll controls.
- With no horizontal overflow, show a disabled/empty track or clearly inactive control, without creating page overflow. Test logical endpoints and resize synchronization; a decorative scrollbar is a failure.
- List view has its own bounded vertical region and remains readable; a Board-only scrollbar does not cover its footer.
- At narrow widths/200% zoom, preserve accessible vertical reflow and reachable controls. Do not make an unusably short board by freezing an oversized toolbar; allow a deliberate responsive shell adjustment.

### Remove Start here

Remove the actual `details.collaboration-notice` disclosure containing `#start-here-copy`, its copy and exclusively used styles, plus only handlers/tests that exclusively support it. Do not remove Add card, Board/List switch, archive, keyboard shortcuts, membership navigation or useful actions merely because the guide linked to them. No substitute tutorial button is requested.

### Filters dismissal and placement

- One helper owns panel open state and `aria-expanded`.
- Outside pointer/click closes when the event path contains neither the panel nor its toggle. Do not close on the same event that opens it, and do not swallow the outside target's action.
- Clicks inside fields, selects, Clear filters and labels remain usable. Native select interactions must not close prematurely because a browser popup is not a DOM child.
- Escape closes and returns focus to Filters. Outside pointer dismissal does not steal focus back from the clicked control. Preserve sensible Tab navigation and an accurate expanded state.
- Reopening preserves applied filters; dismissing the panel never clears filters or mutates board data.
- Align to the left edge of the left-positioned trigger or use collision-aware placement. Clamp horizontally and vertically within the viewport at desktop/narrow widths, zoom and short heights.
- Ensure list/menu/dialog overlays are not clipped by the new board scroll container. A viewport-height fix must not trade scrollbar access for clipped menus.
- Centralized outside-dismiss logic must not accumulate listeners on rerender or conflict with Board actions/list menus.

## 10. Source, runtime, and cost budgets

Measured current checkout:

- Raw source: **272,829 / 300,000 bytes**.
- `index.html`: **26,777 / 27,250 bytes**.
- Existing dist, not rebuilt during planning: initial shell **26,100 / 26,250 gzip bytes**, first-party lazy **57,940 / 58,000 gzip bytes**.
- Historical configured release measurement: shell **26,166 / 26,250**. Rebuild to establish the implementation baseline.

The lazy cap is effectively full. Start by removing the obsolete duplicate chooser/normal local workflows and consolidating repeated mode orchestration while retaining lazy legacy import/recovery. Measure actual semantic savings, not projected file sizes or CRLF-to-LF changes. Do not delete a module still required by a safety path.

- Keep appearance and other optional component styles lazy under the current classifier; static CSS imports can become shell CSS.
- Register new reachable production modules in the source manifest and syntax/static checks. Audit per-file caps as well as total/gzip limits.
- Do not silently raise caps, hide new modules from accounting, obfuscate source, shorten essential warnings or remove accessibility to make a pass.
- If removal cannot fund the qualified scope, produce a measured cap-transition proposal with configured/unconfigured output, runtime load, maintenance margin and exact benefit; pause for approval.
- Preserve memory-only Firebase behavior and bounded listeners. Do not fetch the complete account's card/comment history to render a board directory.
- Estimate reads/writes/deletes, dependent Rules reads, retries and activity writes for migration and cascade fixtures. Test at/beyond the declared bound. Keep paid features out; quota exhaustion is a visible recoverable state, not a hidden upgrade.

## 11. Implementation sequence

### Step 1 of 13 - Pin the baseline and add reproductions

**Accomplishment:** a reproducible defect ledger and verified starting point.

- Verify repository status and exact current main. If it differs from the audited SHA, inspect the delta and amend affected findings before coding.
- Create a local feature branch such as `sol/cloud-first-debugging` and `FLOWBOARD_CLOUD_FIRST_PROGRESS.md`. Preserve these planning artifacts; no push.
- Inventory all local-mode checks, chooser triggers, mutators, lifecycle handlers, initialization assumptions, Rules/static guards, documentation and tests.
- Add failing/expected-failure tests for scrollbar geometry, outside Filters dismissal/placement, cloud list denial, cloud Delete-as-Archive, dirty nested confirmation, archive rollback, and empty last-board behavior. Mark intentional-policy changes explicitly.
- Run baseline unit/static/build/budget and existing Emulator/browser/a11y gates using approved local tooling. Missing binaries are a blocker, not a historical pass.

**Pass:** fresh baseline results with exact commands/counts; source-confirmed defects separated from reproduced failures; no production access.

### Step 2 of 13 - Prove the cloud and deletion architecture

**Accomplishment:** a concrete approved-scope ADR plus executable security/feasibility proof.

- Document one-manager/multiple-security-containers behavior, new runtime state machine, permissions, schema versions, migration invariants and personal workspace bootstrap.
- Specify lifecycle markers, job scope, query shapes/indexes, snapshot removal, no-resurrection rules and empty states.
- Prototype the deletion protocol in Emulator-only tests: a card with multiple pages of comments, a list with active/archived cards, and a board with retained legacy snapshot content; include interrupted/resumed purge and malicious scope changes.
- Prove direct forbidden writes, same-batch lock bypass denial, old-client behavior, and query viability. Address Rules call limits at tested chunk sizes.
- Produce measured source-budget allocation and runtime/read-cost estimates.

**Pass:** actual SDK/Rules proof of safe supported deletion, not a sketch or fake adapter; bounded limits documented. **Stop gate:** unprovable cascade safety, need for backend/billing, or unfunded caps requires Aaron's decision before dependent work. Do not spend later steps building a delete button over an unproved primitive.

### Step 3 of 13 - Cloud-only session bootstrap and empty states

**Accomplishment:** signed-in cloud runtime with no normal local fallback.

- Split auth/session orchestration from board rendering; wait for auth before selecting data.
- Implement idempotent personal scope bootstrap and discovery, account-scoped selection, signed-out/loading/offline/error/access-lost states.
- Remove normal `loadState()` seeding and sign-out/access-loss return-to-local behavior from the cloud runtime; retain inert recovery access.
- Make render/projection/controller paths safe without an active board. Do not use normalization to invent a board.

**Pass:** two concurrent first-login contexts yield one personal scope; reload/cross-device selection works; sign-out and account changes clear data/listeners; offline/config failures never write local tasks; legacy bytes unchanged.

### Step 4 of 13 - Safe legacy migration and schema upgrade

**Accomplishment:** old data can be brought forward without loss or accidental sharing.

- Implement the two separate migrations in Section 5 with count/content verification, retry identity, explicit destination and owner controls.
- Normalize old active/archived records into the lifecycle schema, preserving comments and rich fields.
- Safely remove duplicate legacy cloud snapshots under the owner-approved conversion flow; no permanent-delete readiness flag before verification.
- Preserve access to archived backend scopes and interrupted migration recovery inside the future manager.
- Update export/import handling for the new schema and deny malformed/unapproved replacements. Exported comment history must not become forged live comments on import: preserve it as clearly labeled imported history with original provenance, or qualify a separate narrow restore contract. Never relax author identity checks to impersonate the original author.

**Pass:** fixtures for no legacy data, v1-v5 exports, malformed data, duplicate names/IDs, verified granular, snapshot-only, interrupted migration, archived data, failure/retry and account switch; no double upload or raw local payload changes.

### Step 5 of 13 - Unified My workspace directory

**Accomplishment:** the familiar board manager is the only normal entry point.

- Replace separate cloud/local chooser routes with one shared controller/view rooted in My workspace.
- List paginated accessible board metadata with composite IDs, role labels, active/archived sections, scoped creation and search.
- Remove obsolete normal Copy local workspace / Return to local / Open cloud mode controls; retain explicit legacy recovery as a secondary flow.
- Route Account/status/Boards entries to the same manager without duplicate initialization. Make Members and invite flows target the selected board's real scope.
- Open a board with one action, close the modal visibly, and return focus correctly.

**Pass:** multiple containers and same-named boards work without cross-scope data leakage; missing/revoked directory entries do not break other boards; no second Cloud workspaces menu; no unnecessary full-card fetch per directory refresh.

### Step 6 of 13 - Reliable command, confirmation and lifecycle engine

**Accomplishment:** one trusted completion boundary for every affected operation.

- Implement the awaitable mutation/result model, operation generation guards and authoritative reconciliation.
- Repair confirmation reentrancy, stale returnValue and dirty-draft flows before wiring permanent delete.
- Implement the qualified lifecycle adapter/job resumption from Step 2, plus narrow Rules and bounded queries.
- Replace generic diff deletion with explicit commands. Keep code organized into purpose-specific lazy modules rather than further overfilling the existing Firebase adapter.
- Preserve all-reads-before-writes, idempotency, current role checks and minimal activity.

**Pass:** late responses after account/board changes are ignored; commit/readback ambiguity reconciles safely; nested confirmations execute exactly once; failure retains the correct draft/surface; all negative direct-write tests pass.

### Step 7 of 13 - Board archive, restore and permanent deletion

**Accomplishment:** complete board lifecycle in My workspace.

- Add row More actions and Archived boards view, correct role controls and explicit counts.
- Implement archive/restore via revision-aware commands and permanent deletion via the lifecycle engine.
- Handle active/last board, multiple sessions, stale selected board, empty directory, and typed-confirmation mismatch.

**Pass:** archive/restore preserves identities and independently archived cards; delete removes verified cloud descendants/snapshots with no Restore/Undo; viewer/editor boundaries match the role contract; remote sessions converge.

### Step 8 of 13 - Working list deletion

**Accomplishment:** Delete list works safely in cloud boards.

- Replace the disabled placeholder and cloud refusal with the tested delete command for eligible roles/states.
- Confirm all descendants, including archived cards and comments, and use the correct sibling-card query by listId.
- Reconcile list counts/order, card editor, drag/move targets and active views after commit. Do not leave orphan cards/comments or renumber unrelated lists destructively.

**Pass:** empty/nonempty/last list, archived children, multi-page comments, concurrent move/create, failed/resumed purge, viewer denial and reload/cross-session absence tested. Unrelated lists remain unchanged.

### Step 9 of 13 - Reliable card archive, restore and delete

**Accomplishment:** three distinct card lifecycle operations work in every entry point.

- Remove cloud Delete-as-Archive substitution.
- Add permanent delete to editor and archive entries; explicit restore destination when needed.
- Refresh archive entries after success/failure/remote changes, not optimistically only; keep failed operations actionable.
- Fix dirty card -> discard -> second confirmation, double clicks and stale found-object references.

**Pass:** active/archived card, clean/dirty draft, Save first/Discard/Cancel, Escape, failure, role downgrade, conflict, double submission, reload, multiple pages of comments and cross-session convergence. No deleted content remains in live cloud snapshots or returns through migration retry.

### Step 10 of 13 - Viewport-bounded board and persistent horizontal scrolling

**Accomplishment:** scrolling is visible/reachable without page-bottom navigation.

- Implement the Section 9 shell/board/list scroll ownership.
- Preserve Board/List views, add-card composers, long-column vertical scroll, menu overlays, drag autoscroll and keyboard focus scrolling.
- Qualify native scrollbar visibility and implement the accessible persistent fallback where required by OS overlay behavior.

**Pass:** DOM geometry and actual interaction tests at 1280x720, 1440x900, 1920x1080, resized 960x720, short-height and narrow/zoom variants. A horizontal-overflow fixture reaches both ends without changing document scrollTop; the last card and add-card control remain reachable.

### Step 11 of 13 - Remove Start here and finish Filters behavior

**Accomplishment:** the unnecessary guide is gone and Filters behaves like a dismissible panel.

- Remove the guide's runtime markup/styles/listeners; keep necessary functional controls.
- Add one outside-dismiss owner, focus-safe Escape/toggle behavior and viewport-safe panel placement.
- Ensure the new scroll containers do not clip menus or eat outside target clicks.

**Pass:** no Start here in live DOM/accessible names; no orphan listener errors; mouse/touch outside closes, inside select interaction remains open, reopening preserves filters, Escape returns focus, and panel bounds stay inside viewport.

### Step 12 of 13 - Full local qualification and security regression

**Accomplishment:** final source passes the complete validation matrix below.

- Run all constituent gates on the final source after the last fix, not historical commits.
- Replace obsolete local-first product tests with cloud-first assertions, preserving independent legacy-data safety tests.
- Include built-preview unconfigured (honest unavailable UI) and synthetic-configured routes, plus actual SDK/Auth/Rules Emulator workflows.
- Audit real markup in light/dark themes, active/archived/empty/pending/failure states. No fake modal body can substitute for production geometry.
- Re-measure all source/shell/lazy/per-file budgets; inspect console/page errors and perform a three-sample 1,000-card desktop benchmark.

**Pass:** all required positive/negative cases have actual evidence; budgets pass; accessibility score 1 and zero failed audits on the sign-in shell AND loaded app/dialog states via suitable automation; no production test artifacts in build; no protected-account access.

### Step 13 of 13 - Package the verified local release candidate and stop

**Accomplishment:** a precise implementation result and future release handoff.

- Write `artifacts/cloud-first/release-candidate/README.md`, `MANIFEST.json`, `SCREENSHOT_INDEX.md`, a migration guide and release/cutover checklist.
- Record exact source commit, evidence/package commit, Rules/index identities, final counts, schema transitions, supported purge bounds, retained metadata, budget headroom and limitations.
- Include migration rollback limits and compatibility matrix for old/new clients versus old/new Rules.
- Clean only owned preview/Emulator/browser processes and disposable artifacts. Preserve pre-existing tools/servers. Verify worktree and tracked files.
- Report completion with the local candidate location, not a live-deployment claim. Stop for Aaron's explicit release authorization.

**Pass:** every requirement maps to a verified test/artifact; no push, PR, merge, Rules/index publication, production data migration or real-account acceptance occurred.

## 12. Validation matrix and commands

### Unit/domain/adapter cases

- Empty workspace stays empty; no seed resurrection after deleting/archiving last board.
- Schema upgrades preserve IDs, ranks, revision metadata, lifecycle, card fields and legacy backups.
- Composite board identity and deterministic import retry mapping.
- Lifecycle state machine, immutable job scopes, replay/idempotency and expected revisions.
- Command success versus pending/failure/unknown readback and account generation cancellation.
- Archived board vs archived card semantics; local UI preferences never mutate cloud content or legacy bytes.

### Rules and real SDK Emulator cases

- Anonymous/non-member/cross-workspace denial, viewer mutations denied, role-specific board/list/card lifecycle.
- Valid bootstrap coupled root/member/profile transaction; competing contexts; forged personal pointer does not grant access.
- Normal edit/create/assignment/comment paths denied under archive/deletion locks where required.
- Same-batch lock/parent deletion + child create, scope widening, marker removal, ID reuse, forged complete/count fields and old-client bypass denied or rendered permanently non-resurrectable by the chosen invariant.
- Existing and nonexistent parents, wrong listId/boardId, missing metadata, stale revisions, reassignment/move race.
- Bounded queries allowed, over-limit/unbounded queries denied; all proposed indexes used in tested shapes.
- Purge active and archived descendants, multiple comment pages, legacy snapshot copy, batch/chunk boundary and over-bound rejection.
- Disconnect/reload/role revocation/owner takeover mid-job; closed tab does not falsely complete work.
- Server absence verification after success; minimal audit/tombstones retained and ordinary content inaccessible during interrupted jobs.

### Browser and multi-context cases

- First login, two-tab bootstrap, sign-out/sign-in, different account, config failure, offline reconnect, invitation acceptance/deep link and revoked access.
- One manager; no local editor or separate cloud chooser; role/read-only navigation; creation defaults/private-vs-shared target.
- Board/card archive and restore; board/list/card permanent delete; active/last/empty/missing-parent cases.
- Dirty nested confirmation, stale returnValue, outside cancel, keyboard Enter/Escape, pending close/switch, duplicate click, failed commit and failed readback.
- Archive list refreshed on rollback; dialogs close only according to outcome; restore/delete target cannot drift after directory rerender.
- Persistent horizontal control with many columns and very long card lists; last list reached from scrollTop=0; wheel/trackpad/touch/keyboard and drag autoscroll.
- Filter inside/outside/toggle/Escape behavior, placement, focus return, applied filters retained, no persistence writes.
- Real light/dark markup at desktop matrix, 320/390px narrow, short height, 200% zoom, reduced motion, forced colors, coarse pointer and visible focus.

### Baseline commands, adapted only where the new contract requires it

Use native Windows `npm.cmd` / `npx.cmd` from the repository. Verify prerequisites before execution; any package/cache install must stay in the allowed vault or receive an explicit exception.

```text
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run measure:mvp-v2
node scripts/validate-test-isolation.mjs
npm.cmd run test:rules
npm.cmd run test:emulator-browser
npm.cmd run validate
git diff --check
```

- Start an owned strict-port built `dist` preview; do not silently reuse a pre-existing port. Use `/UH-Flowboard/` as the base path.
- Run `tests/browser-smoke.spec.mjs` against that built preview, not source-mode Vite. The Emulator shell remains test-only.
- Current CI pins `@playwright/test@1.55.0`, `lighthouse@12.8.2`, and `firebase-tools@15.25.1`. Confirm exact prerequisites and package policy before installing. Playwright was absent during planning; do not pretend it is available.
- If needed, use the verified system Chrome path with `PLAYWRIGHT_EXECUTABLE_PATH`; no normal browser profile. Avoid unapproved user-cache browser downloads.
- Run configured and unconfigured builds separately with synthetic public configuration, never real config in artifacts. An unconfigured cloud-only build must show a truthful unavailable screen, not silently pass the old local app tests.
- Expand `package.json` checks, adapter-contract tests, source manifest, static validators and CI to cover new modules/tests. Maintain test asset isolation.
- Do not count a fake-adapter UI test as multi-user authorization evidence. Do not count a Lighthouse pass on an empty sign-in screen as an audit of loaded boards/dialogs.
- Report actual test counts at execution time. This plan does not prescribe a passing count that can be met by deleting tests.

## 13. Later production cutover, not authorized now

This release changes Rules/schema and cannot simply repeat the last CSS-only deployment.

1. Pin the final candidate, Rules/index files and full compatibility matrix. Verify the current live release again before touching production.
2. Prepare exports and an owner-operated migration preview for explicitly approved data; never bulk-convert the protected workspaces as an agent fixture.
3. Obtain separate approval for Rules/index publication and its operational route. Publish exact source-controlled files; verify active revision and required index readiness. Pages deployment does not publish Rules.
4. Test old-client/new-Rules and new-client/old-Rules behavior in Emulators before release. If old clients cannot safely coexist, use a verified maintenance/version gate and clear reload message, not silent loss or denied writes masquerading as success.
5. Release the client through the repository's PR/check/main validation/Pages gate for the exact commit SHA. Verify deployment record and anonymous live sign-in shell.
6. Run separately approved real owner/editor/viewer/non-member acceptance on newly created disposable fixtures. Validate direct API authorization as well as UI. No auth tokens or verbose document logs through Discord.
7. Execute explicit owner-approved migration/import for real legacy data only after the candidate passes. Keep exports and a redacted count/content verification report.
8. Roll back UI only to a version tested against the active schema/Rules. Never restore permissive old Rules around deletion jobs/tombstones, and never resurrect deleted payloads from legacy snapshots as a rollback mechanism.

A client rollback cannot undo a completed permanent delete. Archive is the reversible option. Unfinished purge jobs must remain safely discoverable/resumable even if the main UI is rolled back; prepare a compatible local repair/recovery path, not administrator data edits disguised as user authorization testing.

## 14. Source map for the implementer

- `index.html`: two chooser dialogs, guide, Filters, card/archive/confirmation forms, current static copy.
- `styles.css`: app shell, board/list/card scrolling, guide, menus, Filters, modal geometry.
- `app.js`: bootstrap/render/mode handling; `mutate`, `board`, `listMarkup`, `deleteList`, `renderWorkspaceList`, `showArchive`, `requestConfirmation`, `runCardAction`, `cardAction`, lifecycle handlers and `FlowboardApp` bridges.
- `state-core.js`: schema v5, normalization, empty seeding, card/list/board archive fields, drafts and pure movement.
- `src/main.js`, `src/runtime-bootstrap.js`: adapter and auth/controller initialization.
- `src/auth-ui.js`: mode-specific Account copy/actions and session transitions.
- `src/cloud-workspace-ui.js`, `src/workspace-lifecycle-ui.js`: old chooser, two migrations, retained-workspace recovery; remove only after replacement.
- `src/cloud-sync-controller.js`: listener lifecycle, reconnect, status, access-loss fallback.
- `src/adapters/firebase-workspace-adapter.js`, `adapter-contract.js`: expose/test new commands without leaking SDK internals.
- `src/adapters/firebase-cloud-workspace.js`: discovery, full-workspace fetch, revisions, generic diff, migrations, comments, membership and realtime subscriptions. Split new lifecycle work into a dedicated module.
- `src/granular-workspace.js`: document mapping and rehydration; lists and cards are sibling subcollections.
- `src/adapters/local-workspace-adapter.js`: preserve legacy raw data/recovery and separate UI preferences; no normal cloud-content persistence.
- `src/invite-ui.js`, `members-ui.js`, `cloud-roster-ui.js`, `assignment-ui.js`, `comments-ui.js`, `activity-ui.js`: active-scope listeners, role/draft/pending-state transitions, direct membership assumptions.
- `src/list-view-ui.js`, `board-view-model.js`, `quick-add-ui.js`, `appearance-ui.js`, `ui-preferences.js`: read-only/empty/cloud command integration and presentation preference isolation.
- `firestore.rules`, `firestore.indexes.json`: source-controlled server contract; publication separate.
- `tests/browser-smoke.spec.mjs`, `tests/firestore-rules.test.mjs`, `tests/emulator/`, domain/adapter suites: add regressions rather than deleting inconvenient guards.
- `scripts/source-budget.mjs`, `scripts/measure-mvp-v2-budgets.mjs`, static validators, isolation guard and `.github/workflows/validate.yml`: remeasure/requalify the new architecture.

## 15. Definition of done

All requested behavior is implemented and evidenced locally; every named deletion is real within the documented app-managed cloud scope and no permanent operation is mislabeled archive; legacy data is safe; the normal product has no editable local mode; all roles/realtime/drafts/queries pass; the scrolling/filter/guide defects are fixed; source/runtime/cost boundaries hold; and the final candidate is packaged without production side effects.

If any gate remains blocked, say exactly what remains, with evidence and the needed decision. A partial menu redesign, an enabled but Rules-denied Delete button, or a green unit suite alone is not completion.

## Links

- [[FLOWBOARD_CLOUD_FIRST_IMPLEMENTATION_HANDOFF]]
- [[artifacts/cloud-first-planning/AUDIT]]
- [[FLOWBOARD_VISUAL_CLEANUP_PLAN]] (historical presentation baseline, not the current persistence contract)
- Firebase delete semantics: https://firebase.google.com/docs/firestore/manage-data/delete-data
- Firebase Rules conditions and query constraints: https://firebase.google.com/docs/firestore/security/rules-conditions
- Firebase quotas: https://firebase.google.com/docs/firestore/quotas
