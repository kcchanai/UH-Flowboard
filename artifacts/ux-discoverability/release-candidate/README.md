# Flowboard UX Discoverability local release candidate

## Candidate identity

- Candidate type: local-only release candidate
- Branch: `luna/ux-discoverability`
- Base source SHA: `48690bc9024c947250488428bffc86f70b8974a2`
- Implementation source SHA: `b8ef07beea5eabab5aa207d3b3a165f993423d26`
- Packaging commit: the commit that adds this release-candidate directory
- Production: unchanged
- Remote operations: no push, PR, merge, Pages deployment, Rules publication, or real-account testing

The implementation source SHA is the reviewed, qualified application state immediately before this packaging-only directory. The package files are documentation and redacted synthetic evidence only.

## What changed

- Account is the first-level identity, workspace, and profile-photo-sharing hub.
- Share, update, and stop Google profile-photo presentation explicitly in the active workspace, with targeted readback and retry behavior.
- Verified profile changes refresh the active board roster and assignment choices without reload.
- Boards, cloud Workspaces, Cloud workspaces, Members, Activity, Appearance, local recovery, and data actions have distinct entry points.
- Appearance is visibly labelled and remains browser-local.
- Rich dialogs have bounded scrolling, reachable pointer Close and Cancel controls, and opener-aware focus restoration.
- Start here and Board actions explain browser-local, cloud editing, read-only preview, workspace data, board data, and recovery scope.
- Cloud status feedback distinguishes Connecting, Saving, Synced, Offline, Conflict, Error, access removal, and local fallback paths.
- Current-schema local storage is not rewritten merely because normalization changes JSON key order during a cloud return.
- Status controls have visible-text-inclusive accessible names and pass Lighthouse accessibility qualification.

## User guide

### Account and profile photo

1. Select the top-right Account control.
2. In an active cloud workspace, use **Share Google profile photo**, **Refresh shared photo**, or **Stop sharing photo**.
3. The control changes only the signed-in person's presentation field in the active workspace. It does not change roles, assignments, local storage, or other members.
4. A verified result is required before the UI announces success.

### Appearance

Select **Appearance** in the toolbar or Account. Theme, canvas, finish, and photo display are browser-local viewing preferences. They do not share a photo or alter workspace content.

### Boards versus Workspace

- **Boards** switches the board inside the current workspace.
- The topbar workspace status opens the cloud workspace chooser when cloud access is available.
- Owners and editors can explicitly open verified editable cloud workspaces.
- Viewers open read-only previews and can return to the browser-local workspace.

### Board actions

Board actions are grouped by visible scope prefixes:

- **Board data:** export this board or its cards as CSV.
- **Workspace data:** export or import workspace JSON.
- **Recovery:** inspect archived cards, open local recovery, or reset the browser-local workspace.

The Search cards field is above the board. Cloud preview remains read-only and does not replace browser-local data.

## Qualification evidence

- Unit tests: 31/31 passed.
- Firestore Rules Emulator tests: 24/24 passed.
- Final unconfigured built-browser suite: 54/54 passed.
- Synthetic configured built-browser suite: 54/54 passed.
- Tracked Emulator-browser workflow: 1/1 passed with demo Emulator services and system Chrome.
- Lighthouse accessibility: score 1 with zero failed audits.
- Production asset isolation: 25/25 assets passed.
- Final 1,000-card benchmark: 3/3 samples, zero console/page errors.
  - Initial board render median 563.7 ms, maximum 566.3 ms.
  - Navigation to usable median 581 ms, maximum 584 ms.
  - Single-term filter median 54.6 ms, maximum 55.1 ms.
- Raw source budget: 245,459 / 247,500 bytes, 2,041 bytes headroom.
- Initial shell gzip: 24,719 / 25,000.
- First-party lazy gzip: 51,429 / 55,000.
- Document gzip: 5,817.

Detailed per-step evidence remains in `artifacts/ux-discoverability/step-01/` through `step-09/`.

## Rules and data boundary

- `firestore.rules` is byte-identical to the base revision.
- Rules object hash: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`.
- No Rules publication was performed for this branch.
- No real Google account, production Firebase project, protected workspace, or disposable production fixture was opened or mutated.
- Synthetic configured browser checks used only non-production placeholder public configuration.
- Manual real-account acceptance is **not performed**.

## Manual acceptance still required

This candidate is locally qualified but not production-accepted. A separately authorized human gate would need a newly created disposable cloud workspace and two authorized Google accounts to verify:

- Account-first own-profile share, update, and stop behavior.
- Owner, editor, and viewer navigation and mutation boundaries.
- Immediate same-tab roster badge refresh and documented bounded refresh for another tab.
- Browser-local storage byte equality around Account, Appearance, cloud preview, return-local, and cloud error flows.
- The old deep profile-sharing route is no longer required for ordinary use.

Do not perform this matrix from the current authorization. It is listed for a future human gate only.

## Rollback

No schema or Rules rollback is required. To discard the isolated UX implementation on a separate working branch, revert the implementation commits in reverse order, preserving planning evidence as desired:

```text
b8ef07b test: qualify Flowboard UX release
b18ae42 feat: clarify Flowboard workflow feedback
a884f15 fix: make Flowboard dialogs reachable
759325b feat: clarify workspace and appearance navigation
7f27b36 feat: refresh roster after profile changes
b227c9d feat: verify workspace profile sharing in Account
d56f398 feat: make Account the first-level profile hub
484d1ce chore: raise UX source budget cap
```

Do not execute rollback as part of packaging. Never delete local storage keys or user data as rollback.

## Stop boundary

Step 10 completes at this local package. Do not push the branch, create a PR, merge, deploy Pages, publish Firestore Rules, or perform real-account acceptance without separate explicit authorization.
