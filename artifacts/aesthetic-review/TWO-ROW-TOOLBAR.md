# Two-row Flowboard toolbar, local implementation

Branch: `feat/flowboard-two-row-toolbar`. This is a local implementation only, not a production deployment.

- App bar: Flowboard, Boards, Appearance, and account. At narrow widths the redundant workspace-status button is omitted; Boards remains the entry to the same directory.
- One board-tools row: editable board title, search, Filters, List view, Archived cards, quick filters where space allows, and card summary. The top Add card shortcut is removed; each list retains Add a card.
- At widths of 1100px and below, quick-filter actions are available through the Filters panel rather than taking permanent toolbar space. The panel retains Due, Label, Member (including Assigned to me when eligible), Completion, and Clear filters. The compact summary shows the card count or filtered count, while its full accessible text and hover title remain intact.
- On narrow screens, the single board-tools row scrolls horizontally. A non-interactive More cue disappears at the right edge; the board's separate More lists cue remains. Focusable toolbar and accessible scrolling description support keyboard discovery. The filter panel stays within the viewport.

Verification with fresh synthetic production-browser fixtures: 960px used a 54px app bar and 44px board-tools row with no horizontal page overflow; 390px used a 52px app bar and 44px board-tools row, with all actions available by toolbar scrolling. Viewports 320, 390, 700, 960, 1280, 1440, and 1920 were covered. Signed-out, owner, and viewer paths were exercised without real credentials or production data.

`npm run validate` passed (41/41 Node tests, static checks, build, budgets, asset isolation). The final `npm run test:current` passed 171/171: 41 synthetic contracts, 46 Rules, 24 Auth/Firestore Emulator browser, 2 unconfigured browser, and 58 configured synthetic production-controller browser checks. Earlier attempts exposed intermittent Emulator card-details/lifecycle readiness and one directory layout sampling failure; a bounded lifecycle-dialog readiness check and a two-frame geometry settle were added to tests, followed by a passing packaged Emulator replay and a passing final aggregate run. Keep these races under observation in CI.

Hard caps unchanged. Production source: 293,419 / 300,000 bytes. Initial-shell gzip: 26,150 / 26,250 bytes unconfigured and 26,196 / 26,250 bytes configured synthetic build. First-party lazy gzip: 56,615 / 60,000 bytes. Existing source maintainability warning remains. `firestore.rules`, `firestore.indexes.json`, and the confirmation-dialog module were not edited. No publishing or real-account verification occurred.
