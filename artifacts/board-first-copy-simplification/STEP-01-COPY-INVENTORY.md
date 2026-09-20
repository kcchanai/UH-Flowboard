# Step 1 copy inventory and baseline

## Baseline

- Branch: `fix/board-first-copy-simplification`
- Main baseline: `88477363bac20cea90b8bfe78f0fb5b53964c16e`
- Build: `npm.cmd run build` passed, Vite transformed 56 modules.
- Synthetic baseline capture: `capture-baseline.mjs`, local preview `http://127.0.0.1:4410/UH-Flowboard/`.
- Browser: existing system Chrome at `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`; managed Playwright browser was not installed and was not fetched.
- Capture result: 3 screenshots, zero page errors, zero console errors.

## Screenshot identities

| Surface | Viewport | File | SHA-256 |
|---|---:|---|---|
| Account dialog | 1440x900 | `baseline/account-1440x900.png` | `bfd18ef6b1af9b068d6b26d990ef5fdabc36ba3b7f0824e4f2500193122f30aa` |
| Boards manager | 1440x900 | `baseline/boards-1440x900.png` | `958e8d6f32e2c831bc193aac4c486584408ef59b3f5d1f5f1dc41ee6812aded4` |
| Boards manager | 960x720 | `baseline/boards-960x720.png` | `ed7182a68e7edbf7fe65af9565cd606742b336384ecbcb15bca164eb284c0286` |

The baseline is synthetic and contains no production account, workspace, board, identifier, token, or document payload.

## Copy matrix

### Ordinary Account and Boards navigation

| Source anchor | Current visible copy | Classification | Planned disposition |
|---|---|---|---|
| `index.html`, `#account-workspace-section` | `Current workspace`, `My workspace`, `Cloud workspace · owner · Synced` | Ordinary personal-board context | Remove the whole redundant visible block. Preserve account status and actionable recovery controls elsewhere. |
| `index.html`, `#workspace-profile-section` | `Your photo in this workspace` | Personal profile-sharing context | `Profile photo`. |
| `index.html`, `#workspace-profile-status` | `Visible to members of this workspace only. Only your profile here changes.` | Personal profile-sharing scope | `Visible only to people who can access your boards. Only your profile here changes.` |
| `index.html`, `#workspace-dialog` eyebrow | `MY WORKSPACE` | Ordinary board navigation | `Boards` or no eyebrow; use `Boards` to retain hierarchy without a container choice. |
| `index.html`, close control | `Close My workspace` | Ordinary board navigation | `Close boards`. |
| `index.html`, safety paragraph | `Legacy spaces are in Data recovery.` | Recovery pointer in board manager | `Older data is available in Data recovery.` |
| `index.html`, new-board label | `New board in My workspace` | Ordinary board creation | `New board`. |
| `cloud-workspace-ui.js`, `scopeLabel` and `boardRow` | `My workspace · owner · Position ...` | Canonical personal board row | Remove personal source and redundant owner. Retain position and active/current/archived state. |
| `cloud-workspace-ui.js`, pagination aria label/status | `Load more boards from ... workspace` | Ordinary board navigation | `Load more boards`; status `Loading more boards...`. |
| `cloud-workspace-ui.js`, session aria label | `Open ... My workspace` | Ordinary board navigation | `Open Boards` or `Sign in to open Boards`. |

### Shared-board access and administration

| Source anchor | Current visible copy | Classification | Planned disposition |
|---|---|---|---|
| `cloud-workspace-ui.js`, noncanonical row | Scope name plus `editor`/`viewer` | Shared access | `Shared · editor` or `Shared · read-only`; add `Source N of N` only when same-named board scopes need distinction. |
| `index.html`, assignment legend/status | `Workspace assignees`, `Loading workspace members...` | Board member roster | `People with board access`, `Loading people with board access...`. |
| `assignment-ui.js` | `Choose no more than eight workspace members`, legacy mapping text | Board member roster | `people with board access`; keep former-member and legacy mapping safeguards. |
| `index.html`, members eyebrow/heading | `Cloud workspace access`, `Members and invitations` | Shared-board access administration | `Board access`, `People and invitations`. |
| `members-ui.js`, member fallback | `Workspace member` | Shared-board access | `Board member`. |
| `members-ui.js`, remove/leave/owner copy | `cloud workspace access`, `Leave workspace`, `Owner access. Manage members and invitations.` | Authorization-changing controls | Board-centric copy that still states access breadth across the shared boards. |
| `index.html`, invitation dialog | `Workspace invitation`, `Join a cloud workspace` | Shared-board invitation | `Board invitation`, `Access shared boards`. |
| `invite-ui.js` | `This browser-local workspace was not changed.` | Invitation safety disclosure | `This browser's local data was not changed.` |
| `index.html`, activity dialog | `Workspace activity`, `Close workspace activity`, `...this workspace feed` | All-board activity scope | `All board activity`, `Close board activity`, and explicit shared-board activity scope. |
| `activity-ui.js` | `A workspace member`, `updated the workspace` | Activity actor/action | `Another board member`, `updated shared board access` or equivalent action wording. |

### Account setup, errors, recovery, and internal-only terms

| Source anchor | Current visible copy | Classification | Planned disposition |
|---|---|---|---|
| `app.js`, gates | `Loading your workspace`, `Cloud workspace unavailable`, `Account workspace needs attention`, `Workspace access ended`, `Your workspace is ready` | Account setup/error state | Use board/account-first wording where it remains truthful, such as `Loading your boards`, `Boards unavailable`, `Account setup needs attention`, `Board access ended`, `Your boards are ready`. Keep precise technical `workspace` only in diagnostics or scope-specific recovery details. |
| `app.js`, diagnostics | `Cloud unavailable (... at session)`, `Flowboard did not choose another workspace` | Safe diagnostic/recovery state | Preserve stage/code diagnostics and change user-facing fallback to `Flowboard did not switch to local task data` or equivalent. Never expose IDs or payloads. |
| `legacy-import-ui.js` | `Import into My workspace`, destination `My workspace`, `Open your personal workspace first`, `Reload My workspace` | Explicit legacy recovery | `Import boards`, destination `Your boards`, `Open Boards first`, `Reload Boards`. Preserve verified canonical destination and exact-backup safety. |
| `legacy-import-ui.js` recovery rows | `Workspace container · unavailable/archived/upgrade needed` | Retained recovery scope | `Older data · unavailable/archived · retained/upgrade needed`; keep lifecycle identity and actions. |
| `workspace-lifecycle-ui.js` | `Workspace name`, `Rename cloud workspace`, archive/restore copy | Shared/recovery administration | Keep internal scope terminology where changing a container name or lifecycle is the actual action; make visible consequence explicit and avoid ordinary navigation implying a chooser. |
| `src/adapters/*`, Rules, IDs | `workspaceId`, `personalWorkspaceId`, collections, methods, Rules functions | Internal implementation and authorization | No renames. No data migration. |

## Step 1 acceptance

- Baseline branch created from the exact deployed main SHA.
- Required skills loaded and plan/handoff read.
- Actual source inventory completed without a blind global replacement.
- Synthetic screenshots captured at 1440x900 and 960x720 with no runtime errors.
- No application code changed for the baseline.
