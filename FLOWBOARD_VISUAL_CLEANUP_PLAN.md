# Flowboard comprehensive visual cleanup plan

Status: **Ready for gpt-5.6-luna implementation handoff. Planning only; implementation has not begun.**

Prepared: 2026-09-18 HST
Repository: `C:/Code/Stacie-Hermes/UH-Trello`
Public application: https://kcchanai.github.io/UH-Flowboard/
Planning baseline: `main` at `a9d2ff46add71aa246da468ff2e343cce47dd276`
Rules Git blob SHA-1: `5d7e06e02bb679db2b1a31605cf81deb3f9a9e9a`

## 1. Objective and authority

Aaron requested a comprehensive visual/aesthetic cleanup, explicitly including Account, Cloud workspaces, Members and invitations, and the workspace-status/Board actions/Start here toolbar. This document is the requested detailed plan for a model handoff, not authorization to start implementation or deploy.

Deliver a calmer, consistent office application: readable identities, aligned controls, predictable spacing, intentional responsive wrapping, clear action hierarchy, accessible contrast, and robust dialogs. Preserve the familiar Flowboard brand, existing palettes, workflows, and local/cloud safety model. This is not another feature expansion or a mobile redesign.

When Aaron switches models and authorizes implementation, follow the ten steps below. Send a concise **"Step X of 10 complete"** update immediately after each verified checkpoint. Do not announce a step complete merely because code was written.

Default implementation stop: **verified local release candidate**. Push, PR creation, merge, Pages deployment, Rules publication, and real-account testing require separate explicit authorization. The prior release authorization applied to the previous product-polish release; it is not a standing authorization for this new pass.

## 2. Planning evidence and limitations

Evidence directory: `artifacts/visual-cleanup-planning/`

- Visually reviewed all four user-supplied screenshots. Do not copy their personal identifiers into fixtures, tests, notes, or published screenshots.
- Anonymous live audit: `audit-live.cjs` and `live-audit.json`, with twelve captures. Board at 1280x720, 1440x900, 1920x1080, 960x720, 390x844, and 320x720. Additional 1440x900 captures: List, card detail, signed-out Account, Appearance, quick-add, and dark Board.
- Synthetic source audit: `audit-synthetic.cjs` and `synthetic-audit.json`, with six captures. Real repository HTML, CSS, and Account/cloud/member controllers, fake adapters, intercepted network, synthetic identities, desktop and 390px contexts. No Firebase backend and no real account.
- Both final audit runs recorded zero console errors and zero page errors. The anonymous captures showed no page-level horizontal overflow. These are planning observations, not a full regression qualification.
- Synthetic desktop Cloud workspaces reproduced **two zero-width workspace-name elements** and two overflowing row containers. Synthetic Members reproduced overflowing containers at desktop and narrow sizes.
- `concept.html` and `concept-contact-sheet.png` show proposed geometry using identical synthetic content in light and dark. They are design direction, not working application changes, responsive proof, or permission enforcement.
- Source review included shared CSS, actual dialog markup, runtime initialization, auth/cloud/member controllers, lazy appearance/List/quick-add styles, preferences, profile Rules guards, and existing browser fixtures.

Some early screenshots were taken before asynchronous lazy panels rendered. They were rejected and overwritten after explicit visible-state waits. The final files are the authoritative captures. Future tests must wait for the requested panel/view/theme, not merely the click returning.

Authenticated production states are evidenced only by the supplied screenshots. The local synthetic reproduction does not qualify authentication, transactions, or Rules. No protected workspace was opened and no signed-in browser profile was inspected.

## 3. Diagnosis and prioritized fixes

### A. Account, example 1: spacing and action hierarchy

Observed:
- Photo actions nearly touch the local-data notice.
- Unused status/footer space is larger than the separation between meaningful sections.
- Appearance, Sign out, and Cloud workspaces appear as undifferentiated peers.
- Workspace section label and workspace name have similar weight.

Source:
- `index.html`: `#account-dialog`, `#account-workspace-section`, `#workspace-profile-section`, `#account-safety`, `#account-status`.
- `styles.css`: `.detail-section`, `.dialog-actions`, `.collaboration-notice`, `.account-status`.
- `src/auth-ui.js` and `src/members-ui.js` own real session/profile state.

Direction:
- Identity, current workspace, and photo sharing become distinct stacked groups.
- Keep photo actions next to their explanatory text, with at least 16px before the safety notice.
- Separate session action from navigation actions in a wrapping footer. Sign out need not be red.
- Keep all share/refresh/stop/retry states and the exact existing local-data guarantees.

### B. Cloud workspaces, example 2: identity/action collision

Observed and reproduced:
- The workspace title can shrink to zero width.
- Nonwrapping role/status text extends over Open.
- Strong red Archive visually dominates the more common Open action.
- Footer actions are squeezed into tall, awkward multi-line buttons.

Source:
- `#cloud-workspaces-dialog` has a class but no dedicated width rule and falls back to the generic 440px dialog.
- `.workspace-entry` allocates `minmax(0,1fr) auto`, while `.workspace-board` is a flex row with a 16px gap and nonwrapping metadata.
- The same `.workspace-board` rules are reused for local board buttons, noninteractive cloud summaries, member rows, and invitation history, despite different content needs.
- The narrow layout breakpoint is viewport-based. A 440px dialog in a wide desktop viewport still uses the cramped desktop row layout.

Direction:
- Use an explicit wide chooser size and component-specific identity/actions layout.
- Workspace name above role/lifecycle metadata; actions alongside only when content fits, otherwise below.
- Keep identity visible for active AND archived rows. Do not hide overflow as a substitute for readable names.
- Open is the primary row action; Rename secondary; Archive restrained but clearly consequential. Preserve confirmations and retention wording.
- Wrap footer into intentional groups; state that members/activity/export target the currently open workspace, not an arbitrary row.

### C. Members and invitations, example 3: cramped controls and clipping

Observed and reproduced:
- Generic narrow modal contains wide forms and multi-control rows.
- Small, inconsistently styled native role selects.
- Member identity, current role, role picker, and Remove compete on one line. Some actions are pushed outside the visible panel.
- Ownership transfer action is clipped, a high-priority visibility/safety defect.
- Invitation history uses the same nonwrapping row as the workspace picker.
- User screenshot shows adjacent scrollbars. Exact scroll ownership must be measured before restructuring.

Source:
- `#workspace-members-dialog` has only the generic `.dialog` class.
- Invite and transfer forms reuse `.new-board-form` with `1.4fr 1fr auto` columns.
- Base font inheritance omits `select`; generated role selects lack the shared field treatment.
- `src/members-ui.js` generates member/invitation rows using `.workspace-board`.
- Native accessible confirmations already exist for role changes, removal, leave, revoke, transfer, and stopping photo sharing. Preserve them; do not invent a new access workflow.

Direction:
- Wide desktop access-management dialog with one clearly owned main scroll surface.
- Explicit sections: Invite, Members, Ownership, Invitation history.
- Responsive field groups; email input gets real usable width; all controls and labels remain fully visible.
- Member identity above metadata, separate action group, consistent select styling, explicit current-account/role text.
- Ownership gets a separated consequence explanation; retain successor selector, former-owner-role selector, existing confirmation, and mutation flow.
- Invitation status is separate from recipient metadata. Preserve pending Copy link/Revoke and accepted/expired/revoked distinctions.

### D. Toolbar, example 4: misalignment and competing controls

Observed and measured:
- At 1440x900, Board actions is 38px high, workspace status 30px, and Start here approximately 42.3px.
- Start here has a 16px bottom margin inherited from `.collaboration-notice`. It sits roughly 8px above its neighbors.
- The disclosure is native `<details><summary>`, not a play/video action. Preserve disclosure semantics.
- The whole header mixes search, summary, filters, view, density, creation, status, menu, and onboarding with incidental wrapping.

Direction:
- Separate compact disclosure styling from explanatory notice styling.
- Common centerline and action height, shared typography and icon geometry.
- Keep workspace status truthful and distinct from buttons. Do not make noninteractive `#collaboration-summary` look like a selector.
- Preserve clickable top-bar workspace status and its chooser route separately from Boards.
- Regroup the full header, not merely these three elements. Move existing controls; never duplicate search, filters, view, or density listeners.

### E. Wider cleanup, not limited to examples

- Board header: deliberate rows/groups, clear Add card emphasis, less fragmented whitespace, better narrow summary wrapping.
- Cards: retain content-driven heights and Comfortable/Compact behavior; normalize label, checklist, due, avatar, title, and action spacing with rich synthetic cards. Empty starter metadata is not proof of missing features.
- List: align headings and cells; quiet empty status values rather than making "None" visually dominant; preserve sorting, pagination, filtering, and opening card details. Keep horizontal scrolling within the table region when needed.
- Card details: normalize Title/Description spacing and section rhythm; keep footer reachable with long content, no lost draft/Cancel behavior.
- Quick add: add separation between destination and the optional detail checkbox; preserve multiline title and Ctrl/Cmd+Enter, not a field-behavior redesign.
- Appearance: palette description columns are cramped; improve tile layout and secondary text without removing names, changing palette IDs, or adding new preferences.
- Remaining dialogs: local Boards/new board, import, archive, recovery, migration, invitation acceptance, activity, move, reset, comment deletion, lifecycle and member confirmations.
- Menus/popovers: predictable padding, edge placement, visible focus, selected/disabled states, and consistent icon geometry.
- Toasts/status/errors: consistent spacing, readable severity, no data disclosure or unexpected layout jumps.
- Dark mode: retain neutral opaque task surfaces; measure text/action contrast rather than assuming tokens with light-theme foregrounds remain safe. Particularly inspect white text on light-blue primary or salmon danger fills.

Not a defect to "fix" here: a card in a list named Done is not automatically `completed`. Do not change completion semantics or migrate data for aesthetics. If approved copy can clarify the summary, say "marked complete" while preserving computation and tests.

## 4. Design specification

### Visual language

- Keep existing Classic Flow default and all existing palette identifiers. No rebranding, gradients behind form text, external fonts, icon libraries, framework, or new dependencies.
- Existing spacing scale: 4, 8, 12, 16, 24, 32px. Prefer 8px within compact action groups, 12px between fields, 16px between row identity and actions, 24px between meaningful sections.
- Typical dialog padding: 24px desktop, 16px narrow. Dense row padding: 12-16px. Use tokens or a small shared rule, not one-off margins everywhere.
- Body/control text 14px; ordinary secondary metadata 13px; small captions minimum 12px where feasible. Do not solve overflow by shrinking text.
- Dialog heading approximately 22px; board title 24-26px; section heading 14-16px. Use regular/medium weights for explanatory text and stronger weights for headings/primary information.
- Default desktop controls approximately 40px tall; coarse-pointer targets at least 44x44px. Preserve existing larger accessible targets. Noninteractive badges may be shorter, but share the visual centerline.
- Shared border radii: about 8px controls, 10-12px rows/cards, 15px dialogs. Reserve pills for statuses and filters, not every action.
- Primary action: blue, readable foreground. Secondary: neutral surface/border. Consequential action: restrained danger text/outline, with filled danger treatment primarily in deliberate confirmations. Disabled is visibly disabled but still readable.

### Dialog structure and dimensions

Preferred widths, bounded by the viewport:
- Small confirmations: 440-480px.
- Quick add: around 520px.
- Account/local chooser: 640-680px.
- Cloud workspace chooser: around 760px.
- Members and invitations: around 840px.
- Card detail and Appearance: retain roughly 740-760px unless measured content warrants adjustment.

Use a bounded modal shell with an explicit scroll owner. Preferred pattern: header / minmax(0,1fr) body / optional footer, with `max-height` based on the available dynamic viewport and 12-16px outer clearance. Header Close and important footer actions remain reachable. Allow controlled footer wrapping at short/narrow sizes. Do not create an outer dialog scrollbar plus another full-height card scrollbar. Purposeful nested lists such as card activity can remain scrollable only if they do not obscure controls or create keyboard traps.

Preserve native `<dialog>` behavior, real labels, focus trapping, Escape, actual-opener focus return, and dirty-draft confirmation. Preserve stacked-modal flows or deliberately test any navigation adjustment; do not close a parent dialog just to make a screenshot cleaner.

### Row and responsive contracts

- Use dedicated classes or scoped rules for cloud workspace identity, member rows, invitation rows, local board buttons, and archive rows. Do not change every `.workspace-board span` globally to solve one surface.
- Text columns use `min-width:0`; metadata wraps; long tokens use `overflow-wrap:anywhere` where appropriate.
- Names remain readable. Safety-critical target names must not be silently clipped. On smaller component widths, stack actions below identity rather than stealing the identity column.
- Apply layout decisions to actual component space, not only the global viewport. Container queries or safe wrapping grids are acceptable without dependencies. Test a 440px dialog on a 1440px desktop explicitly.
- Forms use shrink-safe columns and stack before inputs or action labels become unusable. Do not depend on `overflow:hidden` to pass width assertions.
- Main toolbar groups: board identity/context, search/filtering, work/view actions. Keep Add card, view and density discoverable; Start here remains available but lower emphasis and expands a full-width explanation without displacing unrelated controls unpredictably.
- Preserve horizontal Kanban navigation. No forced equal-height columns, tiny columns, or page-level horizontal scrollbar. Keep Board actions > Add a list as a visible alternative to the board-end affordance.
- Keep all read-only navigation and Close controls usable. Disable/hide only mutations, not inspection, search, menus needed for export, or return-to-local.

### Concept interpretation

The contact sheet shows a reduced toolbar fragment and illustrative modal content, not a replacement action inventory. Implementation must preserve every existing control and state, including fields/confirmations not exercised in the concept. Role labels, Synced, Accepted, and archived states are synthetic design examples, not live backend assertions. Long-content, constrained-height, responsive, keyboard, and contrast checks below are the acceptance criteria, not a pixel match to the unconstrained concept.

## 5. Safety and scope boundaries

- Only affect files under `C:/Code/Stacie-Hermes`. Use workspace-local temporary browser profiles and artifacts; do not inspect normal browser profiles or real `.env`/credentials.
- Never open or mutate protected workspace `My Flowboard workspace`.
- Leave `Lifecycle realtime probe` untouched. Use new local synthetic fixtures and disposable Emulator projects only.
- No Firestore schema, Rules, adapter authorization, transaction, identity, or persistence changes are expected. If truly necessary, stop and propose separately.
- No auth scopes, Google APIs, backend, paid service, upload, persistent Firestore cache, or machine dependency changes.
- No production sign-in, real invitation, profile sharing, member change, transfer, rename/archive/restore, cloud export, or migration during automated visual work.
- Preserve UID/member-ID authority. Photos are optional workspace-scoped presentation, self-only sharing, exact HTTPS `lh3.googleusercontent.com` host, initials/broken-image fallback, no authorization based on names/photos.
- Preserve local-first storage isolation, revision/conflict behavior, realtime lifecycle, stale async response guards, read-only restrictions, and explicit mutation confirmations.
- Do not log raw `flowboard-workspace`, `flowboard-data`, tokens, IDs, emails, config, cookies, or payloads. Compare raw strings privately and report booleans/counts. Synthetic fixtures use `example.test` and unmistakably fake IDs.
- Public UI copy must contain no em dashes.
- No unrelated cleanup or generated artifact churn. Leave pre-existing previews such as 4173 and 4214 alone.

## 6. Budget decision gate

Fresh on-disk file-size inventory at planning baseline:
- Enumerated production source sum: 265,658 / 300,000 bytes, 34,342 bytes remaining.
- `index.html`: 26,745 / 27,250 bytes, 505 remaining.
- `styles.css`: 29,315 / 40,000 bytes, 10,685 remaining.
- `src/members-ui.js`: 11,974 / 12,000 bytes, **26 remaining**.
- `src/cloud-workspace-ui.js`: 12,919 / 13,000 bytes, **81 remaining**.
- `src/auth-ui.js`: 7,247 / 8,000 bytes, 753 remaining.
- `src/appearance-ui.js`: 9,332 / 10,000 bytes, 668 remaining.

Last release evidence, NOT freshly rebuilt planning measurements:
- Unconfigured initial-shell gzip 25,942 / 26,250 bytes.
- Configured CI initial-shell gzip 26,053 / 26,250 bytes: only 197 bytes remaining.
- First-party lazy gzip 55,798 / 58,000 bytes.
- Document gzip 5,997 bytes.

Current checkout byte sizes differ from archived release measurements. Do not mix on-disk byte sums, graph-validation measurements, CRLF/LF effects, built bytes, and gzip totals. Step 1 must remeasure the actual validator and both build configurations.

Implementation approach:
1. Consolidate shared layout rules and remove proven redundant declarations before adding large shell CSS.
2. Keep component-only styles with existing lazy modules or a deliberately registered shared lazy stylesheet/module if measurement justifies it. Do not move boot-required layout into a delayed chunk that causes a layout flash.
3. Preserve safety copy, accessibility names, controller boundaries, and static guards. Do not solve budgets with unreadable wholesale source minification.
4. Measure raw graph, file caps, initial shell, first-party lazy graph, and document separately after each UI step.
5. If cap changes are necessary, record before/after values, measured needed delta, maintenance margin, and alternatives. Previous budget approval belonged to product polish; obtain or confirm explicit approval for this new pass before raising caps. Do not silently assume it carries forward.
6. Update budget definitions, evidence, and final manifest together if a transition is authorized. Maintain configured-build coverage because CI injects configuration and changes output size.

## 7. Ten-step implementation sequence

Every step depends on the previous verified checkpoint. Maintain `FLOWBOARD_VISUAL_CLEANUP_PROGRESS.md`, with exactly one step `in_progress` and evidence under `artifacts/visual-cleanup/step-XX/`. Create this ledger when implementation is authorized, not as a claim work already happened.

### Step 1 of 10: Pin baseline and reproduce the visual defects

Work:
- Read this plan, the planning audit, current project rules, and relevant static-web/emulator skills.
- Confirm current main SHA and clean/unrelated changes; preserve this untracked plan and planning artifacts. If main moved, document a delta rather than blindly pinning stale source.
- Create isolated `luna/visual-cleanup` from verified main. Stage only intended planning/implementation artifacts when committing; do not overwrite older polish plans.
- Inventory all static and dynamic dialogs, controls, role states, and lazy CSS owners.
- Run baseline unit/static/build/budget/Rules/Emulator/browser/accessibility checks. Record actual counts, not historical expected totals.
- Reproduce all four examples with actual DOM and fake adapters, not a replacement `document.body` lacking production classes. Reuse the planning reproduction as a starting point, then register proper assertions.
- Capture light/dark and narrow/short before images, including long workspace names, many members/invites, rich cards, and archived identities.
- Resolve budget feasibility before implementation; report a cap decision only if required.

Acceptance:
- Baseline identity and Rules blob recorded; pre-existing failures separated from new failures.
- Reported collisions reproduced by geometry, not only screenshots.
- Synthetic network isolated; no duplicate controller initialization or real cloud traffic.
- Baseline test runner waits for true visible lazy state.

Update: **Step 1 of 10 complete: baseline pinned, reported layout defects reproduced, and test/budget baseline recorded.**

### Step 2 of 10: Establish shared visual and dialog foundations

Work:
- Normalize spacing, type hierarchy, inputs including `select`, buttons, icons, focus rings, notice variants, and action groups.
- Add scoped modal sizes, shrink-safe form primitives, bounded scroll structure, and reusable identity/action row patterns.
- Separate toolbar disclosures from informational notice styling.
- Keep `[hidden]` authoritative and control states mutually exclusive.
- Limit broad CSS changes; give clear ownership to core styles versus component lazy styles.

Acceptance:
- Representative small/large/short dialogs contain their content and expose pointer Close.
- Ordinary buttons align and fields inherit the intended font.
- No regressions to hidden controls, keyboard focus, native forms, light/dark modes, and lazy loading.
- Syntax/static/build/budgets/unit and affected browser checks pass.

Update: **Step 2 of 10 complete: shared spacing, controls, and dialog layout foundations are consistent and verified.**

### Step 3 of 10: Clean up the complete board header and toolbar

Work:
- Regroup title/context, search/filtering, and work/view actions.
- Align workspace summary, Board actions, and Start here; remove the inherited notice-margin offset.
- Style disclosure summary deliberately without replacing native keyboard semantics.
- Make summary wrapping intentional; retain filters, counters, view/density state and Add card visibility.
- Preserve top-bar Boards versus workspace-chooser scope, account entry, and Appearance access.

Acceptance:
- Board actions and collapsed Start here share height and vertical centers within 1px at the same row; passive status can be shorter but centered.
- No overlap at all viewport sizes and long workspace names. Expanded Start here uses a deliberate region.
- Search remains unique and board-scoped; `/` shortcut still respects editable controls.
- Both themes, view modes, densities and local/cloud/read-only status variants pass.

Update: **Step 3 of 10 complete: board controls are grouped, toolbar alignment is fixed, and responsive wrapping is intentional.**

### Step 4 of 10: Refine Account and profile presentation

Work:
- Introduce consistent identity/workspace/photo section rhythm and explicit gap before safety notice.
- Rebalance footer grouping and status space without deleting live-region feedback.
- Make long names/emails/workspace labels safe; render images at fixed size with existing fallback.
- Preserve account-first photo controls and Appearance navigation.

Acceptance:
- Signed out, signed-in local, cloud owner/editor/viewer, checking, shared/unshared/no-photo, retry/error states fit.
- At least 16px separation between photo action group and following notice.
- No duplicate photos/listeners; no extra session fanout when Account merely opens.
- Close and return focus work; presentation-only interaction leaves raw workspace/data unchanged.

Update: **Step 4 of 10 complete: Account sections, photo controls, and footer actions have clear spacing and hierarchy.**

### Step 5 of 10: Rebuild cloud chooser row geometry and footer grouping

Work:
- Use dedicated chooser width and row structure: persistent identity block plus responsive action group.
- Remove zero-width name/metadata-over-action failure.
- Keep archived identity and retained status separate from buttons.
- Group current-workspace navigation/export controls and label their target from active mode, not the last listed row.
- Recheck local Boards chooser separately so cloud-specific styling does not regress local navigation.

Acceptance:
- Both short and maximum-length workspace names remain readable at desktop, 440px component width, and narrow widths.
- No identity/action text intersection. Primary names have positive, useful width, not just a 1px pass.
- Open/Rename/Archive and Restore visibility survives real renderer rerenders and synthetic archive/restore transitions.
- Owner/editor/viewer, active/archived/migrating/error/empty states preserve permissions and truthful wording.
- Footer labels wrap deliberately without clipped actions; return-local and focus paths pass.

Update: **Step 5 of 10 complete: cloud workspace names and actions no longer collide, with readable archived rows and a responsive footer.**

### Step 6 of 10: Polish Members, invitations, and ownership controls

Work:
- Give access management a dedicated desktop width and safe inner scrolling.
- Separate invite form, member list, ownership, and invitation history.
- Use production row classes with shrink-safe identity, readable role, consistently styled role select, and visible actions.
- Stack constrained forms before they overflow. Keep existing role values, successor eligibility, and confirmation flows.
- Put recipient metadata and invitation state on separate readable tracks; preserve pending link/revoke controls and clipboard failure fallback.

Acceptance:
- Long names and long valid emails, owner/editor/viewer, current user, no eligible successor, many members, and mixed invitation states fit.
- Every Remove/Leave/Transfer/Copy/Revoke control is visible or reachable by intentional vertical scrolling, not hidden horizontally.
- No duplicate full-dialog scrollbar. Test full scroll range and topmost stacked confirmations.
- Selecting a role or transfer target does not bypass confirmation; cancelling causes zero adapter mutations.
- Preserve owner-only controls, async generation guards, local storage equality and hidden-state behavior.

Update: **Step 6 of 10 complete: member and invitation layouts are readable, controls stay visible, and ownership actions remain clearly separated.**

### Step 7 of 10: Harmonize Board, List, and card editing surfaces

Work:
- Refine existing card/list padding, title/metadata rhythm, labels, due/checklist chips, avatars, menus, empty states, and row alignment.
- Use rich fixtures, including long titles, many labels, assignments, description/checklist markers, and due states.
- Tune List typography and neutral empty status treatment without changing projection or completion meaning.
- Normalize card-detail field and section gaps, footer action grouping, and long-content scrolling.
- Maintain Comfortable/Compact differences and intentional board/table scroll areas.

Acceptance:
- Both views show the same filtered tasks; sort/pagination and row-to-card focus return remain intact.
- Card Save/Cancel/Close, unsaved-change prompts, failed-save retention, move/archive/duplicate and read-only inspection pass.
- UID-backed assignment and optional shared-photo behavior unchanged.
- No forced artificial column heights or overly compact body text; no page overflow.

Update: **Step 7 of 10 complete: Board, List, and card details share consistent spacing and readable metadata without changing workflows.**

### Step 8 of 10: Finish all remaining dialogs, menus, and feedback states

Work:
- Audit and polish Appearance, quick add, local Boards/new board, archive, recovery, import, cloud migration, invite acceptance, activity, move/reset, comment deletion, workspace lifecycle and member confirmations.
- Give palette tiles adequate text width; preserve existing preference scope, preview/Save/Cancel/reset and reload behavior.
- Fix quick-add destination/checkbox adjacency while preserving capture semantics.
- Standardize callouts, empty/loading/error messages, toast placement, menu row spacing, and edge-aware popovers.
- Keep high-impact actions distinct and ensure every dialog has reachable pointer dismissal appropriate to its flow.

Acceptance:
- Surface inventory marks every listed surface tested, intentionally unchanged with evidence, or blocked with a specific reason. No generic "other dialogs done" claim.
- Empty, loading, success, validation failure, storage failure and read-only states do not overlap controls.
- Safety messages and confirmations remain intact; no new schema/preferences/URLs or hidden uploads.
- Appearance raw workspace equality and preference persistence pass; no em dashes in public copy.

Update: **Step 8 of 10 complete: remaining dialogs, menus, and feedback states are visually consistent and checked.**

### Step 9 of 10: Run the comprehensive visual and accessibility matrix

Work:
- Execute the matrix in Section 8 using final component layouts, rich synthetic fixtures, and built assets.
- Capture matching before/after views; review actual images, not only DOM dimensions.
- Measure contrast across supported palettes/themes/finishes, visible focus, hit areas, zoom/reflow, short windows and forced colors.
- Add robust geometry regressions for the four supplied examples and all reproduced overflow failures.
- Triage and fix every new blocking visual/accessibility issue, then rerun affected and full suites.

Acceptance:
- No unreviewed screenshot, unlabeled synthetic evidence, unreadable identity, clipped safety action, or unexplained page overflow.
- No expected/unexpected console failures hidden by blanket filtering.
- Existing accessibility gate remains score 1 and zero failed audits; active-dialog checks complement the home-page Lighthouse run.
- Zero unresolved P0/P1 visual defects. Lower-priority exceptions are explicit and do not compromise readability or access.

Update: **Step 9 of 10 complete: responsive, theme, keyboard, contrast, and visual-regression checks pass.**

### Step 10 of 10: Qualify and package the local release candidate

Work:
- Rerun the complete final-source validation chain, unconfigured and synthetic-configured builds/browser checks, Rules and tracked Emulator-browser workflow, accessibility, production isolation and performance checks.
- Remeasure all budgets; record exact commands/counts and source SHA.
- Verify Rules byte identity to baseline and raw-storage invariants.
- Package README, manifest, screenshot index, audit disposition, budget history and a self-contained manual acceptance handoff under `artifacts/visual-cleanup/release-candidate/`.
- Clean only owned preview/Emulator/temp/test residue; retain intentional evidence. Commit local checkpoints, report clean worktree and branch state.
- Stop. Do not push, open PR, merge, deploy, publish Rules or test real accounts.

Acceptance:
- Evidence matches the exact final source, not a pre-fix commit.
- All ten checkpoints verified; no omitted named criterion or unsupported test-count claim.
- User-facing report explains what is implemented locally, what automation verified, and what awaits production authorization.

Update: **Step 10 of 10 complete: the fully verified local visual-cleanup release candidate is packaged and ready for release authorization.**

## 8. Required verification matrix

### Viewports and display conditions

- Desktop-first: 1280x720, 1440x900, 1920x1080.
- Resized office window: 960x720 and 960x540.
- Narrow non-regression: 700x720, 390x844, 320x720.
- 200% browser zoom or a documented equivalent reflow/text-enlargement test; device scale factor alone is not browser zoom.
- Light, Dark, and System changes; both densities; Board and List.
- All existing canvas palettes and both finishes for control/text contrast and foreground consistency. Capture full representative Classic Flow, one pale palette, and Graphite; use a contact sheet for the remainder.
- Keyboard-only, coarse pointer, reduced motion, forced colors, and no-image/initials modes.

### Data/state conditions

- Local starter and member-rich synthetic board; empty board/list; 1,000-card performance fixture.
- Short and long titles, maximum-length workspace name, unbroken email-like strings, multiple labels, due/checklist states, multiple avatars, broken photo fallback.
- Signed out / signed-in local / owner / editor / viewer, only through isolated test adapters or emulators.
- Archived and migrating workspace rows, loading/empty/unavailable/error states.
- Many members/invites; pending/accepted/expired/revoked invitations, copied-link failure, disabled/no-successor transfer, current-user identity.
- Long card description/checklist/comments/activity; unsaved draft and actual storage-boundary failure.

### Geometry and visual pass criteria

- At every viewport: document width no greater than viewport width, allowing at most 1px rounding tolerance. Board lanes and List table may scroll horizontally inside their explicit container.
- No dialog has unintended horizontal scrolling. Child rows/forms/buttons remain within the usable dialog body; verify bounding rectangles and text-range bounds, not only `scrollWidth`.
- Names and metadata do not intersect action labels. Archived target identity remains visible next to Restore.
- Toolbar same-row action height/center alignment within 1px; no inherited notice margin on collapsed disclosure.
- No touch target below 44px for coarse pointers; check selects, summary, text actions and icon controls as well as `.button`.
- At short heights, close/cancel/confirm/save controls are reachable. Programmatically scroll and test pointer hit targets with `elementFromPoint`; being attached to DOM is insufficient.
- No double full-dialog scrollbars, lost focus, clipped focus ring, invisible selected state, or moving controls caused by empty status placeholders.
- Normal text contrast at least 4.5:1; large text and meaningful control/focus boundaries at least 3:1 where applicable. Check composited colors and gradient interiors. Disabled controls must remain reasonably legible even where WCAG exceptions apply.
- Screenshot reviewers distinguish defects from intentional content-driven card heights, board scrolling, disclosure markers, and focus outlines.

### Behavioral/data pass criteria

- Existing browser critical workflows remain passing, including local persistence/undo/import/export, draft safeguards, Account/profile routes, preferences, cloud-view transitions, member confirmations and lifecycle renderer refresh.
- Raw `flowboard-workspace` AND legacy `flowboard-data` strings remain unchanged for nonmutating presentation/navigation operations. Preserve null-as-null; emit only comparison booleans.
- Mutation confirmations: cancel sends zero writes; confirmed test mutations use only fake adapters or Emulator fixtures and retain expected payload/authorization behavior.
- Signed-in/read-only actions stay scoped and UID-backed. No event duplication or stale async repaint.
- Real markup integration coverage is required. Existing tests that replace `document.body.innerHTML` are useful controller contracts but do not qualify production CSS or dialog geometry.

### Reproducible command families

Run from `C:/Code/Stacie-Hermes/UH-Trello` using existing installed tools. Do not install machine dependencies or write user-level package caches without approval. If a required tool is missing, stop and request a bounded exception or use an already installed equivalent.

```bash
npm.cmd run validate
npm.cmd run test:rules
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npm.cmd run test:emulator-browser
npm.cmd run build
npm.cmd run measure:mvp-v2
node scripts/validate-test-isolation.mjs
```

Choose an unused strict port owned by this run, for example 4260 only after checking availability. Start the preview through a tracked background process, then perform an HTTP readiness check, not a blind delay:

```bash
npm.cmd run preview -- --host 127.0.0.1 --port 4260 --strictPort
# In a separate tool call after startup:
curl --fail --silent http://127.0.0.1:4260/UH-Flowboard/ >/dev/null
PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' PLAYWRIGHT_BASE_URL='http://127.0.0.1:4260' npx.cmd --no-install playwright test tests/browser-smoke.spec.mjs
CHROME_PATH='C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' npx.cmd --no-install lighthouse http://127.0.0.1:4260/UH-Flowboard/ --only-categories=accessibility --chrome-flags='--headless --no-sandbox' --output=json --output-path=lighthouse-report.json
node scripts/assert-lighthouse.mjs
```

Register and run new geometry/visual tests explicitly if split into a new spec. Add their command to the tracked validation path so they cannot be skipped by the existing single-file CI command. Rebuild and restart on a known owned port before each built-asset test pass. Use workspace-local TEMP/TMP/TMPDIR for browser artifacts. Mirror CI configuration with synthetic non-production values only; do not read real config. Run the same source in configured and unconfigured modes. Keep logs redacted.

Performance: repeat the existing 1,000-card benchmark three times with identical viewport/browser/fixture; compare median and maximum to a freshly measured Step 1 baseline, not a different machine. Investigate material regression before completion. UI cleanup must not add backend requests or extra full-board render loops.

## 9. Handoff and completion contract

After a verified step, report:

> Step X of 10 complete: [one-sentence visible improvement]. Verified: [relevant checks and actual counts]. Boundary: local only; no production data touched.

If blocked, say **Step X of 10 blocked**, state the exact blocker and decision needed. Never mark later steps complete to bypass a budget, safety, test, or missing-evidence gate.

Final local package must contain:
- Exact baseline, implementation, and evidence/package identities; Rules blob and no-diff proof.
- Ten-step ledger with evidence links and counts.
- Before/after index for all four examples, desktop/narrow/short screenshots, rich Board/List/card and remaining-surface matrix.
- Measured budgets for both configurations and any approved cap history.
- Unit/browser/Rules/Emulator/accessibility/isolation/performance results with commands.
- Known issues and explicit distinction between UI mocks, Emulator evidence, and unperformed real-account acceptance.
- Cleanup verification and the precise next authorization needed.

### Copy-paste implementation prompt

```text
Implement UH-Trello/FLOWBOARD_VISUAL_CLEANUP_PLAN.md.

Follow its ten-step sequence on an isolated local branch. Preserve the planning files and previous release evidence. Read the audit and concept as planning evidence, not as an implemented design or permission test.

After each verified checkpoint, send a short "Step X of 10 complete" summary with the checks that passed. Keep one step in progress and record evidence in the local progress ledger.

Fix the four supplied examples and complete the wider visual cleanup. Preserve all existing workflows, local/cloud isolation, UID-based identity, read-only navigation, confirmations, draft protection, and Rules. Use actual production markup with synthetic adapters/Emulators for authenticated UI tests. Never access the protected workspace or normal browser profile.

Measure budgets, do not silently raise caps or strip safety/accessibility copy. Ask only if a genuinely new approval is needed. Do not install machine dependencies or affect paths outside C:/Code/Stacie-Hermes.

Stop at a fully verified local release candidate before push, PR creation, merge, deployment, Rules publication, or real-account testing. Report the exact remaining release authorization gate.
```
