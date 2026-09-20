# Step 5 access, activity, invitation, and recovery evidence

## Delivered copy

- Activity dialog: `All board activity`, `Close board activity`, and an explicit shared-board activity notice.
- Activity entries use `Another board member` and `updated shared board access` where applicable.
- Assignment controls use `People with board access` and board-access mapping language.
- Member administration uses `Board access`, `People and invitations`, and access-changing copy that states its shared-board breadth.
- Viewer self-removal uses `Leave shared boards`; owner status explains management across these boards.
- Profile readback failure says `Photo sharing could not be verified.` and retains Retry.
- Invitation dialog uses `Board invitation` and `Access shared boards`; acceptance confirms browser-local data was not changed.
- Legacy import uses `Import boards`, `Your boards`, `Older data`, and exact-backup safeguards.
- Account/setup gates use boards and account setup language rather than presenting a workspace choice.
- Realtime removal/archive messages use board access and boards terminology.

## Intentional remaining workspace terminology

- Firestore IDs, collection paths, adapter method names, Rules functions, and `personalWorkspaceId` remain internal authorization/data identifiers. They were not renamed.
- `Workspace name`, `Rename cloud workspace`, `Archive cloud workspace`, and related lifecycle confirmation copy remains in the owner-only lifecycle dialog because it changes the authorization container and affects every board, member, invitation, and retained descendant. The dialog explicitly explains retained contents and member access consequences.
- Recovery adapter method names and diagnostic codes such as `WORKSPACE_NOT_FOUND`, `WORKSPACE_TOO_LARGE`, and `INVALID_WORKSPACE` remain technical contracts; user-facing recovery copy is board/data-oriented.
- Hidden `#cloud-status` compatibility text may retain technical sync terms because the visible redundant status control is hidden and runtime listeners still use the node. Its accessible label and user-visible owner action are Boards.
- Synthetic Emulator fixture names and persisted Firestore workspace names remain unchanged to prove data and authorization compatibility. They are not product copy.

## Verification

- Focused collaboration/session browser group: **7 passed**.
- Packaged tracked Emulator browser runner: **20 passed** with synthetic Auth/Firestore state and system Chrome.
- Static validation, workflow gating, syntax, production build, and source budget passed during the Step 5 checkpoint.
- Total source measured: **297,936 / 300,000** bytes; no cap increase.

No production account, protected workspace, real document, Rules publication, or deployment was used.
