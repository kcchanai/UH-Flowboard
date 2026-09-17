# Flowboard aesthetic personalization and identity plan

Status: planning complete; implementation not started.
Audience: Aaron and the implementing gpt-5.6-luna session.
Primary target: desktop office staff using Google sign-in, including Google Workspace accounts.
Implementation sequence: 10 steps, with explicit progress reports and an independent release gate.

## 1. Outcome and recommended direction

Make Flowboard feel calm, polished, personal, and recognizably professional without reducing information density or changing the meaning of task data.

Recommended design:
- Eight curated canvas palettes, each with a gradient and a solid alternative.
- Separate Light, Dark, and System surface modes from canvas selection.
- Ocean Slate as the recommended new-user default; preserve Classic Flow for existing users unless they choose another palette.
- Opaque, highly legible cards and dialogs, quieter typography, consistent spacing, and restrained metadata.
- Google profile photos as optional, non-authoritative visual identifiers for current workspace assignees, with stable initials and readable names everywhere a photo is unavailable.
- Personal appearance preferences scoped to this browser, not shared board content. Clearly disclose that they do not sync across devices in this release.
- No photo backgrounds, animated gradients, arbitrary CSS editor, uploaded wallpaper, external font library, People API, Gmail scopes, new backend, or paid service.

Google avatars are a good idea, but a photo must not be the only way to identify someone and is never proof of identity, membership, presence, or permission.

## 2. Evidence and actual starting point

### Verified during this planning pass

- Repository: `C:/Code/Stacie-Hermes/UH-Trello`.
- Source checkout: `main`, clean before adding these planning artifacts.
- Exact source HEAD: `7bc5ff5230ebe1d36c2ca5debd11703e596979f4`.
- Public site inspected anonymously: https://kcchanai.github.io/UH-Flowboard/.
- Isolated 1440px browser inspection rendered four lists and ten starter cards. The audit captured zero console errors and zero page errors.
- Inspected light and dark DOM previews plus the card editor, with screenshots under `artifacts/aesthetic-planning/`. No sign-in, cloud writes, or real-user data were used.
- CSS already has useful canvas, surface, text, accent, radius, spacing, and light/dark variables. Extend them rather than replace the application styling wholesale.
- `src/adapters/firebase-workspace-adapter.js` already exposes the current session's `photoURL`.
- `src/auth-ui.js` renders initials rather than using the photo.
- `app.js` renders assignee initials. Cloud assignments already use `assigneeUids`; local assignment remains free text.
- `src/assignment-ui.js` calls `listMembers` and supports up to eight assigned workspace members, with stale-response guards.
- `src/adapters/firebase-cloud-workspace.js` creates owner membership with a display name, but invitation acceptance creates membership without that name. Neither path currently stores a member photo.
- `firestore.rules` keeps `users/{uid}` readable only by that user. Do not make this global collection readable to teammates to obtain avatars.
- Current member updates support tightly constrained role changes and ownership transfers, not self-service profile-photo refreshes. Team avatar sharing therefore requires a reviewed Rules change.

### Design findings

The current blue/indigo canvas dominates the empty lower board area. The card/list structure is useful and should remain. Much of the interface uses heavy type, so task titles, secondary actions, and headings compete. Dark cards and lists are close in tone. Board title and utilities assume white foregrounds, which will fail aesthetically and potentially in contrast on pastel canvases unless they receive independent tokens. Existing starter cards do not show assignees, so avatar qualification needs synthetic member-rich fixtures rather than screenshots of the default board alone.

### Budget facts and caution

The current working-tree source measurement is **216,498 / 217,500 bytes**, leaving **1,002 bytes**. This is too little to assume that a picker, persistence, profiles, and avatars will fit.

The same manifest counted directly from Git blobs is **215,308 bytes**, leaving **2,192 bytes**. The measured working-tree difference is explained by **1,190 CRLF pairs**. Do not reuse earlier chat totals or mistake line-ending differences for removed features.

`npm.cmd run measure:mvp-v2` also read existing `dist/` assets: initial shell gzip 23,767 and first-party lazy gzip 44,248. These are observations of an existing build, not a fresh build qualification in this planning pass. Rebuild before using them as candidate evidence.

Binding limits remain: raw source 217,500; warning 210,000; initial shell gzip 25,000; first-party lazy gzip 55,000. `index.html` remains classified as document. No cap increase is authorized by this plan.

## 3. Visual specification

### Canvas palette catalogue

These are proposed starting values, not already-qualified contrast combinations. Exact data also lives in `artifacts/aesthetic-planning/palettes.json`.

| Preset | Light-mode gradient, 135 degrees | Light solid | Board foreground | Dark-mode gradient |
| --- | --- | --- | --- | --- |
| Classic Flow | `#135FA8` to `#3E4CA8` | `#28569F` | `#FFFFFF` | `#172B50` to `#34275F` |
| Ocean Slate | `#2B5D88` to `#3B4E7A` | `#33567F` | `#FFFFFF` | `#182C41` to `#28354E` |
| Lagoon | `#155E75` to `#246B67` | `#205F69` | `#FFFFFF` | `#102F3C` to `#183D37` |
| Sage Studio | `#DCE9DF` to `#C8DEDA` | `#D5E4DC` | `#203D36` | `#1C302B` to `#293B35` |
| Warm Sand | `#F1E7D7` to `#E7D5C7` | `#EBDDCF` | `#45372F` | `#302923` to `#3D302B` |
| Lavender Mist | `#E8E3F3` to `#D6DFF0` | `#DFE1F1` | `#34334F` | `#28263C` to `#303551` |
| Dusk Plum | `#59416F` to `#3B527D` | `#4C4977` | `#FFFFFF` | `#302339` to `#24334B` |
| Graphite | `#465567` to `#303C4C` | `#3A485A` | `#FFFFFF` | `#191F28` to `#252C38` |

Dark-mode solid uses the first dark gradient stop. Dark-mode board foreground starts at `#E8EDF5` for all presets, subject to verification. Dark presets should not turn into bright canvases simply because the same palette name was selected.

Presentation rules:
- Gradient is a broad static linear transition. A single low-opacity glow is optional only after contrast review; no animation, photo assets, grain image, or multiple bright hotspots.
- Solid removes both the linear gradient and any glow, not merely makes the endpoints similar.
- Keep the canvas on the existing document/body background model; do not reintroduce the fixed-background bottom-band regression.
- Keep the global topbar a stable dark navy, or give it a fully specified independent token set. Do not let it inherit pastel board text by accident.
- Introduce board-level foreground, secondary foreground, control fill, hover fill, border, focus, add-list, and scrollbar tokens. Pastel themes use darker board controls and text; dark canvases use lighter ones.
- Keep card/list/dialog surfaces driven primarily by Light/Dark mode, not arbitrary rainbow tinting.
- Do not change task label colors, due-state meaning, or danger colors when the canvas changes.
- Starting typography: board title 26px/700; list heading 14px/650; card title 14px/500-600; controls 13-14px/600; metadata 12px/400-500. Verify actual font rendering and avoid reducing readability just to fit content.
- Keep the existing desktop column width as the baseline. Tune spacing locally, not through an unrequested density-mode feature.
- Use one subtle card edge/shadow and a slightly stronger hover/focus treatment. Do not add glass translucency behind task text.
- Preserve visible Close, Save, Cancel, read-only navigation, scroll cues, and label text. Meaningful starter label names may be used in synthetic previews; do not silently rename existing user labels.

### Appearance interface

Use a clearly labelled `Appearance` button in the topbar, in the existing theme-control position. A labelled native dialog contains:
1. Mode: Light, Dark, System.
2. Canvas: named swatch radio choices with selected checkmark and accessible names.
3. Finish: Gradient or Solid.
4. Image display: Show profile photos or Use initials, as a personal browser preference.
5. Scope text: `Appearance applies to this browser. It does not change shared boards.`
6. Preview, Save appearance, Cancel, Reset to defaults, and a visible Close button.

Selections preview immediately using draft presentation state. Save persists once. Cancel, Close, and Escape discard the draft and restore the prior appearance. Reset changes the draft only until Save. A failed save leaves the draft open, gives an actionable error, and must not claim persistence. Swatches use real radios or equivalent tested keyboard semantics, not unlabeled clickable color boxes.

### Preference model

Use a small versioned record such as `{version:1, mode:'system', canvas:'ocean-slate', finish:'gradient', showPhotos:true}` in a dedicated `flowboard-appearance` key through the local adapter. Store allowlisted identifiers and booleans only, never arbitrary CSS, image URLs, email, or account identifiers.

Preserve existing users' legacy theme choice and Classic Flow when there is no new preference record. Treat an existing persisted workspace as an existing installation; do not silently change it to Ocean Slate. New installations may start with Ocean Slate and System. Read the legacy theme once as fallback without rewriting the board payload to migrate appearance. Unknown values, malformed JSON, unavailable storage, and newer unsupported versions fall back safely.

Appearance is per browser in this release, not per Google account or shared workspace. It may remain after sign-out because it contains no account data. Switching boards, opening cloud mode, receiving remote snapshots, importing data, or returning local must not overwrite it. Keep workspace import/export formats compatible; the separate new appearance record is not silently imported with someone else's board.

## 4. Google avatar architecture and privacy

### Recommended behavior

- Own account avatar: use the current authenticated Google provider photo if present, otherwise initials. Existing sign-in is sufficient; no extra Gmail, contacts, or People API permissions.
- Team avatars: opt-in sharing per workspace, initiated in Account/Members through explicit copy such as `Share my Google profile photo with this workspace`. Offer `Refresh shared photo` and `Stop sharing photo`.
- Default for existing memberships is no shared photo. Signing in or opening a board must not automatically backfill or publish photos across every workspace.
- Sharing controls can be available to a viewer for their own profile only. That does not make board editing or member administration available to viewers.
- A separate personal `Use initials` display preference blocks image requests from this browser. It is not the same as removing a photo shared with colleagues.
- On opt-out, clear the shared photo field and update active views. Explain that archived workspace metadata is retained and profile edits there are unavailable until authorized restoration; never auto-restore a workspace to change a photo.
- No custom URL entry or avatar upload in this release.

### Data path: extend member metadata narrowly

Prefer optional presentation fields on the existing `workspaces/{workspaceId}/members/{uid}` record to a public/global profile directory. This reuses `listMembers`, eliminates per-card profile document fetches, and makes removal of membership also remove its photo metadata.

Proposed fields: `displayName` (bounded, maximum 120 characters), `photoURL` (empty or approved HTTPS provider URL, maximum 2,048 characters), `profileUpdatedAt` (server timestamp). Keep existing `uid`, `role`, `emailLower`, invitation linkage, join metadata, and ownership semantics unchanged. Existing records lacking optional fields remain valid and use fallbacks.

Implement a narrow `updateOwnMemberProfile` adapter operation. It must update an existing own membership, not create a new one. A self-profile Rules branch must require authenticated current membership, a ready/active workspace, matching path UID and auth UID, valid field types and lengths, server timestamp, and an exact changed-field allowlist limited to presentation fields. It must not allow changing role, UID, email, invitation linkage, join data, owner identity, lifecycle state, or unknown fields. Keep role-change and ownership-transfer branches independent and unchanged in meaning. Validate optional profile fields on member creation too without broadening invitation acceptance.

Never loosen `users/{uid}` read access. Never use the photo or name to map assignments. `assigneeUids` remains the cloud authority and free-text local labels remain local.

Google/Firebase profile fields are untrusted display data. Use Google provider data when available but do not claim a stored photo is independently Google-verified: client Auth profiles can be editable. Sanitize strings, render names through `textContent`, and use an HTTPS image-host allowlist checked with parsed URLs. Start with `lh3.googleusercontent.com`; expand only to documented, tested Google profile-image hosts if necessary. Reject lookalike domains, credentials in URLs, unexpected ports, SVG/data/blob/javascript URLs, and arbitrary hosts. Keep the Rules-side URL constraint consistent with the client. Unsupported legitimate photos fall back to initials rather than relaxing security.

Image implementation: fixed dimensions, `object-fit:cover`, `referrerpolicy="no-referrer"`, asynchronous decoding and lazy loading where appropriate; one-shot error fallback, no retry loop. No proxy, downloads into persistent caches, base64 embedding, or photo URL copying into task records, exports, backups, analytics, logs, or screenshots. Explain that loading a Google-hosted image still sends an image request to Google; no-referrer does not eliminate network metadata.

### Rendering and roster lifecycle

Build one reusable person-badge renderer for account, card, assignment chooser, and members UI. Card badges should be about 26px, account badge 36px, picker rows about 32px; exact sizes are design targets.

Show at most three badge images on a card, then `+N` for remaining assignees. Preserve existing maximum assignment count of eight. Provide full readable names in the card details/assignment list and an accessible assignment summary. Do not rely only on native hover titles. Avoid adding eight tab stops per card or nesting buttons in the existing card-open button. Decorative image alt text should be empty when the parent already supplies the person's name.

Resolve UID to current member metadata, never by index in an old comma-separated name list. Prefer display name; use an existing permitted email fallback in the member chooser when needed, not an exposed raw UID. Absent member uses `Former member`; a missing/failed image uses stable initials or a neutral silhouette. Duplicate names must not collapse distinct UIDs. Local free-text assignees remain initials-only and must not be matched to Google accounts by name or email guesswork.

Use one active-workspace roster data source/cache shared by relevant UI. If adding a roster subscription to propagate opt-out/removal promptly, it must be a single active-workspace listener, not one per card. Record its read costs, reuse its results, and tear it down on workspace switch, return local, sign-out, access loss, or archive. Maintain generation guards on success/error/finally and image events. Clear account-scoped memory on session change. Do not keep persistent Firestore caching. Missing/denied roster data must safely degrade to non-sensitive placeholders, not reuse a prior workspace's faces.

### Deployment dependency

Client-only canvases and own-session avatars can ship without Rules changes. Shared team photos cannot be called complete until their Rules revision is separately authorized, published, and verified. GitHub Pages does not publish Rules. Preserve a client-only release path if Aaron defers the shared-photo gate; explicitly report that team photos remain disabled rather than weakening existing Rules.

## 5. Implementation sequence and accomplishment checkpoints

Only one step should be `in_progress`. Each step must end with the exact numbered completion summary, its actual verification, budget, commit, and production status. Planning statements below describe future outcomes, not completed work.

### Step 1 of 10: Pin the baseline and acceptance contract

Work:
- Recheck branch, worktree, full SHA, and deployed release. Do not assume the baseline has not advanced.
- Create `aesthetic/flowboard-personalization` from reviewed current main after preserving these planning files.
- Create `FLOWBOARD_AESTHETIC_PROGRESS.md` with all ten steps, one active step, evidence links, commits, and release blockers.
- Run baseline unit/static/build/budget, browser, Rules, and Emulator-browser suites. Record exact counts, not earlier chat counts.
- Capture desktop light/dark boards and dialog screenshots at 1280x720, 1440x900, 1920x1080, and resized 960x720, plus one proportional narrow check. Use synthetic metadata-rich cards with multiple assignees, long titles, due states, and lists.
- Record Rules hash locally and protect it from unintended changes before Step 7.

Pass: reproducible clean baseline and explicitly pinned safety boundaries.
Report: `Step 1 of 10 complete: Baseline, desktop fixtures, and visual acceptance criteria are pinned.`

### Step 2 of 10: Resolve the source-budget constraint safely

Work:
- Read `scripts/source-budget.mjs`, the source graph, and gzip classifier. Count every reachable new module and any added palette data; do not hide production data under uncounted artifacts or remote assets.
- Explain working-tree versus Git line endings. Do not change repository-wide line-ending policy casually or claim line-ending normalization is a feature-sized solution.
- Measure behavior-preserving opportunities, including adapter forwarding consolidation and truly duplicate CSS. Keep readable code, all safety copy, and existing exported contracts.
- Produce an allocation sheet for palette tokens, appearance dialog/storage, avatar renderer, and shared-member profile logic. Estimates must be labelled estimates until implemented.
- If safe recovery cannot fund the scope with a maintenance reserve, stop at one explicit budget decision: either approve a quantified new raw-source cap supported by fresh gzip/build evidence, or reduce/split scope. Do not silently raise any cap, shrink accessibility, code-golf the app, or proceed with failing budgets.
- Keep the initial/lazy gzip caps fixed unless separately approved with evidence. No guarantee is made that the entire plan fits the current source cap.

Pass: a measured, documented capacity path under existing limits or Aaron's explicit recorded cap-transition decision.
Report: `Step 2 of 10 complete: A measured source allocation supports the approved aesthetic scope.`
If blocked: `Step 2 of 10 blocked: Budget decision required`, with exact bytes and options.

### Step 3 of 10: Establish the reusable visual token system

Work:
- Extend `styles.css` with board-specific foreground/control/focus tokens and independent neutral surface tokens.
- Audit hard-coded white text, translucent controls, add-list, filters, chips, scrollbars, menus, and dialogs. Ensure pastel canvases do not inherit white board text.
- Harmonize type weight, radii, shadows, borders, control heights, and section rhythm without changing column scanning or content hierarchy.
- Keep semantic success/warning/danger separate from decorative palette accents. Explicitly test primary-button foregrounds in dark mode.
- Preserve forced-colors, reduced-motion, visible focus, read-only pointer closure, and sticky dialog actions.

Pass: Classic Flow light/dark retain all behavior, with a coherent token system and no clipping/contrast regressions.
Report: `Step 3 of 10 complete: Board, card, and dialog styling now share accessible visual tokens.`

### Step 4 of 10: Implement the curated canvas library

Work:
- Implement the eight named presets and their mode-specific values from the catalogue.
- Support Solid and Gradient; preserve full-height/background continuity and horizontal board scrolling.
- Keep the production palette representation compact and allowlisted; do not load planning HTML or duplicate the full palette list across several modules.
- Capture an actual-app comparison sheet with identical rich fixtures for each palette, not just empty swatches.
- Validate board foregrounds and controls across the full gradient, including hover, focus, and disabled states. Adjust proposed hex values if measurements require it and document final values.

Pass: all presets render cleanly on actual light/dark app surfaces and remain subordinate to tasks.
Report: `Step 4 of 10 complete: Eight coordinated canvas palettes offer solid and gradient finishes.`

### Step 5 of 10: Add personal appearance selection and persistence

Work:
- Implement the Appearance dialog, draft preview, Save/Cancel/Close/Escape/reset behavior, and Light/Dark/System selection.
- Add small adapter methods for the versioned separate appearance key; no direct storage writes in `app.js`.
- Preserve legacy theme choice and existing-user canvas. Listen to OS changes only while mode is System.
- Make local/cloud/viewer/archived-navigation appearance changes personal, non-mutating, and independent of board save/Undo/recovery flows.
- On cross-tab saved-preference updates, apply only when the local dialog has no unsaved draft; otherwise disclose the conflict and retain the local draft until the user decides. Ignore events for unrelated keys.
- Test malformed values, unsupported schema, denied/quota storage, reload, account switch, sign-out, imports, cloud transitions, and system-mode change.

Pass: appearance persists in this browser without modifying the raw strings of `flowboard-workspace` or `flowboard-data` during the appearance operations. Compare equality without printing values.
Report: `Step 5 of 10 complete: Users can preview and save personal appearance without changing shared work.`

### Step 6 of 10: Create resilient person badges and own-account photos

Work:
- Add the reusable badge renderer with synthetic safe/unsafe URL tests and name/initial fallbacks.
- Use current-session Google photo in account UI without publishing it to teammates.
- Add card badge layout using synthetic/local fixtures and initials until shared metadata is available.
- Honor Show photos/Use initials; when initials are selected, do not set image sources or issue photo requests.
- Test no photo, broken/slow image, disallowed host, duplicate names, no name, long names, photo load completing after sign-out, and fixed-size layout stability.
- Provide readable accessible summaries and preserve card-open keyboard behavior.

Pass: badges remain identifiable and stable under image failure and session changes; no extra OAuth permissions or cloud writes.
Report: `Step 6 of 10 complete: Reusable avatars show account photos safely and always retain name/initial fallbacks.`

### Step 7 of 10: Implement workspace-scoped photo sharing under strict Rules

Work:
- Implement optional member profile fields, narrow self-update adapter contract, and explicit share/refresh/stop-sharing controls.
- Do not backfill production users or automatically publish on sign-in. Keep archived member metadata retained and non-editable.
- Implement and document the exact Rules delta, including validated optional fields on creation and exact self-update field allowlist.
- Emulator-test owner/editor/viewer own-profile updates; anonymous/nonmember/cross-workspace/other-user denial; self-role escalation; forged UID/email/invite fields; unknown fields; bad URL/type/length/timestamp; missing membership creation; removed user; archived workspace; and profile opt-out.
- Rerun all existing invitation, ownership-transfer, self-leave, archive/restore, assignment, and direct-access Rules tests unchanged in intent.
- Prepare the Rules-publication handoff but do not publish it.

Pass: all new positive and negative tests pass, old permission boundaries remain intact, and production-dependent photo sharing remains disabled pending release authorization.
Report: `Step 7 of 10 complete: Emulator-validated member photo sharing preserves existing authorization boundaries.`

### Step 8 of 10: Integrate assignee identity throughout the desktop workflows

Work:
- Resolve cloud assignees from UIDs and workspace membership, not stale positional name strings.
- Add compact photo/initial stacks to card footers and name-plus-avatar rows to assignment and members dialogs. Reuse account badge styling. Comment/activity avatar expansion is optional only if budget allows; it is not required scope.
- Add one lifecycle-safe active roster source, reused across these views. No per-card Firestore listener or per-card profile query.
- Handle current/former members, missing profile fields, opt-out refresh, role changes, revoked access, and duplicate display names.
- Preserve viewer inspection and personal profile choices while all shared-card mutations remain denied. Member photos must not add a hidden mutation route.
- Show three badges plus overflow summary without obscuring due dates, labels, checklist status, move controls, or card title.

Pass: two isolated Emulator browser contexts see shared identity updates and opt-out/removal safely, with no cross-workspace image leakage and unchanged UID assignment semantics.
Report: `Step 8 of 10 complete: Cards and member workflows show consistent, readable assignee identities.`

### Step 9 of 10: Qualify visual quality, accessibility, resilience, and performance

Work:
- Run all palettes in Light/Dark and Solid/Gradient on desktop. System must resolve and react correctly. Test the representative worst cases at resized/narrow widths, not a mobile redesign.
- Capture before/after images using identical synthetic data. Inspect actual appearance: hierarchy, background continuity, card/list separation, dialog actions, many avatars, long names, long boards, and scroll cues.
- Measure normal text contrast at least 4.5:1, large text at least 3:1, and relevant UI/focus boundaries at least 3:1. Sample gradient interiors and composited controls, not just endpoint swatches. Automated Lighthouse alone cannot qualify every gradient state.
- Test keyboard-only appearance selection and cancellation, focus containment/return, forced colors, reduced motion, and 200% zoom/reflow. Record real browser zoom as manual unless actually exercised; resized viewport emulation is not native zoom proof.
- Run unit/static/build/budget/isolation, full built-preview browser suite, all Rules tests, and real adapter Emulator-browser workflows. Repeat the full browser suite three times against the final unchanged candidate.
- Run accessibility auditing on a built preview; require zero failed scored audits. Exercise every palette state with automated checks and inspect representative dialogs manually.
- Benchmark repeated 1,000-card fixtures with bounded synthetic members and served test images, both photos on and initials-only. Report median/max navigation, rendering, filtering, request counts, and errors. Compare against a same-machine baseline; investigate a greater-than-20-percent regression before accepting it. Document external-image timing as separate from local synthetic-image timing.
- Verify changing appearance sends no Firestore writes, no photo requests when disabled, no avatar data in board export/recovery, no raw private data in evidence, and no public em dashes.

Pass: all accepted presets and implemented identity paths meet the matrix with honest manual gaps and budget figures. No safety regression is traded for aesthetics.
Report: `Step 9 of 10 complete: Desktop visuals, accessibility, privacy, and performance passed the candidate matrix.`

### Step 10 of 10: Package the candidate and stop at the human release gate

Work:
- Produce an immutable source identity, final palette catalogue, before/after sheet, redacted validation manifest, actual test counts, Rules diff/hash, budget report, and rollback instructions.
- Update the progress ledger with real commit IDs; do not leave all completed rows saying pending commit.
- Verify a clean implementation branch and separate untracked evidence deliberately. Do not merge, push, deploy Pages, publish Rules, use real accounts, or test protected workspaces without new explicit authorization for this release.
- Prepare two precise release paths: full release with separately authorized Rules publication and real-account acceptance, or client-only appearance release with shared team-photo controls omitted/disabled.
- Full release order: verify the exact reviewed Rules revision is authorized and active before enabling dependent sharing controls; verify client PR and same-SHA CI; deploy; verify served build; anonymous smoke; then human owner/editor/viewer/nonmember tests on a newly authorized disposable workspace.
- Rollback: revert client via reviewed PR to the pinned baseline. Rules rollback is a separate authorized operation; retain additive optional fields unless a proven migration requires otherwise. Never delete member/task records as rollback cleanup.

Pass: implementation candidate is locally qualified and handed off, with every production action still clearly gated.
Report: `Step 10 of 10 complete: The aesthetic release candidate is packaged and awaiting explicit release authorization.`
Do not say deployed or production-accepted unless those later actions have actually occurred and been verified.

## 6. Verification commands and test discipline

Use repository-installed tools first. Do not install packages or browser binaries into user/system caches without the required one-off filesystem exception. All created files and explicit temporary profiles must remain inside `C:/Code/Stacie-Hermes`. Use existing installed system Chrome when Playwright's managed browser is unavailable.

Core commands from repository root:

```bash
npm.cmd run validate
npm.cmd run test:rules
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser
```

Before browser tests, build and start a dedicated strict-port preview on an unused port. Verify its HTTP readiness and production asset paths; do not reuse an unknown running process. Use the configured repo base path and verify it before running:

```bash
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4197 --strictPort
```

Run the already installed Playwright CLI, not a package-fetching fallback:

```bash
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' PLAYWRIGHT_BASE_URL='http://127.0.0.1:4197/UH-Flowboard/' node node_modules/@playwright/test/cli.js test tests/browser-smoke.spec.mjs --config=playwright.config.mjs --workers=1
```

Confirm the installed CLI path before using it. Include any new appearance/avatar specs in the full run and CI, not only a focused command. Add new unit-test files and syntax guards to package scripts; make the source graph validator count new production modules and palette assets. A passing legacy suite that never executes the new tests is not completion.

Use the parameterized `scripts/benchmark-mvp-v2.cjs` with 10 lists and 100 cards per list, dedicated preview URL, three output samples, and clean isolated contexts. Read its current environment variable names before invoking it. Close the browser in `finally` and pass fixture parameters into browser evaluation explicitly.

Store curated evidence under `artifacts/aesthetic/step-XX/`. Preserve only sanitized summaries and synthetic screenshots; do not commit auth logs, emails, UIDs, workspace identifiers, real photo URLs, cookies, credentials, tokens, local-storage payloads, or real-user faces. Never suppress a failed command with shell chaining and then report a pass.

## 7. Mandatory progress format for Luna

At step start:

```text
Step X of 10 in progress: [short goal]
Scope: [specific change]
Production boundary: unchanged; no deployment or production-data testing.
```

After verified completion:

```text
Step X of 10 complete: [summarized accomplishment]
Changed: [concrete outcome]
Verified: [actual commands/results and evidence]
Budget: [measured source and gzip values]
Commit: [real SHA and worktree status]
Production: [unchanged, or exact separately authorized state]
Next: Step Y of 10 - [goal]
```

A step is blocked if its acceptance criteria do not pass. Do not describe a partially working photo feature, mocked adapter test, screenshot-only contrast check, or exhausted source cap as complete. Do not claim independent review unless a reviewer actually performed it; otherwise call it repeated automated qualification.

## 8. Hard safety boundaries

- This request authorizes planning only. A model switch is not deployment authorization.
- Later implementation authorization allows isolated local implementation and synthetic tests, not automatic production Rules publication or real-account use.
- Never open or change `My Flowboard workspace`; leave `Lifecycle realtime probe` untouched.
- No normal browser profile, real Google credentials, private payload dump, background migration, or administrator console data writes.
- Preserve exact raw-string equality for the protected local workspace keys around appearance and auth transitions; do not print their values.
- Preserve retained archive/restore semantics and the exact stale-conflict message: `This workspace changed in another session. Refresh and try again.`
- Preserve existing required lifecycle labels, including `Cloud workspace · archived · retained` and `Cloud workspace · owner · editable` in their proper UI contexts.
- No weakening of Firestore authorization, persistent Firestore cache, paid infrastructure, or broader OAuth scopes.
- No public-facing em dashes.
- Only work inside `C:/Code/Stacie-Hermes`, except separately approved exceptions. Do not update profile-level skills/configuration as part of this implementation.

## 9. Luna handoff prompt

```text
Read UH-Trello/FLOWBOARD_AESTHETIC_PERSONALIZATION_PLAN.md in full.
Implement its 10-step desktop-first plan on a new isolated branch after checking the current repository state. Preserve the planning artifacts and existing user work.
Report Step X of 10 in progress and Step X of 10 complete with a summarized accomplishment, actual verification, measured budgets, real commit, and production boundary.
Resolve Step 2's budget gate honestly. No cap increase is preapproved.
Use the optional workspace-scoped Google photo design, keep assigneeUids authoritative, and retain name/initial fallbacks. Do not expose global user profiles or add Gmail/People scopes.
Use synthetic browser and Auth/Firestore Emulator fixtures only. Keep shared-photo controls production-gated until the new Rules revision is separately approved and verified.
Do not access protected workspaces, real accounts, normal browser profiles, or production data. Do not push, merge, deploy Pages, or publish Rules.
Finish with the verified candidate package and exact manual release gate, not a claim of production acceptance.
```

## Links and planning artifacts

- [[FLOWBOARD_COMPREHENSIVE_POLISH_PLAN]]: earlier desktop polish plan, historical baseline rather than new implementation authority.
- [[FLOWBOARD_POLISH_PROGRESS]]: earlier implementation ledger.
- [Live application](https://kcchanai.github.io/UH-Flowboard/).
- [Firebase: Manage Users, current-user and provider profile fields](https://firebase.google.com/docs/auth/web/manage-users). This documents current-user `photoURL` and provider data; it does not grant a client permission to browse all users' profiles.
- `artifacts/aesthetic-planning/audit.mjs` and `audit.json`: reproducible anonymous visual audit and sanitized observations.
- `artifacts/aesthetic-planning/live-light-1440.png`, `live-dark-1440.png`, `live-card-editor.png`: current-site observations.
- `artifacts/aesthetic-planning/palettes.json`: proposed color values.
- `artifacts/aesthetic-planning/preview.mjs`, `canvas-concepts.html`, `canvas-concepts.png`: standalone synthetic concept sheet, not production app implementation.
- `artifacts/aesthetic-planning/source-baseline.json`: measured Git/working-tree source sizes and line-ending difference.
