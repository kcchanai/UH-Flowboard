# Luna implementation handoff: board-first copy simplification

After switching to Luna, send:

```text
Implement C:/Code/Stacie-Hermes/UH-Trello/FLOWBOARD_BOARD_FIRST_COPY_SIMPLIFICATION_PLAN.md.

Start by reading the complete plan, current clean main, relevant UI controllers, static validators, source-budget scripts, browser tests, and CI selection. Load static-web-mvp. Create the isolated branch and seven-step progress ledger specified by the plan. Report each verified Step X of 7 checkpoint with concrete results and budget measurements.

Product decision: users navigate Account -> Boards -> board. “My workspace” is not a selectable product object. Remove redundant user-facing personal-workspace language from Account and normal Boards navigation, but preserve the internal Firestore workspace model, canonical personal pointer, board identity tuple, memberships, invitations, roles, shared authorization, archives, backups, lifecycle jobs, migration receipts, and recovery hints.

Do not globally replace “workspace.” Classify every occurrence. Canonical personal boards should not repeat My workspace or owner. Shared boards must still show Shared and editor/read-only access. Same-named boards from different scopes must remain distinguishable without raw IDs. Data recovery and access-changing dialogs must retain truthful scope and consequences even when wording becomes board-centric.

Required visible outcomes include:
- Remove the Account dialog’s Current workspace / My workspace / Cloud workspace owner synced block.
- Change photo-sharing copy to describe people who can access the user’s boards.
- Remove the MY WORKSPACE eyebrow from Your boards.
- Change New board in My workspace to New board.
- Remove My workspace and redundant owner text from canonical board rows.
- Use board-centric shared-access labels for noncanonical scopes.
- Change Close My workspace and canonical pagination labels to board-first wording.
- Translate member, activity, invitation, and recovery surfaces carefully without hiding authorization breadth.

Authorization: local code and synthetic testing only, within C:/Code/Stacie-Hermes. No production account/profile access, protected-workspace fixtures, production document reads/writes, migration, push, PR, merge, Pages deployment, or Rules/index publication. Do not inspect normal browser profiles or request identifiers, tokens, cookies, storage, or raw payloads.

No source or gzip cap increase is approved. Baseline main is 88477363bac20cea90b8bfe78f0fb5b53964c16e. Baseline source is 299316/300000, configured initial gzip 25908/26250, configured lazy gzip 58386/60000. Public-facing copy must contain no em dashes.

Test the exact packaged and configured CI selections, not only focused fake-adapter fixtures. Preserve New board canonical destination, shared viewer/editor labeling, same-named board distinction, member/invitation/activity scope, account photo controls, archived actions, Data recovery separation, pointer-accessible Close controls, focus return, and narrow compatibility behavior.

Finish with the local evidence package and clean branch specified in Step 7. Explicitly inventory any remaining visible use of “workspace” and justify it. STOP BEFORE DEPLOYMENT and notify Aaron that the candidate is ready.
```
