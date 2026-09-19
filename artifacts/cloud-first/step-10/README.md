# Step 10 evidence - viewport-bounded scrolling

## Implemented

- The app shell is a two-row viewport grid with the main board area constrained to the remaining height.
- The board owns horizontal overflow and keeps its scrollbar inside the visible viewport.
- Lists fill the board lane while each card collection owns vertical overflow, keeping Add card reachable.
- Page-level horizontal and vertical scrolling are suppressed for the application shell.
- Narrow-width geometry retains the intentionally horizontal board lane.

## Verification

A built-preview Playwright test passed at 1280x720, 1440x900, 1920x1080, 960x720, and 390x640. It proved:

- no page-level overflow;
- board bottom stays within the viewport;
- horizontal overflow exists and reaches the far end;
- document scrollTop remains zero;
- long-card vertical scrolling works;
- Add card remains visible.

Focused built-preview result: 1 passed, 0 failed.
