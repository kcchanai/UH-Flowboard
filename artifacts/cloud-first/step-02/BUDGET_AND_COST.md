# Step 2 budget and quota allocation

## Measured baseline

- Raw production source: 272,829 / 300,000 bytes, 27,171 bytes headroom.
- Synthetic-configured shell: 26,155 / 26,250 gzip bytes, 95 bytes headroom.
- First-party lazy graph: 57,940 / 58,000 gzip bytes, 60 bytes headroom.
- `index.html`: 26,777 / 27,250 bytes, 473 bytes headroom.

No cap transition is authorized. Feature code cannot simply be appended.

## Measured semantic-removal candidates

Current raw file/markup sizes, not guaranteed savings:

- `src/cloud-workspace-ui.js`: 12,971 bytes.
- `src/workspace-lifecycle-ui.js`: 4,036 bytes.
- `src/cloud-workspace-style.js`: 1,832 bytes.
- Old cloud migration dialog markup: 1,389 bytes.
- Old Cloud workspaces dialog region: 4,687 bytes.
- Start here disclosure: 499 bytes.
- `app.js`: 62,564 bytes, including normal local persistence/recovery/import paths that can be extracted or removed from the initial app.

The existing built lazy chunks for cloud chooser + lifecycle + chooser style consume about 5.4 KB gzip. They will be replaced, not retained beside a new manager.

## Allocation decision

Implementation must first remove/consolidate:

1. The duplicate Cloud workspaces chooser and its open/return-local orchestration.
2. Normal local-mode persistence, seeding and mode-switch copy in the initial app.
3. Start here markup/styles.
4. Duplicate lifecycle render logic by making the unified directory own board/workspace rows.
5. Local recovery/import implementation from the initial app into an explicit lazy legacy-recovery module.

Target after all replacements:

- Configured initial shell at or below 25,500 gzip bytes, leaving at least 750 bytes maintenance headroom.
- First-party lazy graph at or below 57,500 gzip bytes, leaving at least 500 bytes headroom.
- Raw source below 300,000 and each tracked per-file cap.
- `index.html` below 27,250 bytes with meaningful headroom after old-dialog removal.

These are release targets in addition to the existing hard caps. If measured semantic removal cannot fund the required safety code, stop with a quantified cap-transition proposal rather than hiding files or weakening copy/tests.

## Deletion operation cost model

For one entity operation:

- Start: 3 writes for board deletion; 4 writes for list/card deletion.
- Per target card under list/board: one immutable tombstone write.
- Per comment: one read through pagination and one delete.
- Per card/list/board payload: one delete.
- Completion: 2 writes for board; 3 writes for list/card.
- Server verification adds bounded reads and never trusts local cache.

Purge chunks use at most 10 comment deletes. Card/list enumeration pages use at most 25 reads. Each chunk reuses job/membership/tombstone documents in Rules and passed the Emulator access-call limits in the Step 2 proof.

At the proposed 1,000-card/10,000-comment board cap, worst-case deletion is intentionally expensive but remains below the daily Spark delete quota only if no competing workload consumes it. Preflight must estimate operations, compare against the product safety threshold, and explain that quota exhaustion pauses the job. The client must not hammer retries.

No TTL, backup/restore service, Cloud Function, Admin SDK or paid bulk-delete service is used.

## Index decision

Lifecycle-aware board and list queries use their single-field `lifecycleState` indexes. Active card reads and listeners are scoped by both `listId` and `lifecycleState`, so `firestore.indexes.json` now declares that source-controlled composite card index. The index has only been qualified locally in Emulators and build/static checks. Publishing it remains a separate production authorization gate.
