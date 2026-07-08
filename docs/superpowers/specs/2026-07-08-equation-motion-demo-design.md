# Equation Motion Demo Design

## Summary

Replace the initial `y = x^2` 2D graph preview with a live KaTeX equation
transition demo. The demo should make the new WebGL KaTeX transition work
visible in the editor without adding a new semantic document object type yet.

The default scenario is a two-transition algebra move:

1. `x + 3 = 7`
2. `x + 3 - 3 = 7 - 3`
3. `x = 4`

The panel provides controls to advance, rewind, and replay transitions.

## Goals

- Remove the default `x^2` / parabola graph from the initial editor document.
- Add a visible equation-motion preview panel in the rendered asset column.
- Demonstrate two sequential KaTeX transitions using `transitionKatexEquations`.
- Support rewind so the user can move backward through the same states.
- Disable controls while a transition is running.
- Preserve the existing 3D graph demo and existing equation-entry graph flow.
- Keep this as a UI demo, not a new semantic schema type.

## Non-Goals

- Add a full lesson authoring model for equation transformations.
- Add semantic token IDs for this demo.
- Add a matrix row-swap demo in this first slice.
- Remove the 3D graph demo.
- Replace the existing equation-entry graph input.

## User Experience

The rendered asset column should show, in order:

1. The existing identity matrix preview.
2. A new “Equation Motion” preview.
3. The existing 3D graph preview.

The Equation Motion panel contains one visible equation area and compact
controls:

- `Next`: moves from step 0 to 1, then 1 to 2.
- `Rewind`: moves from step 2 to 1, then 1 to 0.
- `Replay`: reruns the latest completed transition. At step 0, it is disabled
  until at least one transition has completed.

During animation, the visible equation blanks through the transition controller,
the WebGL overlay renders token movement/fading, then the target equation becomes
the visible DOM state. If WebGL is unavailable, the controller's CSS fallback is
acceptable.

## Architecture

### Demo Rendering

Add a non-semantic preview renderer in `src/editor/editor.ts`, likely near the
existing object preview rendering:

- `renderEquationMotionDemo()`
- a stable container with `data-kp-equation-motion-demo`;
- three KaTeX state nodes rendered with `renderLatexToHtml`;
- one visible active state and hidden-but-measurable staged states;
- buttons with `data-action` values for next, rewind, and replay.

The initial document should stop including `createDefaultGraphScene()`. That
removes the initial parabola graph while leaving user-created equation graphs
unchanged.

### Client Hydration

Add a small client-side controller in `src/main.ts`:

- listen for the demo button `click` actions;
- find the current and target equation state elements;
- call `transitionKatexEquations(sourceEl, targetEl, { durationMs })`;
- update the active step and button disabled states after the transition;
- prevent overlapping transitions with an in-flight flag.

The transition module should be lazy-loaded only when the demo is used, matching
the existing lazy-loading posture for heavier renderers.

### State

The demo state can live in DOM data attributes:

- current step index;
- latest transition direction or latest source/target pair for replay;
- busy state while animation runs.

This avoids adding editor document state until equation transitions become a real
semantic lesson object.

## Testing

Unit/editor tests should verify:

- `createInitialEditorDocument()` no longer includes the default 2D graph scene.
- `renderEditorDocument()` includes the Equation Motion demo panel and controls.
- The existing 3D graph preview remains present.
- Existing equation-entry graph creation still appends generated 2D graphs.

Browser smoke should verify:

- the demo exists on the app page;
- pressing `Next` transitions from step 0 to step 1, then step 1 to step 2;
- pressing `Rewind` transitions back to the previous step;
- controls are disabled during transition and enabled afterward;
- at least one demo transition uses the WebGL renderer when available.

## Open Follow-Up Work

- Add a second selectable matrix row-swap demo.
- Add semantic token IDs or aliases for authored equation transformations.
- Add visual affordances for terms moving from one side of an equation to the
  other once the core demo is stable.
