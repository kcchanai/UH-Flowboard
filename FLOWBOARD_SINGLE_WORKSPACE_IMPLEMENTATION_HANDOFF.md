# Luna handoff: automatic account workspace and board-only UX

The implementation plan is ready. After switching to **gpt-5.6-luna**, paste the block below to explicitly start local implementation. Switching models alone does not start work.

```text
Implement C:/Code/Stacie-Hermes/UH-Trello/FLOWBOARD_SINGLE_WORKSPACE_BOARD_UX_PLAN.md.

Deliver one automatic personal workspace per Google account with no workspace-choice step. Users choose boards. Make New board visible and functional even before the first board exists or while viewing a shared read-only board. Archived owner boards must have direct Restore and Delete permanently actions only. Preserve existing boards, sharing permissions, legacy backups, and secondary recovery routes; do not flatten legacy/shared authorization scopes.

Read the plan and artifacts/single-workspace-planning/AUDIT.md, load relevant skills, inspect current state, preserve planning files, and create a new isolated branch from freshly reviewed main. Create FLOWBOARD_SINGLE_WORKSPACE_PROGRESS.md. Complete all 10 steps, sending a concise Step X of 10 complete update after each verified checkpoint with tests, budgets, evidence, and commit.

Authorization: local implementation and synthetic testing only, including narrowly necessary Rules/schema changes qualified in fresh demo Auth/Firestore Emulators. Work only under C:/Code/Stacie-Hermes. No real-account sessions, normal browser profiles, production data access/migration, protected-workspace access, push/PR/merge, Pages deployment, or Rules/index publication. Do not access My Flowboard workspace or Lifecycle realtime probe as fixtures. Do not expose credentials, configuration, identifiers, or raw document/storage payloads.

No source or gzip cap increase is approved. Stop with measured evidence at a real budget, tooling, architecture, or authorization boundary. Otherwise continue local steps without asking after every checkpoint. Reproduce the existing-user bootstrap dead end; do not merely hide its message or enable a form without a valid cloud destination. Verify the actual packaged tests and CI selection, not only focused fixtures.

Stop at the fully verified local release candidate with exact source/Rules/index identities, final test results, inspected screenshots, and a separate release checklist. Do not deploy.
```

## Links

- [[FLOWBOARD_SINGLE_WORKSPACE_BOARD_UX_PLAN]]
- [Planning audit](artifacts/single-workspace-planning/AUDIT.md)
