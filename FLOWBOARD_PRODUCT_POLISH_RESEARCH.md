# Flowboard product polish: research and audit

Research date: 2026-09-18, Hawaii time. Scope: public product pages, official product documentation, anonymous Flowboard starter board, source review. This is not a signed-in competitor usability study or production-account acceptance.

## Recommendation

Combine Trello's direct card workflow, monday.com's focused filtering and alternative views, and Odoo's structured task inspection. Preserve Flowboard's small, local-first identity. Do not recreate enterprise integrations, automation infrastructure, billing, or an AI platform.

Implementation plan: [[FLOWBOARD_PRODUCT_POLISH_PLAN]]. Visual concept: [contact sheet](artifacts/product-polish-planning/concept-contact-sheet.png), [standalone HTML](artifacts/product-polish-planning/concept.html).

## Sources and what they support

1. [monday.com homepage](https://monday.com/): current homepage emphasizes people and agents working together. This is not evidence that Flowboard should add agents. Use the more specific official documentation below for board design.
2. [monday.com board filters](https://support.monday.com/hc/en-us/articles/360003624660-The-Board-Filters): describes board search, person filtering, and automatic population of new items under filters. Adopt easy, visible focus controls. Deliberately do NOT copy implicit auto-assignment or auto-labelling: Flowboard should disclose that a new card is hidden by filters rather than silently change task data.
3. [monday.com board views](https://support.monday.com/hc/en-us/articles/360001267945-The-board-views): describes alternative visualizations of one board. Adopt a second view of the existing active-board data, not a duplicate task store or cross-workspace dashboard.
4. [Odoo Project](https://www.odoo.com/app/project): describes Kanban, Gantt and List views, collaboration, templates, project updates, and task management. Prioritize List view and task clarity. Gantt, financial reporting and billing are out of scope.
5. [Odoo Project features](https://www.odoo.com/app/project-features): explicitly describes large-screen task details with chatter, filtering/grouping by stage, assignee, deadline and keyword, and List-view workflows. Adopt progressive task-detail organization and a desktop-efficient table. Do not copy its batch editing, email integration, custom fields, or calendar drag mutation in this release.
6. [Atlassian Trello](https://www.atlassian.com/software/trello): describes cards moving across lists, essential information at a glance, due dates, calendar views, and collaboration near the work. Adopt clear card hierarchy, fast capture and contextual details. Do not imply that Flowboard supports Trello's offline behavior, Power-Ups or integrations.

These are vendor descriptions, not independently verified comparisons. No pricing, plan entitlement, accessibility, or performance superiority is inferred. Use original layout, copy and icons; do not copy proprietary branding, screenshots, assets, or source.

## Verified Flowboard baseline

- Remote main: `bba3647131d1dac0c05f8e21893e11a82c3a0034`.
- Local checkout: `luna/ux-discoverability`, HEAD `2ebbaf96fd6463160b4d5a14b135b5ee00a6703e`.
- `git fetch origin main` followed by `git diff --stat HEAD FETCH_HEAD` produced no tree differences. History differs because PR #9 was squash-merged. This is not a reason to resume or push the old branch.
- Measured source: 245,459 / 247,500 bytes, 2,041 remaining; maintainability warning at 210,000.
- Existing dist measurement: shell gzip 24,719 / 25,000, lazy gzip 51,429 / 55,000, document gzip 5,817. These are a measurement of the existing local build, not a newly rebuilt planning release.
- Important tight per-file limits: index.html 25,611 / 26,000; cloud-workspace-ui.js 12,919 / 13,000; members-ui.js 11,973 / 12,000; appearance-ui.js 9,309 / 10,000.
- Source confirms Assigned, Unassigned and cloud Assigned to me already exist in the detailed filter panel. Quick focus controls are discoverability improvements, not new identity functionality. `mutate()` accepts success/failure hooks and returns before a cloud save completes; new composers must wait for those hooks rather than interpreting its boolean as durable success.
- Existing app includes local-first boards, cloud workspaces, search/filters/chips, due/completion/checklists, local assignee labels and separate cloud UID assignments, comments/activity, move/archive/recovery, Account-first photo controls and browser-local Appearance.
- `styles.css` already has theme/surface tokens, focus/reduced-motion/high-contrast rules, native-dialog styles, coarse-pointer targets and short-height containment. Polish those foundations instead of introducing another UI framework.
- `src/canvas-palettes.js` already defines eight palettes. Do not replace their stored IDs or silently reset saved choices.

## Anonymous live audit

Script: `artifacts/product-polish-planning/audit-live.cjs`. Fresh Playwright context, no persistent normal browser profile, no sign-in, only the synthetic starter board. Errors were captured with listeners installed before navigation.

Observed at 1440x900:
- Ten starter cards across four visible lanes.
- Light and Dark rendered through System theme; a real card-detail dialog was opened and dismissed without saving.
- Captured console errors: 0; page errors: 0.
- Evidence: `live-light.png`, `live-dark.png`, `live-card.png`, `live-audit.json` in the same artifact folder.
- This is a limited anonymous smoke and visual audit, not authentication, permission, multi-user or all-viewport acceptance.

### Concrete visual findings

1. Board search is in global navigation while Filters lives in the board header. Grouping both in one board toolbar will clarify scope.
2. Several buttons, state pills and Start here compete with task content. Keep Account, Appearance and Workspace discoverable, but reduce secondary emphasis.
3. Simple starter cards use generous vertical space; a controlled Compact density can improve scanning without shrinking pointer targets.
4. Light-mode separation is good. Dark lanes and cards have similar values; use stronger surface distinction and restrained borders instead of heavier shadows.
5. Starter labels such as 'purple label' convey color rather than purpose. Improve only fresh starter fixtures, never rewrite existing user boards.
6. The rightmost add-list area is partially clipped. Make horizontal navigation intentional and keep Add list accessible outside the off-screen end of the board.
7. Card details repeat the task title and expose many secondary footer actions. Keep the existing explicit save/draft model but improve section priority, Cancel visibility, and action grouping.
8. The screenshot's comma-separated assignee field is LOCAL mode. Cloud member-backed assignment already exists. Do not infer a missing member directory or replace identity with text matching.

## Concept interpretation

The contact sheet is a nonfunctional composition with identical synthetic cards in three palette-inspired treatments. It demonstrates neutral navigation, grouped board controls, a Board/List switch, a board-scoped summary, named labels, due badges and initials. It is NOT a screenshot of implemented work, not a promise of new default colors, and not a contrast qualification. Exact palette values are printed for discussion. Final styling must work with every existing saved palette and both finishes.

## Links

- [[FLOWBOARD_PRODUCT_POLISH_PLAN]]
- [[FLOWBOARD_UX_DISCOVERABILITY_PLAN]]
- [[FLOWBOARD_UX_DISCOVERABILITY_PROGRESS]]
