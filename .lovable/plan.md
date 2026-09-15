# Focus-mode side-by-side reference view

## Goal
Add a docked side-by-side option in Focus mode so the reference image and active editor remain visible together, while preserving the existing floating source-image workflow.

## Changes
- Add a compact Float / Side by side selector beside the Source view control while Focus mode is active.
- Reuse the current source-image inspector in a docked layout, retaining upload, zoom, pan, eyedropper, palette extraction, opacity, and fit controls.
- In Side by side mode, place the reference workspace and the active Flat or 3D editor in two stable panes; collapse cleanly into a vertical arrangement on narrower screens.
- Keep floating mode unchanged, including dragging and resizing, and remember the chosen mode while the editor is open.
- Ensure closing Source view removes either presentation without affecting the loaded reference image.
- Fix the current platform-specific keyboard-shortcut hydration mismatch by determining the modifier label after the page loads.

## Validation
- Verify Float and Side by side switching in Focus mode.
- Verify both Flat edit and 3D edit mode render correctly beside the reference.
- Verify source zoom, pan, eyedropper, palette, upload, fit, and opacity controls still work.
- Verify narrow-screen stacking and that the editor remains usable without overlap.
- Run the focused TypeScript checks and inspect the live editor for runtime errors.

## Technical details
- Refactor the source inspector into shared content with floating and docked shells rather than duplicating its image interaction logic.
- The canonical 64×64 RGBA skin buffer remains unchanged; the reference pane is presentation-only.
