# Flowboard UX discoverability and account-profile plan

## Status and authorization

**Planning complete. Implementation not started.** Prepared for Aaron's handoff to `gpt-5.6-luna`.

Goal: make account/profile, appearance, workspace navigation, and everyday board controls easy to find and understand, beginning with inline photo-sharing controls in the first panel opened from the top-right account avatar.

Live app: https://kcchanai.github.io/UH-Flowboard/

This request authorizes planning, not implementation, push, PR creation, merge, Pages deployment, Rules publication, or real-account testing. After Aaron explicitly starts implementation, execute the ten steps below and stop at a verified local release candidate. Previous deployment permission applied to the previous release, not this plan.

## Evidence and baseline

Audit method: inspect source and the three user-provided screenshots; exercise the deployed app anonymously in a fresh isolated Playwright context; capture light/dark boards, the account dialog, and appearance dialog. Attach console/page-error listeners before navigation. No sign-in or cloud workspace access was performed.

Evidence: `artifacts/ux-planning/audit.mjs`, `audit.json`, `live-board.png`, `live-dark.png`, `live-account.png`, `live-appearance.png`. The anonymous audit completed successfully and recorded no console errors or page errors during that limited route. This is not authenticated acceptance evidence.

Local audited HEAD: `9a398062cdbe53201098c9ce5e496d949dad35dc`. Local `origin/main` reference: `48690bc9024c947250488428bffc86f70b8974a2`. Compared production source, scripts, tests, and Rules between these revisions with no differences. The main reference was not newly fetched during planning; refresh it before implementation. The working branch is the old `luna/aesthetic-personalization`, not a new implementation branch.

Measured enumerated production source: **239,380 bytes**, hard cap **240,000**, headroom **620**. Warning threshold **210,000**; initial-shell gzip cap **25,000**; first-party lazy gzip cap **55,000**. HTML is measured separately as document transfer. Existing `dist` must not be treated as a fresh build. Rebuild and measure in Step 1.

### Confirmed problems

1. Photo sharing is buried under Account -> Cloud workspaces -> Manage members -> My profile. Aaron's screenshot shows sharing already enabled, but the audience/target is only described as “this workspace,” without visible workspace identity in that section.
2. The account panel displays a working provider photo in Aaron's screenshot, while the toolbar still displays initials. `src/auth-ui.js` assigns `button.textContent = initials(session)` rather than rendering a person badge. Initials there are not proof that sharing failed.
3. `src/members-ui.js` refreshes its own contents after sharing; `src/cloud-roster-ui.js` listens for cloud selection, mode, session, and appearance changes but has no profile-change invalidation. Immediate card-photo convergence is not explicitly wired.
4. Opening the account panel and changing appearance call the authentication render function, which also invokes `onSessionChange` and writes local-workspace status. This is unnecessary lifecycle coupling and a source-level regression risk; it is not a claim that all such interactions visibly fail today.
5. “Firebase account” / “Google sign-in” is the heading even after sign-in. “Create cloud copy” is the primary account action even when already working in a cloud workspace.
6. “My workspace” opens “Your boards,” while cloud workspaces have a separate, less discoverable route. “Cloud workspace previews” describes a chooser that also opens editable cloud workspaces.
7. The moon/sun control opens the full Appearance panel but has no visible Appearance label. Its accessible name is already correct. The photo preference does not explain that viewing photos and sharing one's own photo are separate actions.
8. “Start here” contains local-starter guidance in static markup. Board actions mix workspace-level operations with board-level operations. These require mode-aware copy and grouping, not more onboarding popups.

### Questions to investigate, not assumed defects

- The Members screenshot does not show its member list or invitation controls, although they exist in source. Determine whether this was a crop, scrolling, loading, or layout problem using synthetic fixtures. Do not conclude that member administration is missing.
- Some controls extend past the visible board lane. Intentional horizontal board scrolling is allowed; test reachability of Add list before changing layout.
- No screenshot proves all current assignees are UID-backed or that every member has opted in. Never infer identity from matching names, and do not relabel unresolved current members as former members merely because a roster read failed.

## Product contract

### Proposed first account panel (wireframe, not implemented UI)

```text
Account                                                Close
[photo or initials] Signed-in name
                    Signed in with Google

CURRENT WORKSPACE
Example planning workspace · Owner
Cloud workspace · Synced

YOUR PHOTO IN THIS WORKSPACE
[shared preview or initials] Shared with workspace members
[Update from Google]  [Stop sharing photo]
(or [Share Google profile photo] when not shared)
Only your profile in this workspace changes.

[Appearance]   [Switch workspace]   [Members]   [Activity]

Local data stays in this browser. Signing in does not upload it.
[Copy local workspace to cloud...]             [Sign out]
```

The sharing controls must be **inline and visible in the first account panel**, not another “Profile settings” submenu. One click opens the panel; a second explicit click shares when available. Loading/readback is permitted, but navigation through Members is not required. Stop sharing retains a clear confirmation.

At 1280x720 and larger desktop viewports, identity, workspace name, sharing state, and primary sharing action should be visible without scrolling in the ordinary short-name case. Long content and narrow screens may scroll without clipping controls.

### Scope and state rules

- **Signed out:** Account title becomes “Sign in”; offer Continue with Google and keep local use available. No profile-sharing mutation controls.
- **Signed in, local workspace:** Show the provider identity photo separately from sharing state. Say “Open a cloud workspace to share your photo with its members” and offer Switch workspace. Do not select a cloud workspace automatically or offer account-wide sharing.
- **Active owner/editor/viewer cloud membership:** Show the exact active workspace name and the current user's sharing state. Viewers may update their own profile under existing Rules; this does not enable board edits or member administration.
- **Not shared, provider photo available:** Explicit Share Google profile photo action. Never opt in automatically at sign-in, invitation acceptance, assignment, or appearance Save.
- **Shared:** Display the stored shared photo separately from the current provider preview if they differ. Offer Update from Google and Stop sharing photo. “Update” copies the current validated session photo; do not promise a fresh Google fetch unless actually performed through the supported Auth API.
- **No valid provider photo:** Plain explanation, initials fallback, no enabled share/update action. An existing shared photo can still be removed. Reauthentication may be suggested only as a recovery option, not a guaranteed cure.
- **Read failure/offline/loading:** Show “Unable to check photo sharing” or loading, not “Not shared.” Offer bounded Retry. Never claim success or Synced based only on optimistic state.
- **Archived/access removed/sign-out/workspace switch:** Invalidate the old context, disable old actions, close or rerender appropriately. Late responses cannot update the next workspace's UI.
- **Photo display preference:** Remains browser-local. Sharing does not turn display on, and selecting photos does not grant sharing consent. Preserve existing initials-only behavior for account and assignee surfaces; any settings preview exemption must be explicitly documented and privacy-reviewed, not silently added.

## Scope boundaries

- Work only under `C:/Code/Stacie-Hermes`, repository `UH-Trello`. No profile, global Git, dependency-cache, machine, or other repository changes without permission. Existing installed tools are preferred; ask before an installation writes outside the vault.
- Never open or mutate `My Flowboard workspace`; leave `Lifecycle realtime probe` untouched. Use fresh synthetic local/Emulator fixtures only. Do not use the normal browser profile.
- Do not print raw `flowboard-workspace`, `flowboard-data`, auth artifacts, provider configuration, emails, UIDs, workspace IDs, cookies, tokens, or private card data. Assert exact raw-string equality in memory and report booleans/counts only.
- No extra OAuth scopes, Gmail/Contacts/People API, arbitrary photo uploads, new backend, paid services, persistent Firestore cache, or analytics.
- Reuse current member fields and `updateOwnMemberProfile`. Identity and authorization remain UID/member-ID based. Strict HTTPS exact-host `lh3.googleusercontent.com` validation, URL length limits, no credentials/unexpected ports, no-referrer images, and fallback behavior remain intact.
- No schema or Rules change is expected. Rules must remain byte-identical for this release. If existing authorization cannot support a required behavior, stop with evidence and a separate proposal; do not weaken Rules or add publication to this plan.
- Preserve local raw storage, backup-first cloud-copy review, role enforcement, revisions, archive/restore retention, and safe sign-out/listener cleanup.
- Desktop-office-first. Narrow widths are compatibility coverage, not a mobile redesign. No em dashes in public copy. Do not rewrite the app or introduce a framework/design system.

## Execution and reporting contract

Create `FLOWBOARD_UX_DISCOVERABILITY_PROGRESS.md` at implementation start. Track exactly ten steps with one `in_progress`; mark dependencies, checks, changed files, measured budgets, commits, and blockers. Commit a step only after its acceptance checks pass. Do not stage unrelated planning artifacts or changes automatically.

After **every completed step**, immediately send a short Discord update using:

```text
Step 3 of 10 complete: First-level account panel
Summary: [one or two sentences describing verified changes]
Verified: [actual checks and results, not expected counts]
Budget: [measured raw / cap; shell and lazy gzip when built]
Checkpoint: [commit or explicitly uncommitted]
Production: unchanged. Next: Step 4 of 10.
```

If blocked, say “Step N of 10 blocked,” include evidence and the precise decision needed. Never call code-written/test-pending work complete. Continue authorized non-production steps without asking at each routine checkpoint; stop at budget, scope, credential, or release boundaries. A model switch alone is not permission to start.

## Step 1 of 10: Reproduce and pin the baseline

**Work**
- Discover clean/dirty state; preserve user work and this plan. Refresh main using existing authorized read access, record exact SHA, and create a new `luna/ux-discoverability` branch from current main. Do not continue on the stale aesthetic branch.
- Read current project rules, this plan, static-web-mvp, and emulator-browser-validation workflows. Reconcile upstream changes before edits.
- Fresh build and full existing baseline validation. Inventory the exact test commands from package scripts and CI rather than guessing counts or installing tools silently.
- Record anonymous live observations and create isolated synthetic scenarios: owner/editor/viewer, same-named workspaces, no-photo/photo/shared/unshared, long identity, local legacy assignees, UID-backed members, removed members, read failure, and broken images.
- Reproduce route depth, initials-only toolbar, post-share stale roster, and any dialog clipping. Classify screenshot limitations separately from reproduction.

**Acceptance**
Baseline commands/results, clean source revision, raw and compressed budgets, untouched Rules identity, storage-isolation checks, and protected-resource exclusions are documented. Any baseline failure is fixed or explicitly blocks the affected work, not buried.

**Completion summary:** “Baseline and isolated UX fixtures are pinned; confirmed defects are separated from unverified concerns.”

## Step 2 of 10: Fund the changes without weakening quality

**Work**
- Measure source graph and fresh build; the planning baseline has only 620 bytes free. Estimate incremental cost by component and reserve at least 2,000 raw bytes of maintenance headroom at the final candidate.
- Prefer removing obsolete duplicate profile markup/handlers, consolidating repeated presentation rendering, and loading optional account/profile details on demand. Keep lifecycle and security code explicit and readable.
- Draft a quantified byte-allocation proposal before major feature work. Every new reachable file belongs in manifests, syntax/static checks, and budgets.
- Do not obtain space by deleting safety copy, accessibility, tests, error states, or by excluding reachable source. Do not mechanically minify more source to hide maintainability costs.
- If measured safe recovery cannot fund the work plus margin, stop for Aaron's explicit cap decision. Supply current usage, estimated growth, recovery evidence, proposed cap, and unchanged transfer limits. A previous cap increase is not permission for another.

**Acceptance**
Approved allocation is feasible with verified recovery, or this step is explicitly blocked awaiting approval. Raw/per-file/shell/lazy gates remain enabled. Rerun baseline tests after any recovery refactor.

**Completion summary:** “The UX work has a measured budget allocation and maintenance margin; no limits were silently increased.”

## Step 3 of 10: Make Account the first-level personal hub

**Work**
- Replace backend-branded headings with Account/Signed in with Google as appropriate. Keep sign-out visually secondary and move initial keyboard focus to the heading/close or another safe target rather than Sign out.
- Build the proposed hierarchy with active workspace name, role, scope, and inline profile section above navigation shortcuts. Demote Copy local workspace to cloud; label exactly what it copies, including when already viewing cloud content.
- Use a reusable safe person-badge renderer for the toolbar and account identity. Honor initials-only preference and preserve accessible Account naming independently of image success.
- Separate identity rendering from actual session-change propagation. Opening Account or changing appearance must not call every controller's `setSession`, reset sync state, or restart listeners. Auth changes still propagate exactly once through the established bootstrap.
- Keep the signed-out and signed-in-local states usable. Do not convert a form-rich dialog into an ARIA menu.

**Acceptance**
Account opens in one click, uses correct state headings, and does not alter mode/listeners or local workspace bytes. Toolbar photo, initials preference, invalid/missing/broken photo, safe focus, and all three roles pass focused tests. No cloud reads/writes are introduced by purely local appearance rendering.

**Completion summary:** “Account now explains who you are and where you are working, with profile sharing visible at the first level.”

## Step 4 of 10: Implement one workspace-scoped sharing controller

**Work**
- Extract sharing state/actions from Members into a small owned-root controller, for example `src/profile-sharing-ui.js`, shared through bootstrap rather than copied into two dialogs.
- Account owns the full sharing controls. Replace the old Members section with a concise “Your photo is managed in Account” shortcut, or mount the same controller there only if it costs less and remains consistent. Preserve a route for users accustomed to Members.
- Reuse existing adapter reads and `updateOwnMemberProfile`. Never change roles, assignments, email, or other members' profiles. Capture authenticated actor/workspace/generation before reads, writes, and confirmations; recheck after awaits. Disable repeated clicks.
- Name workspace and audience beside Share. Confirm Stop sharing with the target workspace and initials fallback. Sharing success requires write acknowledgment and matching targeted readback; if write succeeds but verification fails, say so and offer Retry instead of blindly writing again.
- Guard success/error/finally and invalidate on sign-out, removal, close, and workspace change. An in-flight write may finish for its captured old target; it must never be retargeted or displayed as success in the next workspace.
- Clear stale shared metadata on loss of context. Separate unknown/loading/error from unshared. Explain initials-only view without silently changing it.

**Acceptance**
From the board: click Account, then Share, receive verified workspace-scoped result. Share/update/remove/cancel, rapid double-click, failures, delayed responses, switch/sign-out during request/confirmation, and viewer self-profile pass UI and adapter-to-Emulator tests. Other member/role/local records remain unchanged.

**Completion summary:** “Sharing, updating, and removing your photo work directly in Account with explicit consent and verified feedback.”

## Step 5 of 10: Make photo changes visible without reloading

**Work**
- After verified profile change, invalidate the active roster through a scoped callback/event containing only internal routing metadata. Repaint owned card-assignee roots, account sharing status, and relevant open assignment/member surfaces.
- Do not use `onSessionChange` as a refresh shortcut. Retain duplicate-initializer isolation and generation guards; no global DOM scans that repaint another board.
- The same tab must update immediately after verified success, including Stop sharing. For teammates/other tabs, provide bounded refresh on relevant UI open and visibility return, with request coalescing. Do not add polling or an unbounded membership subscription. Document that a continuously visible second tab may require reopening/refreshing; do not claim realtime roster sync.
- Distinguish read failure/unknown member from confirmed former member. Keep local free-text assignments intact. Never map names to Google identities automatically.
- Preserve maximum badge count/overflow, accessible assigned names, fixed dimensions, no-referrer, lazy decoding, broken-image fallback, and no photo requests under initials-only mode.

**Acceptance**
Sharing/removal updates UID-backed card badges in the active tab without page reload or reopen-workspace workarounds. A second isolated context refreshes on the documented bounded route. Tests cover multiple boards/initializers, missing members, failed reads, legacy labels, and preference toggling with no shared-content mutation.

**Completion summary:** “Profile changes update the current board immediately, and stale or unavailable photos fall back honestly.”

## Step 6 of 10: Clarify navigation and appearance discovery

**Work**
- Rename the current board-list trigger to **Boards**. Add a clearly labeled **Workspace** entry point for the existing chooser, separate from board switching. Show active workspace identity, role, and sync state without losing the board title.
- Label the chooser **Cloud workspaces**, not Cloud workspace previews. Make current selection apparent. Keep existing owner archive/restore/rename and retained-data semantics; no new destructive lifecycle actions.
- Provide direct Members and Activity shortcuts for the active cloud workspace from Account or the workspace entry. Role-sensitive labels must reflect what a viewer can actually do. Do not gate the user's own photo on owner-only administration.
- Add a visible **Appearance** label beside its icon at desktop sizes and a shortcut from Account. On narrow screens retain an accessible, discoverable entry without forcing every toolbar item onto one row.
- In Appearance, explain “Display only. Each person chooses whether to share their photo in Account. People without a shared photo use initials.” Provide a focused route to Account when applicable, preserving unsaved appearance changes via explicit Save/Discard/Cancel handling or by retaining the draft on return.
- Keep browser-local Save/Cancel/reset semantics unchanged. Prefer reuse of existing dialog-open functions, not fake clicks on hidden controls.

**Acceptance**
Boards, Workspace, and Appearance have unambiguous destinations. Workspace chooser and personal sharing require no more than two deliberate actions from the board. Account-to-Appearance and return paths preserve focus/drafts. Anonymous/local/cloud/read-only and archived-workspace navigation pass without accidental switches or mutations.

**Completion summary:** “Boards, workspaces, members, and appearance now have clear and predictable entry points.”

## Step 7 of 10: Make dialogs reachable and keyboard-safe

**Work**
- Audit Account, Members, workspace chooser, Appearance, and their confirmations at desktop short heights and long content. Fix actual clipping, not screenshot assumptions.
- Use a bounded dialog with a scrollable content area and reachable close/action controls. Ensure Members and Invitations are visible through intentional section layout/scrolling; show load/empty/error states instead of a misleading blank section.
- Reuse a lightweight dialog navigation helper only where it reduces bugs. Close parent dialogs on forward navigation and return focus to the correct visible opener or safe fallback. Do not accumulate overlapping modal backdrops or focus hidden buttons.
- Keep explicit pointer-accessible Close and Cancel in read-only states. Escape complements, not replaces, closure. Handle dirty forms correctly and disable hidden required fields where necessary.
- Test screen-reader names, keyboard traversal, focus-visible, 200% zoom, forced colors, reduced motion, and coarse-pointer targets.

**Acceptance**
All relevant dialog actions remain reachable at 1280x720, 1440x900, 1920x1080, 960x720, plus 320/390 px compatibility widths. Only the board lane may horizontally scroll. Keyboard opens/closes/returns correctly, no inaccessible hidden validation traps, and role restrictions do not disable non-mutating navigation.

**Completion summary:** “Settings and member controls remain reachable, readable, and dismissible across tested layouts and input methods.”

## Step 8 of 10: Replace technical and misleading workflow feedback

**Work**
- Make Help/Start here concise and mode-aware: local storage, cloud editing, or read-only access. Correct the statement that search lives under Board actions. Do not introduce an automatic tour, telemetry, or onboarding persistence.
- Group existing actions by Board, Workspace/data, and Recovery; rename Reset workspace and cloud-copy entry points with accurate scope. Preserve all confirmations, backup previews, and archive retention wording.
- Keep sync statuses distinct: Connecting, Saving, Synced, Offline, Conflict, access removed, and error. Only the current runtime/sync owner writes those statuses. Opening Account/Appearance must not overwrite them with “local workspace.”
- Give failures one actionable recovery path (Retry, open workspace chooser, or sign in when genuinely needed). No generic success on denied writes, no implication of an offline queue.
- Add targeted photo help to the assignment surface, not a new wizard: member assignment, optional sharing, local display preference, and safe fallback are different concerns. Avoid exposing emails/IDs as troubleshooting instructions.
- Inspect existing Add list and overflow affordances. If the control is reachable only offscreen, add a compact always-reachable alternative or a clear scroll affordance using the same creation command. Do not change drag-and-drop scope or redesign cards.

**Acceptance**
Synthetic local/owner/editor/viewer/offline/conflict states display accurate scope and actionable feedback. Existing import/export/recovery/reset semantics still pass. Exact post-action status text remains legible at target widths. Public copy contains no em dashes.

**Completion summary:** “Guidance, action labels, and status messages now explain the current task and data scope without technical detours.”

## Step 9 of 10: Qualify the complete UX pass

**Work**
- Run `npm.cmd run validate`, the full built-browser suite through the repository's existing runner/CI-equivalent command, `npm.cmd run test:rules`, and `npm.cmd run test:emulator-browser` using already available tooling. Record real counts and exit codes.
- Build/run both unconfigured local mode and CI-like configured mode using synthetic public values only. Tests must never reach production Firebase. Production artifacts must exclude test seams, emulator addresses, synthetic configuration, and fixture payloads.
- Add deterministic UI tests for first-panel route depth, role/photo states, callback counts, listener stability, no mutation on settings open, asynchronous races, readback failures, confirmation cancel, and duplicate controller isolation.
- Exercise real SDK/Rules paths against disposable Auth/Firestore Emulators for owner/editor/viewer own-profile changes, denied changes to another member, invalid URLs, immutable authorization fields, and workspace isolation. Browser mock tests alone are not cloud E2E.
- Assert raw local-storage string equality before/after account, sharing, appearance, navigation, and cloud error flows. Never print the payloads.
- Run accessibility checks on changed surfaces and inspect actual failing nodes; retain a 100 accessibility score and zero failed scored audits where the existing workflow enforces them. Verify contrast/focus across existing palette/mode/finish combinations without redesigning palettes.
- Re-run the established 1,000-card repeated benchmark and report comparable baseline/final median and maximum timings plus observed errors. No unexplained material regression; investigate a repeatable >10% increase under comparable conditions instead of treating one noisy sample as proof.
- Re-measure raw/per-file/document/shell/lazy/vendor output and the agreed maintenance margin. Count profile/roster reads in synthetic flows to ensure no render loop, repeated authentication fanout, or polling regression.

**Acceptance**
All affected and full regression gates pass. New failures are resolved, not skipped. No page/console errors in qualified routes, no unknown target mutations, no budget override, and Rules are byte-identical. Separate automated evidence from human-only acceptance not yet performed.

**Completion summary:** “The complete UX flow passed built-browser, accessibility, performance, storage-isolation, and Emulator qualification.”

## Step 10 of 10: Package the verified candidate and stop

**Work**
- Create a release-candidate README/manifest under `artifacts/ux-discoverability/release-candidate/` with exact source SHA, changed files, measurements, test commands/results, known limitations, Rules identity, rollback instructions, and clean/dirty worktree status.
- Include screenshots from synthetic authenticated fixtures and a short user guide: Account -> Share; Appearance -> photo display; Boards versus Workspace; member invitation path. No personal data in artifacts.
- Supply final human acceptance steps for a newly authorized disposable workspace: two Google accounts, own-profile share/update/stop, owner/editor/viewer scope, immediate local badge update, documented teammate refresh, local isolation, and old-menu replacement. Mark this matrix **not performed** until Aaron authorizes and executes it.
- Finish the progress ledger and verify repository state. Do not push, create a PR, merge, deploy Pages, publish Rules, or access real workspaces. Give exact authorization choices separately.
- Rollback candidate changes by reverting the isolated implementation commits; since schema/Rules are unchanged, no data migration rollback is expected. Never delete user data or raw-storage keys as rollback.

**Acceptance**
Every preceding step is passed, the candidate is reproducible and pinned, no unjustified completion claims remain, and Aaron receives a concise final report with a precise release stop boundary.

**Completion summary:** “The verified UX release candidate is ready for review; production is unchanged and awaits explicit release authorization.”

## Primary implementation touchpoints

- `index.html`, `styles.css`: account hierarchy, visible navigation, dialog layout and scope copy.
- `src/auth-ui.js`: avatar rendering, account UI versus auth lifecycle separation.
- `src/runtime-bootstrap.js`: controller ownership, callbacks and actual session changes.
- `src/members-ui.js`: remove duplicated profile controls, preserve member permissions and confirmations.
- New small profile controller only if justified; update manifests/guards when added.
- `src/cloud-roster-ui.js`, `src/person-badges.js`, `src/assignment-ui.js`: scoped refresh, status/fallbacks, safe image display.
- `src/cloud-workspace-ui.js`, `src/activity-ui.js`, `src/workspace-lifecycle-ui.js`: explicit navigation and workspace context, existing lifecycle unchanged.
- `src/appearance-ui.js`, `app.js`: discoverability, local preference and mode-aware guidance/status.
- `tests/browser-smoke.spec.mjs`, unit tests, Rules tests, Emulator-browser fixtures: regressions and real authorization checks.
- `scripts/source-budget.mjs`, source graph/static validators: keep gates accurate, never evade them.
- `firestore.rules`: regression evidence only; no planned edits or publication.

## Deferred deliberately

No global profile directory, automatic opt-in, photo upload/crop editor, live presence, realtime roster subscriptions, mobile redesign, command palette, full card/editor redesign, new notifications, custom backend, search overhaul, permanent cloud deletion, or rewrite of collaboration/security architecture. Valuable future enhancements must not displace the account/navigation fixes or expand this release without approval.

## Copy-paste handoff after switching models

```text
Implement UH-Trello/FLOWBOARD_UX_DISCOVERABILITY_PLAN.md.
Read the complete plan and applicable project skills first. Follow its ten-step
progress ledger and send a short verified “Step N of 10 complete” update after
each step. Start from current main on a new isolated branch, preserve planning
artifacts and unrelated work, and honor the measured budget gate. Put photo
sharing inline in the first Account panel, not behind another submenu.
Keep Rules/schema unchanged, use synthetic and Emulator fixtures only, and
preserve all protected-workspace and local-data boundaries. Do not push,
create a PR, merge, deploy, publish Rules, or run production-account tests.
Stop at the verified local release candidate and report evidence plus the
exact next authorization needed. If budget recovery cannot fund the plan,
stop with a quantified cap proposal rather than raising limits silently.
```
