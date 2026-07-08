# Phase 6: Browser Verification

## Goal

Add browser coverage that verifies the dashboard can be opened from the current
page, closed back to the editor, and does not break existing equation or graph
interactions.

## Expected Files

- Create or modify a Playwright spec under `tests/`
- Modify `package.json` only if a new script is needed
- Modify dashboard/editor code only for defects found by the browser test

## Implementation Steps

1. Add a failing Playwright test that loads the app and clicks
   `Project Dashboard`.
2. Assert the dashboard heading, seeded cards, and `Back to Editor` button are
   visible.
3. Click `Back to Editor`.
4. Assert the Semantic Editor, equation animation controls, and graph controls
   are visible.
5. Exercise one equation scrubber move and one graph control change.
6. Run the browser test and fix only defects required for the test.
7. Run `npm test`, `npm run typecheck`, `npm run build`, and the browser spec.
8. Commit the phase.

## Acceptance Criteria

- The prototype is reachable from the current page.
- Returning to the editor rehydrates equation motion and graph WebGL shells.
- Existing editor behavior remains accessible after dashboard navigation.

## Commit Message

`test: cover project dashboard browser flow`
