# Visual cleanup planning audit

Date: 2026-09-18 HST
Plan: [FLOWBOARD_VISUAL_CLEANUP_PLAN.md](../../FLOWBOARD_VISUAL_CLEANUP_PLAN.md)
Source: `a9d2ff46add71aa246da468ff2e343cce47dd276`
Status: planning evidence, not implementation or release qualification.

## Audit coverage

All four user screenshots were visually reviewed. They were not copied into this repository because they contain real account/workspace information.

`audit-live.cjs` uses fresh anonymous contexts on the public site, attaches error listeners before navigation, and captures the requested panel only after explicit visible-state waits. Twelve final captures and geometry are in `live-audit.json`. Six board sizes plus desktop List, card, signed-out Account, Appearance, quick add, and dark Board are included. Final run: zero console errors, zero page errors, no page-level horizontal overflow.

`audit-synthetic.cjs` renders actual source HTML/CSS and the real auth/cloud/member controllers with fake adapters. Every network request is intercepted. It does not import Firebase, authenticate, or access real workspaces. Six captures and geometry are in `synthetic-audit.json`. Final run: zero console errors and zero page errors. It reproduces the affected cloud UI at 1440px and 390px viewport widths.

The initial live screenshot attempt captured some lazy surfaces before they appeared. Those files were overwritten by a corrected run. This is a test-synchronization lesson, not evidence that the application failed to open those surfaces.

## Findings

### High priority: workspace identity disappears

- At desktop, the two synthetic workspace title elements have width zero.
- Their summary rows overflow into the action region.
- Generic 440px dialog width plus a two-column outer grid and inner nonwrapping flex content explain the failure.
- Fix the component width AND the row geometry. Merely increasing modal width does not qualify long names or narrow layouts.
- Identity must remain present on archived rows and before Restore.

### High priority: member/ownership action clipping

- Production markup uses generic dialog width and a reused three-column form.
- Real generated rows contain identity, role, select, and Remove with insufficient responsive structure.
- Synthetic desktop and narrow layouts each exhibit overflowing containers.
- The supplied screenshot and synthetic screenshot show clipped ownership-transfer action content.
- Existing accessible mutation confirmations are already implemented. Keep them and verify Cancel causes no mutation.

### Medium priority: account vertical rhythm

- Photo controls are nearly attached to the local-data notice.
- Reserved status and footer space is uneven relative to section gaps.
- Group identity, workspace, photo settings, safety notice, and session/navigation actions clearly.
- Preserve share/refresh/stop/retry visibility and account-first navigation.

### Medium priority: toolbar misalignment and grouping

- `details.collaboration-notice` inherits a 16px bottom margin in a centered flex header.
- Measured Board actions height 38px; Start here height approximately 42.3px; passive summary 30px.
- The resulting Start here center is approximately 8px above Board actions.
- Start here is a disclosure, not a video/play control. Keep semantic details/summary interaction.
- Search/count/filter grouping and narrow wrapping need refinement beyond the isolated screenshot fragment.

### Wider refinements

- Card editor Title/Description gap is tighter than the later sections.
- Quick-add destination and optional checkbox nearly touch.
- Appearance palette descriptions have little width and small type.
- List empty Status values use strong weight despite being low-information metadata.
- Neutral dark card/list surfaces need contrast and boundary checks; no numerical WCAG failure is claimed from screenshots.
- Starter content does not exercise existing due/assignee/checklist metadata; use richer fixtures.
- Done is a list name, not automatic completion. Preserve the distinction rather than changing data behavior for visual consistency.
- Intentional board/table horizontal scrolling is not page overflow. Do not force all columns into the viewport.

## Test gap exposed

Some existing member/lifecycle browser tests replace `document.body.innerHTML` with minimal test markup. They validate controller behavior but miss the exact production dialog classes, form nesting, CSS reuse, and real row geometry. Add integration geometry coverage using actual page markup and isolated fake adapters. Prevent duplicate initialization in configured builds and make sure test routes/assets never ship.

## Budget observations

Fresh file inventory uses actual on-disk sizes, not rebuilt gzip values:
- Total enumerated source: 265,658 bytes against 300,000.
- Members module: 26 bytes per-file headroom.
- Cloud workspace module: 81 bytes per-file headroom.
- HTML: 505 bytes per-file headroom.

Archived release configured shell: 26,053 / 26,250 gzip bytes. Fresh configured and unconfigured build measurements are an implementation prerequisite. Do not treat line-ending or archived/source measurement differences as durable recovery.

## Design artifact

`concept.html` / `concept-contact-sheet.png` compare identical synthetic content in light/dark with current brand palettes. They show spacing, action hierarchy, readable row identities, and separated ownership controls. They are not functioning screens and do not prove permissions, responsive wrapping, short-height scrolling, contrast, or the complete toolbar. The plan specifies those acceptance tests explicitly.

## Boundary

No production source edits, push, PR, merge, deployment, Rules publication, real-account testing, protected workspace access, or lifecycle-fixture mutations were performed for this planning task. Planning output is local and intentionally uncommitted for handoff. Anonymous browser-local view/theme changes occurred only in disposable contexts.
