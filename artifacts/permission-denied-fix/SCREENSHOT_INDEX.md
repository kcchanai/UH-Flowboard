# Permission-denied evidence screenshots

All screenshots are synthetic Auth/Firestore Emulator evidence. They do not represent the affected Google account and contain no production records.

- `blocked-boards.png`: normal synthetic failure/recovery dialog capture.
- `blocked-boards-wide.png`: failure state at 1440x900.
- `blocked-boards-short.png`: failure state at 960x540.
- `recovered-boards.png`: Retry setup followed by verified home, persisted first board, and enabled New board.

Inspection results:

- Failure copy identifies `permission-denied` and the fixed stage, with Retry setup and Data recovery visible.
- Failure state does not claim the workspace is merely empty.
- Short viewport retains visible Close, Retry setup, and Data recovery controls without clipping.
- Recovered state shows the persisted first board and enabled creation controls.
