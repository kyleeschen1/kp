# Equation Motion Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the initial `x^2` 2D graph preview with a visible, controllable KaTeX WebGL equation-motion demo while preserving the matrix preview, 3D graph preview, and user-created equation graph flow.

**Architecture:** Keep the demo as editor UI, not a semantic document object. Render three KaTeX states in the editor preview column with DOM data attributes for current step, replay source/target, busy state, renderer result, and transition count. Hydrate the controls from `src/main.ts` with a lazy import of `transitionKatexEquations`.

**Tech Stack:** TypeScript, KaTeX HTML rendering, Vite dynamic imports, Node test runner, Playwright Chromium smoke tests, CSS grid/flex layout.

---

## Current Workspace Constraints

- The checkout is a normal `main` checkout, not a linked worktree.
- `src/editor/editor.ts` and `tests/editor.test.ts` already contain local edits that move the 3D view and surface-mode controls out of the folded render-settings details element.
- Preserve those local edits while adding the equation-motion demo.
- Baseline before this plan: `npm test` passed with 180 tests and 0 failures.

## File Structure

- Modify `src/editor/editor.ts`
  - Remove the default 2D parabola from `createInitialEditorDocument()`.
  - Add a non-semantic `renderEquationMotionDemo()` preview article.
  - Insert the demo between the first rendered preview and the remaining previews.
- Modify `src/main.ts`
  - Add click handling for `equation-motion-next`, `equation-motion-rewind`, and `equation-motion-replay`.
  - Add a small DOM-state controller that lazy-loads `transitionKatexEquations`.
- Modify `src/styles.css`
  - Add layout and button styles for the equation-motion panel.
  - Keep inactive equation states measurable with `opacity: 0`, not `display: none`.
- Modify `tests/editor.test.ts`
  - Update initial document expectations after removing the default 2D scene.
  - Assert the equation-motion panel and controls render.
  - Keep the existing 3D control ordering assertions from the dirty local change.
- Modify `tests/katex-transition.browser.spec.ts`
  - Add a browser smoke test for Next, Rewind, Replay, disabled controls, and WebGL renderer reporting.

### Task 1: Editor Rendering Tests

**Files:**
- Modify: `tests/editor.test.ts`

- [ ] **Step 1: Write the failing initial document test changes**

Replace the object-tail assertion in `initial editor document contains a 3x3 identity matrix` with:

```ts
  assert.deepEqual(
    document.objects.slice(1).map((object) => object.type),
    [
      "graph-3d",
      "axis-3d",
      "axis-3d",
      "axis-3d",
      "surface-3d"
    ]
  );
  assert.equal(
    document.objects.some((object) => object.id === "parabola-graph"),
    false
  );
  assert.equal(
    document.objects.some(
      (object) => object.id === "curve-y-equals-x-squared"
    ),
    false
  );
  assert.equal(document.objects[1]?.id, "saddle-orbit-graph");
  assert.equal(document.objects[5]?.id, "saddle-surface");
```

- [ ] **Step 2: Write the failing render assertions**

In `renderEditorDocument renders the identity matrix with KaTeX and JSON`, remove the four initial parabola-specific positive assertions:

```ts
  assert.match(html, /data-kp-object="parabola-graph"/);
  assert.match(html, /data-kp-object="parabola-x-axis"/);
  assert.match(html, /data-kp-object="parabola-y-axis"/);
  assert.match(html, /data-kp-object="curve-y-equals-x-squared"/);
```

Replace them with:

```ts
  assert.doesNotMatch(html, /data-kp-object="parabola-graph"/);
  assert.doesNotMatch(html, /data-kp-object="parabola-x-axis"/);
  assert.doesNotMatch(html, /data-kp-object="parabola-y-axis"/);
  assert.doesNotMatch(html, /data-kp-object="curve-y-equals-x-squared"/);
  assert.match(html, /data-kp-equation-motion-demo/);
  assert.match(html, /data-kp-equation-motion-step="0"/);
  assert.match(html, /data-kp-equation-motion-state="0"/);
  assert.match(html, /data-kp-equation-motion-state="1"/);
  assert.match(html, /data-kp-equation-motion-state="2"/);
  assert.match(html, /data-kp-equation-motion-latex="x \+ 3 = 7"/);
  assert.match(html, /data-kp-equation-motion-latex="x \+ 3 - 3 = 7 - 3"/);
  assert.match(html, /data-kp-equation-motion-latex="x = 4"/);
  assert.match(html, /data-action="equation-motion-next"/);
  assert.match(html, /data-action="equation-motion-rewind"/);
  assert.match(html, /data-action="equation-motion-replay"/);
  assert.match(html, /data-kp-equation-motion-active="true"/);
  assert.match(html, /data-kp-equation-motion-active="false"/);
```

Replace the semantic JSON assertion for the initial 2D graph:

```ts
  assert.match(html, /&quot;type&quot;: &quot;graph-2d&quot;/);
```

with:

```ts
  assert.doesNotMatch(html, /&quot;type&quot;: &quot;graph-2d&quot;/);
```

Replace the preview ordering assertions with:

```ts
  assert.ok(
    html.indexOf('data-kp-object="identity-3x3"') <
      html.indexOf("data-kp-equation-motion-demo")
  );
  assert.ok(
    html.indexOf("data-kp-equation-motion-demo") <
      html.indexOf('data-kp-object="saddle-orbit-graph"')
  );
```

- [ ] **Step 3: Run editor test and verify RED**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/editor.test.ts
```

Expected result: FAIL. The failures must mention the remaining `graph-2d` / `parabola-graph` objects or missing `data-kp-equation-motion-demo` markup.

### Task 2: Editor Demo Markup

**Files:**
- Modify: `src/editor/editor.ts`
- Test: `tests/editor.test.ts`

- [ ] **Step 1: Remove the default 2D scene from the initial document**

Change the graph import to remove `createDefaultGraphScene`:

```ts
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  createDefaultGraph3DScene,
  type Graph3DSurfaceMode
} from "../semantic/graph.ts";
```

Change `createInitialEditorDocument()` so the object list contains only the identity matrix and default 3D scene:

```ts
    objects: [
      identityMatrix({
        id: "identity-3x3",
        label: "I_3",
        size: 3
      }),
      ...createDefaultGraph3DScene()
    ]
```

- [ ] **Step 2: Add the equation-motion step data**

Add this constant near the top of `src/editor/editor.ts`, after the imports:

```ts
const EQUATION_MOTION_STEPS = [
  {
    index: 0,
    label: "Start",
    latex: String.raw`x + 3 = 7`
  },
  {
    index: 1,
    label: "Subtract 3",
    latex: String.raw`x + 3 - 3 = 7 - 3`
  },
  {
    index: 2,
    label: "Solved",
    latex: String.raw`x = 4`
  }
] as const;
```

- [ ] **Step 3: Insert the demo between matrix and 3D graph previews**

In `renderEditorDocument()`, replace the `renderedObjects` construction with:

```ts
  const renderedPreviews = document.objects
    .map((object) => renderObjectPreview(object, document))
    .filter((preview) => preview.length > 0);
  const [firstPreview, ...remainingPreviews] = renderedPreviews;
  const renderedObjects = [
    firstPreview,
    renderEquationMotionDemo(),
    ...remainingPreviews
  ]
    .filter((preview): preview is string => preview !== undefined)
    .join("");
```

- [ ] **Step 4: Add the demo renderer**

Add these functions before `renderObjectPreview()`:

```ts
function renderEquationMotionDemo(): string {
  const stateNodes = EQUATION_MOTION_STEPS.map((step) =>
    renderEquationMotionState(step)
  ).join("");

  return `
    <article class="object-preview object-preview--equation-motion" data-kp-equation-motion-demo data-kp-equation-motion-step="0" data-kp-equation-motion-busy="false" data-kp-equation-motion-transition-count="0">
      <div class="object-preview__meta">
        <span>Equation Motion</span>
        <span>KaTeX WebGL</span>
      </div>
      <div class="equation-motion">
        <div class="equation-motion__stage" aria-live="polite">
          ${stateNodes}
        </div>
        <div class="equation-motion__controls" aria-label="Equation motion controls">
          <button class="equation-motion__button" type="button" data-action="equation-motion-rewind" disabled>Rewind</button>
          <button class="equation-motion__button" type="button" data-action="equation-motion-next">Next</button>
          <button class="equation-motion__button" type="button" data-action="equation-motion-replay" disabled>Replay</button>
        </div>
      </div>
    </article>
  `;
}

function renderEquationMotionState(
  step: typeof EQUATION_MOTION_STEPS[number]
): string {
  const active = step.index === 0;
  const html = renderLatexToHtml(step.latex);

  return `
    <div class="equation-motion__state" data-kp-equation-motion-state="${step.index}" data-kp-equation-motion-active="${active ? "true" : "false"}" data-kp-equation-motion-latex="${escapeHtml(step.latex)}" aria-hidden="${active ? "false" : "true"}" aria-label="${escapeHtml(step.label)}">
      ${html}
    </div>
  `;
}
```

- [ ] **Step 5: Run editor test and verify GREEN**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/editor.test.ts
```

Expected result: PASS for `tests/editor.test.ts`.

### Task 3: Browser Smoke Test

**Files:**
- Modify: `tests/katex-transition.browser.spec.ts`

- [ ] **Step 1: Write the failing browser smoke test**

Append this test before the `declare global` block:

```ts
test("editor equation motion demo advances, rewinds, and replays transitions", async ({
  page
}) => {
  await page.goto("/");

  const demo = page.locator("[data-kp-equation-motion-demo]");
  const next = demo.getByRole("button", { name: "Next" });
  const rewind = demo.getByRole("button", { name: "Rewind" });
  const replay = demo.getByRole("button", { name: "Replay" });

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(rewind).toBeDisabled();
  await expect(replay).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-busy", "true");
  await expect(next).toBeDisabled();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1", {
    timeout: 5_000
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-last-renderer",
    "webgl"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "0"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "1"
  );
  await expect(rewind).toBeEnabled();
  await expect(replay).toBeEnabled();

  await next.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "2", {
    timeout: 5_000
  });
  await expect(next).toBeDisabled();

  await rewind.click();
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1", {
    timeout: 5_000
  });
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-source",
    "2"
  );
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-latest-target",
    "1"
  );

  await replay.click();
  await expect(demo).toHaveAttribute(
    "data-kp-equation-motion-transition-count",
    "4",
    { timeout: 5_000 }
  );
  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1");
  await expect(page.locator(".katex-transition-overlay")).toHaveCount(0);
});
```

- [ ] **Step 2: Run browser smoke and verify RED**

Run:

```bash
npm run test:browser:katex
```

Expected result: FAIL. The first KaTeX transition test must still pass. The new editor demo test must fail because clicking `Next` does not update `data-kp-equation-motion-step`.

### Task 4: Demo Hydration Controller

**Files:**
- Modify: `src/main.ts`
- Test: `tests/katex-transition.browser.spec.ts`

- [ ] **Step 1: Add lazy transition-controller module state**

Add these declarations near the existing `Graph3DWebGLClient` declarations:

```ts
type KatexTransitionController = typeof import("./rendering/katex-transition-controller.ts");
type EquationMotionAction =
  | "equation-motion-next"
  | "equation-motion-rewind"
  | "equation-motion-replay";

interface EquationMotionTransition {
  readonly sourceStep: number;
  readonly targetStep: number;
}

const EQUATION_MOTION_MIN_STEP = 0;
const EQUATION_MOTION_MAX_STEP = 2;
const EQUATION_MOTION_DURATION_MS = 520;

let katexTransitionControllerPromise:
  | Promise<KatexTransitionController>
  | undefined;
```

- [ ] **Step 2: Route demo button clicks**

In the `appRoot.addEventListener("click", ...)` switch, add these cases:

```ts
    case "equation-motion-next":
    case "equation-motion-rewind":
    case "equation-motion-replay":
      handleEquationMotionAction(event.target);
      return;
```

- [ ] **Step 3: Add the action entry point**

Add these functions after `addEquationGraphFromInput()`:

```ts
function handleEquationMotionAction(button: HTMLButtonElement): void {
  const action = button.dataset["action"];
  const demo = button.closest<HTMLElement>("[data-kp-equation-motion-demo]");

  if (!isEquationMotionAction(action) || demo === null) {
    return;
  }

  if (demo.dataset["kpEquationMotionBusy"] === "true") {
    return;
  }

  const transition = createEquationMotionTransition(demo, action);

  if (transition === undefined) {
    updateEquationMotionControls(demo);
    return;
  }

  void runEquationMotionTransition(demo, transition);
}

function isEquationMotionAction(
  action: string | undefined
): action is EquationMotionAction {
  return (
    action === "equation-motion-next" ||
    action === "equation-motion-rewind" ||
    action === "equation-motion-replay"
  );
}
```

- [ ] **Step 4: Add transition selection**

Add:

```ts
function createEquationMotionTransition(
  demo: HTMLElement,
  action: EquationMotionAction
): EquationMotionTransition | undefined {
  const currentStep = readEquationMotionStep(
    demo.dataset["kpEquationMotionStep"],
    EQUATION_MOTION_MIN_STEP
  );

  if (action === "equation-motion-next") {
    if (currentStep >= EQUATION_MOTION_MAX_STEP) {
      return undefined;
    }

    return {
      sourceStep: currentStep,
      targetStep: currentStep + 1
    };
  }

  if (action === "equation-motion-rewind") {
    if (currentStep <= EQUATION_MOTION_MIN_STEP) {
      return undefined;
    }

    return {
      sourceStep: currentStep,
      targetStep: currentStep - 1
    };
  }

  const latestSource = readEquationMotionStep(
    demo.dataset["kpEquationMotionLatestSource"]
  );
  const latestTarget = readEquationMotionStep(
    demo.dataset["kpEquationMotionLatestTarget"]
  );

  if (latestSource === undefined || latestTarget === undefined) {
    return undefined;
  }

  return {
    sourceStep: latestSource,
    targetStep: latestTarget
  };
}
```

- [ ] **Step 5: Add the async transition runner**

Add:

```ts
async function runEquationMotionTransition(
  demo: HTMLElement,
  transition: EquationMotionTransition
): Promise<void> {
  const source = findEquationMotionState(demo, transition.sourceStep);
  const target = findEquationMotionState(demo, transition.targetStep);

  if (source === undefined || target === undefined) {
    return;
  }

  demo.dataset["kpEquationMotionBusy"] = "true";
  updateEquationMotionControls(demo);

  try {
    const controller = await loadKatexTransitionController();
    const result = await controller.transitionKatexEquations(source, target, {
      durationMs: EQUATION_MOTION_DURATION_MS
    });

    setEquationMotionActiveStep(demo, transition.targetStep);
    demo.dataset["kpEquationMotionLatestSource"] = String(transition.sourceStep);
    demo.dataset["kpEquationMotionLatestTarget"] = String(transition.targetStep);
    demo.dataset["kpEquationMotionLastRenderer"] = result.renderer;
    demo.dataset["kpEquationMotionTransitionCount"] = String(
      readEquationMotionCount(demo.dataset["kpEquationMotionTransitionCount"]) +
        1
    );
  } finally {
    demo.dataset["kpEquationMotionBusy"] = "false";
    updateEquationMotionControls(demo);
  }
}
```

- [ ] **Step 6: Add DOM helpers**

Add:

```ts
function findEquationMotionState(
  demo: HTMLElement,
  step: number
): HTMLElement | undefined {
  return (
    demo.querySelector<HTMLElement>(
      `[data-kp-equation-motion-state="${step}"]`
    ) ?? undefined
  );
}

function setEquationMotionActiveStep(demo: HTMLElement, step: number): void {
  demo.dataset["kpEquationMotionStep"] = String(step);
  demo
    .querySelectorAll<HTMLElement>("[data-kp-equation-motion-state]")
    .forEach((state) => {
      const active = state.dataset["kpEquationMotionState"] === String(step);

      state.dataset["kpEquationMotionActive"] = active ? "true" : "false";
      state.setAttribute("aria-hidden", active ? "false" : "true");
    });
}

function updateEquationMotionControls(demo: HTMLElement): void {
  const busy = demo.dataset["kpEquationMotionBusy"] === "true";
  const currentStep = readEquationMotionStep(
    demo.dataset["kpEquationMotionStep"],
    EQUATION_MOTION_MIN_STEP
  );
  const hasReplay =
    readEquationMotionStep(demo.dataset["kpEquationMotionLatestSource"]) !==
      undefined &&
    readEquationMotionStep(demo.dataset["kpEquationMotionLatestTarget"]) !==
      undefined;

  setEquationMotionButtonDisabled(
    demo,
    "equation-motion-next",
    busy || currentStep >= EQUATION_MOTION_MAX_STEP
  );
  setEquationMotionButtonDisabled(
    demo,
    "equation-motion-rewind",
    busy || currentStep <= EQUATION_MOTION_MIN_STEP
  );
  setEquationMotionButtonDisabled(
    demo,
    "equation-motion-replay",
    busy || !hasReplay
  );
}

function setEquationMotionButtonDisabled(
  demo: HTMLElement,
  action: EquationMotionAction,
  disabled: boolean
): void {
  const button = demo.querySelector<HTMLButtonElement>(
    `[data-action="${action}"]`
  );

  if (button !== null) {
    button.disabled = disabled;
  }
}

function readEquationMotionStep(
  value: string | undefined,
  fallback?: number
): number | undefined {
  const parsed = value === undefined ? Number.NaN : Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(
    EQUATION_MOTION_MAX_STEP,
    Math.max(EQUATION_MOTION_MIN_STEP, parsed)
  );
}

function readEquationMotionCount(value: string | undefined): number {
  const parsed = value === undefined ? Number.NaN : Number(value);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function loadKatexTransitionController(): Promise<KatexTransitionController> {
  if (katexTransitionControllerPromise === undefined) {
    katexTransitionControllerPromise = import(
      "./rendering/katex-transition-controller.ts"
    );
  }

  return katexTransitionControllerPromise;
}
```

- [ ] **Step 7: Run browser smoke and verify GREEN**

Run:

```bash
npm run test:browser:katex
```

Expected result: PASS for both browser tests.

### Task 5: Equation Motion Styling

**Files:**
- Modify: `src/styles.css`
- Test: `npm run test:browser:katex`

- [ ] **Step 1: Add panel styles**

Add these styles after `.object-preview__math .katex-display`:

```css
.object-preview--equation-motion {
  overflow: hidden;
}

.equation-motion {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.equation-motion__stage {
  display: grid;
  min-height: 7rem;
  place-items: center;
  overflow: hidden;
  border: 1px solid #e0e7ef;
  border-radius: 6px;
  background: #fbfdff;
}

.equation-motion__state {
  grid-area: 1 / 1;
  max-width: 100%;
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease;
}

.equation-motion__state[data-kp-equation-motion-active="true"] {
  opacity: 1;
  pointer-events: auto;
}

.equation-motion__state .katex-display {
  margin: 0;
}

.equation-motion__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.equation-motion__button {
  border: 1px solid #1f6371;
  border-radius: 6px;
  padding: 0.48rem 0.72rem;
  color: #ffffff;
  background: #1f6371;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
}

.equation-motion__button:hover:not(:disabled) {
  background: #174b55;
}

.equation-motion__button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
```

- [ ] **Step 2: Run browser smoke after styling**

Run:

```bash
npm run test:browser:katex
```

Expected result: PASS for both browser tests.

### Task 6: Full Verification and Commit

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run full Node tests**

Run:

```bash
npm test
```

Expected result: PASS with no failing tests.

- [ ] **Step 2: Run TypeScript typecheck**

Run:

```bash
npm run typecheck
```

Expected result: PASS with exit code 0.

- [ ] **Step 3: Run browser KaTeX smoke**

Run:

```bash
npm run test:browser:katex
```

Expected result: PASS for both Chromium browser tests.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff -- src/editor/editor.ts src/main.ts src/styles.css tests/editor.test.ts tests/katex-transition.browser.spec.ts
```

Confirm:

- `createInitialEditorDocument()` no longer includes `createDefaultGraphScene()`.
- The equation-motion demo renders between the identity matrix and the 3D graph.
- The demo remains DOM-based and non-semantic.
- The 3D graph controls keep view mode and surface mode outside the folded render-settings details element.
- The browser smoke asserts Next, Rewind, Replay, disabled controls, transition count, and WebGL renderer reporting.

- [ ] **Step 5: Stage only feature files**

Run:

```bash
git add src/editor/editor.ts src/main.ts src/styles.css tests/editor.test.ts tests/katex-transition.browser.spec.ts docs/superpowers/plans/2026-07-08-equation-motion-demo.md
```

- [ ] **Step 6: Commit**

Run:

```bash
git commit -m "feat: add equation motion demo"
```

Expected result: a commit containing only the equation-motion demo implementation, tests, styles, and this plan.

## Self-Review

- Spec coverage: The plan removes the initial 2D graph, adds a visible Equation Motion panel, demonstrates two sequential transitions, supports rewind and replay, disables controls while busy, keeps the 3D graph demo, and leaves equation-entry graph creation intact.
- Placeholder scan: No plan steps contain TBD, TODO, placeholder, maybe, unclear, or "implement later" language.
- Type consistency: The data attributes used in render tests, browser tests, markup, and controller helpers all use `kpEquationMotionStep`, `kpEquationMotionLatestSource`, `kpEquationMotionLatestTarget`, `kpEquationMotionLastRenderer`, and `kpEquationMotionTransitionCount` consistently.
