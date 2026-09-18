# Flowboard UX discoverability progress

## Authorization and boundary

- Plan: `FLOWBOARD_UX_DISCOVERABILITY_PLAN.md`
- Scope: non-production implementation only
- Production: unchanged; no push, PR, merge, Pages deployment, Rules publication, or real-account acceptance
- Protected workspace: not opened or mutated
- Disposable fixture: not opened or mutated
- Credentials, auth artifacts, workspace IDs, UIDs, emails, and raw workspace payloads: not recorded
- Firestore Rules: unchanged and byte-identical to `origin/main` at the baseline revision

## Checkpoint ledger

| Step | Status | Checkpoint | Summary |
|---|---|---|---|
| 1 of 10 | complete | `48690bc9024c947250488428bffc86f70b8974a2` baseline plus Step 1 artifact commit | Baseline pinned on a new isolated branch; source, build, Rules, browser, and isolation checks passed. |
| 2 of 10 | complete | `03238fe` budget proposal plus cap-transition checkpoint | Aaron approved the raw source cap at 247,500 bytes; warning and gzip limits remain unchanged, and fresh check/build/measure passed. |
| 3 of 10 | in_progress | uncommitted | First-level Account hub. |
| 4 of 10 | pending | - | Workspace-scoped sharing controller. |
| 5 of 10 | pending | - | Immediate roster refresh. |
| 6 of 10 | pending | - | Navigation and Appearance discovery. |
| 7 of 10 | pending | - | Dialog reachability and keyboard safety. |
| 8 of 10 | pending | - | Workflow feedback and mode-aware guidance. |
| 9 of 10 | pending | - | Complete qualification. |
| 10 of 10 | pending | - | Local release candidate package and stop. |

## Step 1 baseline evidence

- Branch: `luna/ux-discoverability`
- Baseline source revision: `48690bc9024c947250488428bffc86f70b8974a2`
- Refreshed `origin/main`: same full SHA
- Pre-existing untracked planning artifacts preserved and included only as intentional baseline evidence
- Unit tests: **31 passed, 0 failed**
- Syntax/static/performance/workflow checks: **passed**; 11 semantic/runtime guards and adapter-boundary checks
- Fresh production build: **passed**; 47 modules transformed
- Source graph: **239,380 / 240,000 bytes**, 620 bytes headroom; maintainability warning at 210,000 remains active
- Per-file source limits: **passed**; 27 reachable production sources, none unbudgeted
- Fresh distribution budgets: initial shell **24,512 / 25,000 gzip**, first-party lazy **50,269 / 55,000 gzip**, document **5,587 gzip**, vendor **139,736 gzip**
- Rules Emulator: **24 passed, 0 failed**; expected denied probes produced emulator diagnostics but did not fail the suite
- Production asset isolation: **25 assets passed**, no Emulator-only markers
- Built-browser suite: **48 passed, 0 failed** on fresh preview port 4215 using system Chrome
- Anonymous deployed audit: completed with **0 console errors and 0 page errors** in the limited route
- Storage boundary: no authenticated or cloud workspace access; no local workspace payload was printed or persisted in evidence
- Incumbent port 4173 was left untouched; fresh validation used owned port 4215

## Confirmed baseline UX findings

1. The top-right toolbar account control uses initials even when a provider photo is available in the account dialog.
2. Photo sharing requires Account -> Cloud workspaces -> Manage members -> My profile.
3. The account heading remains backend-branded and says Google sign-in after authentication.
4. The board-list trigger says My workspace while opening Your boards.
5. The cloud chooser heading says Cloud workspace previews although owners and editors can open editable cloud mode.
6. The Appearance trigger is icon-only in the desktop toolbar, although its accessible name is correct.
7. Roster refresh after profile sharing has no explicit profile-change invalidation event.

The screenshot question about missing member controls remains classified as unverified from the crop; source and browser contract tests show the controls exist.

## Step 2 gate

The measured baseline leaves 620 raw bytes, but the plan requires at least 2,000 bytes of final maintenance headroom. Step 2 must recover or consolidate enough safe source before feature edits. No cap increase is being assumed.
