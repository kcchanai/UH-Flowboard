# Step 11 evidence - Start here removal and Filters

## Implemented

- Start here is absent from production markup and accessible text.
- The Filters panel remains open for interactions inside it.
- Pointer interaction outside its owner closes it without stealing focus.
- Escape closes it and restores focus to Filters.
- Applied selections survive dismissal and reopening.
- Opening clamps the panel horizontally inside the current viewport.

## Verification

A built-preview Playwright test passed at widths 1280, 390, and 320 pixels. It verified inside interaction, outside dismissal, retained selections, Escape focus return, viewport bounds, and absence of Start here.

Focused built-preview result: 1 passed, 0 failed.
