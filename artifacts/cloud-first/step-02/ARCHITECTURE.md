# ADR: Cloud-first runtime and bounded lifecycle deletion

Status: accepted for local implementation proof

Scope: client + Firestore Rules on Firebase Spark; no production publication

## Decision

Flowboard will present one **My workspace** board directory while retaining existing Firestore workspace documents as authorization containers. A board identity is always the tuple `(workspaceId, boardId)`. The UI may visually aggregate boards, but it never merges memberships, roles, invitations, ownership, or Firestore paths.

Normal task content is cloud-only. Browser storage remains limited to UI preferences, account-scoped selection hints, and an inert legacy-recovery source. Signing in never uploads legacy data. Signed-out, unavailable, offline, empty, and access-lost states are honest product states rather than fallbacks to an editable seeded board.

Permanent entity deletion uses a known-tree, bounded, resumable client protocol. It is not generic recursive deletion:

- `workspaces/{workspaceId}/deletionJobs/{operationId}` records immutable scope plus monotonic state.
- `workspaces/{workspaceId}/boardLifecycle/{boardId}` serializes one active board operation and permanently prevents board-ID reuse.
- `deletedLists/{listId}` and `deletedCards/{cardId}` under the lifecycle document are immutable tombstones.
- A board is conservatively locked while a job begins. Normal descendants cannot be written in the same batch or while locked.
- Payload deletion is bottom-up and paged: comments, card, list, then board.
- Workspace roots, members, invites and ownership anchors are never deleted by this lifecycle.
- Server-only readback, not a client progress counter, determines UI completion.

## Security invariant

Rules do not and cannot prove that a collection is empty. Therefore a client-written `complete` state is never authorization evidence.

Safety instead depends on durable identity guards:

1. A card tombstone immediately denies normal reads, creates, updates and ID reuse for that card. The authorized current owner/editor may still read and purge its retained payload through the matching immutable job.
2. A list tombstone denies normal access and ID reuse for that list and every card whose `listId` points to it, including cards not yet individually tombstoned.
3. A board lifecycle document survives board deletion and prevents board-ID reuse. If the board parent disappears early, matching owner-only maintenance reads and deletes remain possible for descendants.
4. Premature client completion can pause or strand cleanup, but it cannot expose the target, recreate its identity, widen its scope, or delete another scope. Authorized users can resume a completed-marked job.
5. Current membership is checked on every maintenance operation. Revoking an initiating editor immediately stops that editor; the current owner can take over.

This is the practical no-backend alternative to server recursive deletion. The client must describe closing the tab as pausing work, never background completion.

## Deletion roles

- Board permanent deletion: workspace owner only.
- List/card permanent deletion: current owner or editor.
- Viewers: no lifecycle writes or maintenance reads.
- Workspace/account deletion: denied.

## Schema version 1

### Deletion job

Exact keys:

- `schemaVersion: 1`
- `operationId`
- `boardId`
- `targetType: board | list | card`
- `targetId`
- `initiatorUid`
- `state: deleting | complete`
- `expectedRevision`
- `createdAt`, `updatedAt`
- `revision`

Target, initiator and timestamps are not mutable. `complete` is a UI/checkpoint hint only.

### Board lifecycle control

Exact keys:

- `schemaVersion: 1`
- `boardId`
- `state: deleting | active | deleted`
- `operationId`, `targetType`, `targetId`, `initiatorUid`
- `startedAt`, `completedAt`
- `revision`

The document is immutable except for a validated new operation transition or completion transition. It cannot be deleted.

### Tombstones

List tombstone keys: schema version, type, board/entity IDs, operation ID, actor UID and server creation time.

Card tombstones add the stable `listId`, allowing cleanup even after a parent list/card disappears. Tombstones cannot be updated or deleted and contain no title, body, comment, email or presentation payload.

## Start/finish shape

Starting a job atomically:

1. Increments and locks the board document with the operation ID.
2. Creates the immutable-scope job.
3. Creates/advances the board lifecycle control.
4. Creates the target list/card tombstone when applicable.

Every participating Rules branch cross-checks the post-batch job, control and board. A same-batch normal content write observes the post-batch lock and is denied.

Finishing list/card cleanup atomically advances job/control and unlocks the board. Finishing a board job requires the board document to be absent and leaves lifecycle state `deleted`. Rules deliberately allow authorized cleanup after an early finish because target tombstones still deny ordinary access.

## Known tree and purge order

```text
workspaces/{workspaceId}
  boards/{boardId}
    lists/{listId}
    cards/{cardId}
      comments/{commentId}
  activity/{activityId}
  deletionJobs/{operationId}
  boardLifecycle/{boardId}
    deletedLists/{listId}
    deletedCards/{cardId}
```

Cards are siblings of lists. List cleanup queries cards by exact `listId`. Comments are the only known content subcollection beneath cards. New descendant collections require an ADR/Rules/protocol update before they can ship.

Legacy board `snapshot` fields are duplicate content. Rules deny list/card deletion while `snapshot` remains. Verified migration must remove that duplicate first. Whole-board deletion may proceed because deleting the board document removes its snapshot payload.

## Query and batch bounds

- Comment list/read page: at most 25, purge batch: 10 deletes.
- Card/list metadata page: at most 25.
- Tombstones: one card/list identity per write in the first implementation. Later batching requires a separate measured Rules-call test.
- Parent deletion and lifecycle checkpoint writes occur separately from comment pages.
- One active deletion operation per board.

Proposed product-level v1 preflight caps, to be implemented and boundary-tested before release:

- 100 lists per board.
- 1,000 cards per board.
- 10,000 comments per board.
- 500 comments per card.

The protocol remains paged, but targets beyond a declared cap are rejected before lock. These totals are not represented as trusted Rules counters. A pure preflight limit test plus repeated-page Emulator tests qualify the client cap; security does not depend on the totals being honest.

## Runtime state machine

- `auth-resolving`
- `signed-out`
- `cloud-unavailable`
- `provisioning-personal-scope`
- `directory-loading`
- `empty`
- `board-loading`
- `active-owner | active-editor | active-viewer`
- `offline-stale-read-only`
- `saving`
- `conflict`
- `access-lost`
- `deletion-pending | deletion-resuming`

No state transitions to an editable local workspace. Account/session generation invalidates late operations and listeners.

## Personal scope bootstrap

A self-only profile pointer `personalWorkspaceId` selects the default private owner container. It is a discovery hint, not authorization. The client transaction reads the current profile pointer; if absent, it atomically creates workspace root, owner membership and pointer. Competing tabs conflict and converge on the winner. A stale pointer triggers membership-backed rediscovery, never name matching or silent overwrite.

The user profile Rules will be narrowed during Step 3 to validate pointer/bootstrap transitions and preserve invite acceptance behavior. Every board open/mutation still checks current membership.

## Migration invariants

- Browser legacy import is explicit, previewed, deterministic per operation ID, backup-first and imported as new boards.
- Raw legacy keys are never rewritten by sign-in, UI preferences, cloud actions or failed migration.
- Snapshot-to-granular conversion is owner-only, idempotent and verified by stable fields/fingerprints, not counts alone.
- Comments are separately paged/exported. They are not present in the in-memory workspace JSON.
- Legacy free-text assignees remain labels until deliberate UID mapping.
- Deleted identities are never regenerated from a legacy snapshot or retry map.

## Directory and realtime

The directory fetches bounded board metadata per authorized workspace and uses composite tuple keys. Active/archived sections are partitioned from bounded metadata pages without subscribing to every card/comment collection. Only the active board's board/list/card documents and open card comments receive live listeners.

## Failure semantics

- Cancel before job start makes no writes.
- Closing the tab after start pauses and exposes a resumable job.
- Network/authorization failure never becomes success.
- Commit succeeded but readback failed is `verification pending`; retry reconciles the operation ID.
- Revocation stops current actor cleanup immediately.
- Tombstones and minimal lifecycle metadata remain after payload deletion by design.

## Post-review visibility hardening

Every board, list, and card now carries a server-visible `lifecycleState`. Normal collection reads must query only `active` records. Card queries are additionally scoped to currently active list IDs. Starting a board/list/card deletion changes the target lifecycle field in the same coupled write that creates its tombstone and job. Therefore a client cannot expose a snapshot-bearing board, residual list, or residual card through a normal collection query after the deletion lock starts.

Exact maintenance reads remain available only through the immutable job/tombstone scope and current role. A board-root read uses lifecycle-aware `get` authorization rather than the workspace-only read rule. Generic board updates cannot add, replace, or remove `snapshot`, `lifecycleState`, or `activeDeletionJobId`; list/card generic updates likewise cannot change their lifecycle fields. Owner-verified migration is the only future route for scrubbing legacy snapshots.

## Rejected alternatives

- Generic client recursive delete: unsafe and unbounded.
- Cloud Functions/trusted backend: not authorized under Spark/no-cost scope.
- Archive relabeled Delete: contradicts the product request.
- Client remaining-count as proof: forgeable and impossible for Rules to validate by enumeration.
- Parent-first delete without durable guard/recovery: can orphan or re-expose descendants.
- Merge all Firestore workspaces: breaks existing security/membership boundaries.
