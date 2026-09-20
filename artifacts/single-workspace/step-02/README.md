# Step 2 of 10: Account-home contract and budget

## Contract locked for implementation

### Account-home state

- `auth-loading`: show `Loading your boards...`; no editable content and no workspace choice.
- `signed-out`: show Sign in; do not inspect or upload browser-local content.
- `loading`: resolve `users/{uid}.personalWorkspaceId` and its owner membership/root contract.
- `cloud` or `cloud-preview`: open a selected board while retaining its internal `(workspaceId, boardId)` identity and role.
- `empty`: a verified account home with no active boards; show New board and Create your first board.
- `setup-recovery`: an established pointer is missing, inaccessible, archived, transferred, malformed, or incompatible. Preserve it, show Retry and authorized recovery, and never silently select another scope or create a replacement.
- `partial`: some legacy/shared directory scope is unavailable; show available boards plus an explicit Older boards need attention notice. Do not claim all metadata is synchronized.
- `offline` and `access-lost`: stop cloud mutations/listeners honestly, clear confidential prior-account state, and retain only the documented local recovery boundary.

### Account-home invariant

- A missing pointer creates one new empty personal root, owner membership, and profile pointer atomically, even when `workspaceIds` already contains shared or stale hints.
- A valid pointer is reused only after root, owner membership, `personal == true`, `status == ready`, and verified migration are checked.
- An established pointer is not cleared, replaced, adopted, unarchived, upgraded, transferred, or deleted by routine bootstrap. Any pointer repair is a separate future recovery decision.
- The profile transaction coordinates competing first-login contexts. The operation candidate is generated once outside transaction retries.
- Existing `workspaceIds`, memberships, invitations, legacy roots, and raw browser-local data remain unchanged by automatic setup.
- New boards always target the verified canonical personal home, never the currently selected shared/read-only scope.

### Rules implications to implement and qualify locally

- Preserve current deny-by-default membership and board authorization.
- Narrowly bind first pointer assignment to the atomic root/member transaction.
- Reject ordinary updates that clear, delete, or replace an established nonempty personal pointer. Test null, empty string, field deletion, and another owned scope.
- Preserve legitimate hints-only profile updates used by invitation acceptance and self-leave when the pointer is unchanged.
- Do not claim global physical singleton enforcement or scan all workspaces. Legacy/shared root creation remains a separate authorization path.
- No Rules publication is part of this implementation phase.

## Normal-navigation control map

| Existing surface/control | New normal role | Recovery or removal decision |
| --- | --- | --- |
| `#boards-button` | Opens `Your boards`, with Active boards, Archived boards, search, and New board | Keep visible and labelled |
| `#cloud-status` | Opens the same board manager and reports truthful selected-board sync/role state | Keep as status plus board-manager trigger |
| `#open-cloud-workspaces` | Opens the same board manager from Account | Keep as Account board shortcut, remove workspace wording |
| `#workspace-dialog` / `#workspace-heading` | Board manager dialog titled `Your boards` | Retain one dialog/controller; no workspace selector |
| `#workspace-search` | Searches loaded board titles and documented scope subtitles | Rename visible label/placeholder to board language |
| `#workspace-board-list` | Active board results | Keep; use composite backend identity internally |
| `#archived-board-section` / `#archived-board-list` | Archived board results | Keep; owner rows expose only Restore and Delete permanently |
| `#new-board-form` / `#new-board-title` / `#board-template` | Persistent New board form and first-board empty-state form | Keep one submit path; never hide solely because no active board exists |
| `#legacy-spaces-section` / `#legacy-spaces-list` | No longer rendered in ordinary board navigation | Move to explicit Account > Data recovery route |
| `#migrate-cloud-workspace` | Owner-only legacy-container upgrade after backup and verification | Data recovery only; never board Restore or automatic bootstrap |
| `#export-cloud-workspace` | Complete legacy/cloud backup route | Data recovery only; retain safety wording |
| `#open-workspace-members` | Sharing for the selected board's underlying scope | Reachable from selected-board Account/Sharing context, never a workspace picker |
| `#view-cloud-activity` | Activity for the selected board's underlying scope | Reachable contextually, not as a directory row action |
| Workspace lifecycle Rename/Archive/Restore controls | Not normal board actions | Keep only for explicit legacy/recovery administration; do not expose canonical-home lifecycle controls |
| `#cloud-migration-dialog` | Explicit legacy recovery flow | Keep reachable with visible Close and no mandatory workspace choice |

## Mixed-version compatibility decision

The candidate must preserve the current Firestore document shapes where possible. If Rules change for pointer immutability or canonical-home creation, qualify these combinations in Emulator tests before release:

- current client with current candidate Rules;
- old client with candidate Rules, especially profile updates, invitation acceptance, self-leave, and existing workspace lifecycle;
- candidate client with old Rules, with the result reported as a release compatibility finding rather than hidden by a client fallback.

A client Pages deployment and Rules publication remain separate release gates. This local step does not publish either.

## Budget gate

Fresh builds were run from the pinned baseline with blank configuration and synthetic non-production configuration. The measurement JSON is `budget.json`.

| Mode | Raw source | Raw headroom | Initial shell gzip | Lazy gzip |
| --- | ---: | ---: | ---: | ---: |
| Unconfigured | 295,374 / 300,000 | 4,626 | 26,110 / 26,250 | 57,982 / 58,000 |
| Synthetic configured | 295,374 / 300,000 | 4,626 | 26,154 / 26,250 | 57,982 / 58,000 |

No cap increase was made or authorized. The implementation must preferentially remove the obsolete workspace-row/selection UI and reuse existing controllers. It must not add a new lazy CSS graph, weaken safety/accessibility copy, or rely on line-ending changes. The measured lazy margin is only 18 gzip bytes, so every later step must remeasure.

## Step 2 acceptance

The account-home transition contract, old-control disposition, Rules boundary, mixed-version test requirement, and configured/unconfigured budget allocation are recorded. No application behavior, Rules, indexes, production data, or deployment was changed in this checkpoint.
