# Operation-First Equation Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace bespoke equation-motion choreography with operation-first, identity-preserving, tweenable equation motion driven by semantic transformations.

**Architecture:** Add a semantic equation transformation layer that emits token lifecycles, an annotated KaTeX measurement layer keyed by motion IDs, a pure normalized sampler, and a small player that drives progress forward or backward. Keep the existing generic KaTeX transition path for non-semantic fallback while migrating the `x + 3 = 7` demo to generated operation plans.

**Tech Stack:** TypeScript, Node test runner, KaTeX, Playwright Chromium browser tests, existing KP math expression utilities.

---

## Scope And File Structure

This plan implements the first durable operation-first equation-motion slice:

- `subtractBothSides(3)` from `x + 3 = 7` to `x + 3 - 3 = 7 - 3`.
- `simplifySide("left")` from `x + 3 - 3 = 7 - 3` to `x = 7 - 3`.
- `simplifySide("right")` from `x = 7 - 3` to `x = 4`.
- Complete token lifecycle maps for those operations.
- Annotated KaTeX DOM measurement by `data-kp-motion-id`.
- A pure progress sampler that supports exact rewind by sampling the same tracks backward.
- Demo playback that uses generated plans instead of hard-coded `"transfer-3"` and `"melt-right-side"` choreography.

Files to create:

- `src/math/equation-transform.ts`: semantic operation types and V1 equation transitions.
- `tests/equation-transform.test.ts`: unit tests for transformation outputs and lifecycles.
- `src/rendering/equation-motion-plan.ts`: transition-to-track compiler and lifecycle completeness checks.
- `tests/equation-motion-plan.test.ts`: unit tests for generated plan tracks.
- `src/rendering/equation-motion-sampler.ts`: pure `sampleEquationMotion(plan, progress)` implementation.
- `tests/equation-motion-sampler.test.ts`: deterministic frame and rewind sampling tests.
- `src/rendering/equation-motion-dom.ts`: DOM annotation and measurement helpers for `data-kp-motion-id`.
- `tests/equation-motion-dom.test.ts`: unit tests with fake DOM elements.
- `src/rendering/equation-motion-player.ts`: imperative progress player for generated plans.
- `tests/equation-motion-player.test.ts`: unit tests for forward, rewind, and explicit progress.

Files to modify:

- `src/editor/editor.ts`: render operation-first demo states and annotate motion IDs.
- `src/main.ts`: replace bespoke choreography selection with operation-first plan/player flow.
- `src/rendering/equation-motion-choreography.ts`: do not edit in this plan; it remains as existing demo/fallback code until a separate cleanup removes unused choreography.
- `tests/editor.test.ts`: update demo state assertions.
- `tests/katex-transition.browser.spec.ts`: assert operation-first lifecycle, explicit progress, and exact rewind behavior.
- `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`: append a short implementation note after migration.

Important worktree note: this repository already has in-progress equation-motion changes. Before each commit, run `git status --short` and stage only the paths listed in that task.

---

### Task 1: Semantic Operation Transitions

**Files:**
- Create: `src/math/equation-transform.ts`
- Create: `tests/equation-transform.test.ts`

- [ ] **Step 1: Write the failing transformation tests**

Create `tests/equation-transform.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition,
  type EquationTransition
} from "../src/math/equation-transform.ts";

test("subtractBothSides creates explicit inverse-enter and cancel lifecycles", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });

  assert.equal(transition.sourceLatex, "x + 3 = 7");
  assert.equal(transition.targetLatex, "x + 3 - 3 = 7 - 3");
  assertTokenSummary(transition, [
    ["lhs.x", "persist", "lhs.x", "lhs.x"],
    ["lhs.plus", "cancel", "lhs.plus", undefined],
    ["lhs.3", "cancel", "lhs.3", undefined],
    ["equals", "persist", "equals", "equals"],
    ["rhs.7", "persist", "rhs.7", "rhs.7"],
    ["lhs.inverse.minus", "inverse-enter", undefined, "lhs.inverse.minus"],
    ["lhs.inverse.3", "inverse-enter", undefined, "lhs.inverse.3"],
    ["rhs.inverse.minus", "inverse-enter", undefined, "rhs.inverse.minus"],
    ["rhs.inverse.3", "inverse-enter", undefined, "rhs.inverse.3"]
  ]);
});

test("simplifySide left removes cancelled inverse terms", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });

  assert.equal(transition.sourceLatex, "x + 3 - 3 = 7 - 3");
  assert.equal(transition.targetLatex, "x = 7 - 3");
  assertTokenSummary(transition, [
    ["lhs.x", "persist", "lhs.x", "lhs.x"],
    ["lhs.plus", "cancel", "lhs.plus", undefined],
    ["lhs.3", "cancel", "lhs.3", undefined],
    ["lhs.inverse.minus", "cancel", "lhs.inverse.minus", undefined],
    ["lhs.inverse.3", "cancel", "lhs.inverse.3", undefined],
    ["equals", "persist", "equals", "equals"],
    ["rhs.7", "persist", "rhs.7", "rhs.7"],
    ["rhs.inverse.minus", "persist", "rhs.inverse.minus", "rhs.inverse.minus"],
    ["rhs.inverse.3", "persist", "rhs.inverse.3", "rhs.inverse.3"]
  ]);
});

test("simplifySide right collapses 7 minus 3 into 4", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });

  assert.equal(transition.sourceLatex, "x = 7 - 3");
  assert.equal(transition.targetLatex, "x = 4");
  assertTokenSummary(transition, [
    ["lhs.x", "persist", "lhs.x", "lhs.x"],
    ["equals", "persist", "equals", "equals"],
    ["rhs.7", "simplify-into", "rhs.7", undefined],
    ["rhs.inverse.minus", "simplify-into", "rhs.inverse.minus", undefined],
    ["rhs.inverse.3", "simplify-into", "rhs.inverse.3", undefined],
    ["rhs.4", "enter", undefined, "rhs.4"]
  ]);
});

function assertTokenSummary(
  transition: EquationTransition,
  expected: ReadonlyArray<
    readonly [string, string, string | undefined, string | undefined]
  >
): void {
  assert.deepEqual(
    transition.tokens.map((token) => [
      token.id,
      token.lifecycle,
      token.sourceMotionId,
      token.targetMotionId
    ]),
    expected
  );
}
```

- [ ] **Step 2: Run the transformation tests and verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts
```

Expected: FAIL because `src/math/equation-transform.ts` does not exist.

- [ ] **Step 3: Implement the minimal semantic transition module**

Create `src/math/equation-transform.ts` with these exports and behavior:

```ts
export type SemanticId = string;

export type EquationTokenLifecycle =
  | "persist"
  | "enter"
  | "exit"
  | "move"
  | "cancel"
  | "inverse-enter"
  | "simplify-into"
  | "group-wrap"
  | "group-unwrap";

export type EquationOperation =
  | {
      kind: "subtractBothSides";
      valueLatex: string;
    }
  | {
      kind: "simplifySide";
      side: "left" | "right";
      rule: "cancel-additive-inverse" | "evaluate-constant-difference";
    };

export interface EquationOperationInput {
  readonly sourceLatex: string;
  readonly operation: EquationOperation;
}

export interface EquationTransitionToken {
  readonly id: SemanticId;
  readonly lifecycle: EquationTokenLifecycle;
  readonly label: string;
  readonly sourceMotionId?: string | undefined;
  readonly targetMotionId?: string | undefined;
  readonly sourceLatex?: string | undefined;
  readonly targetLatex?: string | undefined;
}

export interface EquationTransition {
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly operation: EquationOperation;
  readonly tokens: readonly EquationTransitionToken[];
  readonly sourceAnnotations: readonly EquationMotionAnnotation[];
  readonly targetAnnotations: readonly EquationMotionAnnotation[];
}

export interface EquationMotionAnnotation {
  readonly motionId: string;
  readonly text: string;
}
```

Implement `createEquationOperationTransition(input)` as a narrow V1 dispatcher:

- Accept only the three source/operation cases covered by tests.
- Return the exact target LaTeX and token arrays in the tests.
- Throw `new Error("Unsupported equation operation transition.")` for other inputs.
- Build `sourceAnnotations` from tokens with `sourceMotionId`.
- Build `targetAnnotations` from tokens with `targetMotionId`.

This narrow implementation is intentional. It locks in the identity model before broadening expression support.

- [ ] **Step 4: Run the transformation tests and verify they pass**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit the semantic transition model**

Run:

```bash
git status --short
git add src/math/equation-transform.ts tests/equation-transform.test.ts
git commit -m "feat: add equation operation transitions"
```

Expected: commit contains only the new transform module and tests.

---

### Task 2: Motion Plan Compiler

**Files:**
- Create: `src/rendering/equation-motion-plan.ts`
- Create: `tests/equation-motion-plan.test.ts`

- [ ] **Step 1: Write failing plan compiler tests**

Create `tests/equation-motion-plan.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition,
  type EquationTransition
} from "../src/math/equation-transform.ts";
import {
  createEquationMotionPlan,
  type EquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";

test("createEquationMotionPlan preserves semantic lifecycle tracks", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });
  const plan = createEquationMotionPlan(transition);

  assert.equal(plan.sourceLatex, "x + 3 = 7");
  assert.equal(plan.targetLatex, "x + 3 - 3 = 7 - 3");
  assert.deepEqual(
    plan.tokens.map((token) => [token.id, token.lifecycle]),
    [
      ["lhs.x", "persist"],
      ["lhs.plus", "cancel"],
      ["lhs.3", "cancel"],
      ["equals", "persist"],
      ["rhs.7", "persist"],
      ["lhs.inverse.minus", "inverse-enter"],
      ["lhs.inverse.3", "inverse-enter"],
      ["rhs.inverse.minus", "inverse-enter"],
      ["rhs.inverse.3", "inverse-enter"]
    ]
  );
  assertTrack(plan, "lhs.x", "persist", 0, 1);
  assertTrack(plan, "lhs.plus", "cancel", 0.05, 0.35);
  assertTrack(plan, "lhs.inverse.minus", "inverse-enter", 0.2, 0.55);
  assertTrack(plan, "rhs.inverse.3", "inverse-enter", 0.2, 0.55);
});

test("createEquationMotionPlan rejects tokens without a source or target motion id", () => {
  const transition: EquationTransition = {
    sourceLatex: "x = 1",
    targetLatex: "x = 1",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    },
    sourceAnnotations: [],
    targetAnnotations: [],
    tokens: [
      {
        id: "bad",
        lifecycle: "persist",
        label: "bad"
      }
    ]
  };

  assert.throws(
    () => createEquationMotionPlan(transition),
    /Motion token bad has no sourceMotionId or targetMotionId/
  );
});

function assertTrack(
  plan: EquationMotionPlan,
  tokenId: string,
  lifecycle: string,
  start: number,
  end: number
): void {
  const track = plan.tracks.find((entry) => entry.tokenId === tokenId);

  assert.notEqual(track, undefined);
  assert.equal(track?.lifecycle, lifecycle);
  assert.equal(track?.start, start);
  assert.equal(track?.end, end);
}
```

- [ ] **Step 2: Run the plan compiler tests and verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts
```

Expected: FAIL because `src/rendering/equation-motion-plan.ts` does not exist.

- [ ] **Step 3: Implement `equation-motion-plan.ts`**

Create `src/rendering/equation-motion-plan.ts`:

```ts
import type {
  EquationTokenLifecycle,
  EquationTransition
} from "../math/equation-transform.ts";

export type EasingName = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface EquationMotionPlan {
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly tokens: readonly EquationMotionToken[];
  readonly tracks: readonly EquationMotionTrack[];
}

export interface EquationMotionToken {
  readonly id: string;
  readonly lifecycle: EquationTokenLifecycle;
  readonly label: string;
  readonly sourceMotionId?: string | undefined;
  readonly targetMotionId?: string | undefined;
}

export interface EquationMotionTrack {
  readonly tokenId: string;
  readonly lifecycle: EquationTokenLifecycle;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly from: MotionPose;
  readonly to: MotionPose;
}

export interface MotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

const IDENTITY_POSE: MotionPose = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1
};
```

Implement:

- `createEquationMotionPlan(transition: EquationTransition): EquationMotionPlan`
- Copy `sourceLatex`, `targetLatex`, and tokens.
- Reject a token when both `sourceMotionId` and `targetMotionId` are `undefined`.
- Use lifecycle timing defaults:
  - `persist`: `[0, 1]`, `linear`, opacity stays 1.
  - `cancel`: `[0.05, 0.35]`, `ease-in`, opacity 1 to 0, scale 1 to 0.82.
  - `inverse-enter`: `[0.2, 0.55]`, `ease-out`, opacity 0 to 1, scale 0.82 to 1.
  - `simplify-into`: `[0.05, 0.45]`, `ease-in-out`, opacity 1 to 0.
  - `enter`: `[0.35, 0.75]`, `ease-out`, opacity 0 to 1.
  - Other lifecycles: `[0, 1]`, `ease-in-out`.

- [ ] **Step 4: Run the plan compiler tests and verify they pass**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit the motion plan compiler**

Run:

```bash
git status --short
git add src/rendering/equation-motion-plan.ts tests/equation-motion-plan.test.ts
git commit -m "feat: compile equation motion plans"
```

Expected: commit contains only the plan compiler and tests.

---

### Task 3: Pure Motion Sampler

**Files:**
- Create: `src/rendering/equation-motion-sampler.ts`
- Create: `tests/equation-motion-sampler.test.ts`

- [ ] **Step 1: Write failing sampler tests**

Create `tests/equation-motion-sampler.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition
} from "../src/math/equation-transform.ts";
import {
  createEquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";
import {
  sampleEquationMotion
} from "../src/rendering/equation-motion-sampler.ts";

test("sampleEquationMotion returns source and target lifecycle frames", () => {
  const plan = createEquationMotionPlan(
    createEquationOperationTransition({
      sourceLatex: "x + 3 = 7",
      operation: {
        kind: "subtractBothSides",
        valueLatex: "3"
      }
    })
  );

  const start = sampleEquationMotion(plan, 0);
  const middle = sampleEquationMotion(plan, 0.3);
  const end = sampleEquationMotion(plan, 1);

  assert.equal(findOpacity(start, "lhs.plus"), 1);
  assert.equal(findOpacity(start, "rhs.inverse.3"), 0);
  assert.equal(findOpacity(end, "lhs.plus"), 0);
  assert.equal(findOpacity(end, "rhs.inverse.3"), 1);
  assert.ok(findOpacity(middle, "lhs.plus") < 1);
  assert.ok(findOpacity(middle, "rhs.inverse.3") > 0);
});

test("sampleEquationMotion clamps progress and supports backward sampling", () => {
  const plan = createEquationMotionPlan(
    createEquationOperationTransition({
      sourceLatex: "x = 7 - 3",
      operation: {
        kind: "simplifySide",
        side: "right",
        rule: "evaluate-constant-difference"
      }
    })
  );

  assert.equal(findOpacity(sampleEquationMotion(plan, -1), "rhs.4"), 0);
  assert.equal(findOpacity(sampleEquationMotion(plan, 2), "rhs.4"), 1);
  assert.equal(
    findOpacity(sampleEquationMotion(plan, 0.25), "rhs.4"),
    findOpacity(sampleEquationMotion(plan, 1 - 0.75), "rhs.4")
  );
});

function findOpacity(
  frame: ReturnType<typeof sampleEquationMotion>,
  tokenId: string
): number {
  const token = frame.tokens.find((entry) => entry.tokenId === tokenId);

  if (token === undefined) {
    throw new Error(`Expected sampled token ${tokenId}.`);
  }

  return token.pose.opacity;
}
```

- [ ] **Step 2: Run the sampler tests and verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-sampler.test.ts
```

Expected: FAIL because `src/rendering/equation-motion-sampler.ts` does not exist.

- [ ] **Step 3: Implement the pure sampler**

Create `src/rendering/equation-motion-sampler.ts`:

```ts
import type {
  EquationMotionPlan,
  MotionPose
} from "./equation-motion-plan.ts";

export interface EquationMotionFrame {
  readonly progress: number;
  readonly tokens: readonly EquationMotionFrameToken[];
}

export interface EquationMotionFrameToken {
  readonly tokenId: string;
  readonly pose: MotionPose;
}
```

Implement:

- `sampleEquationMotion(plan, progress)` clamps progress to `[0, 1]`.
- For each track:
  - local progress is `0` before `track.start`.
  - local progress is `1` after `track.end`.
  - otherwise `(progress - start) / (end - start)`.
- Apply named easing:
  - `linear`: `t`.
  - `ease-in`: `t * t`.
  - `ease-out`: `1 - (1 - t) * (1 - t)`.
  - `ease-in-out`: same curve used in `src/rendering/katex-transition-controller.ts`.
- Interpolate `opacity`, `x`, `y`, and `scale`.

- [ ] **Step 4: Run the sampler tests and verify they pass**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-sampler.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit the sampler**

Run:

```bash
git status --short
git add src/rendering/equation-motion-sampler.ts tests/equation-motion-sampler.test.ts
git commit -m "feat: sample equation motion plans"
```

Expected: commit contains only sampler files.

---

### Task 4: Annotated KaTeX DOM Measurement

**Files:**
- Create: `src/rendering/equation-motion-dom.ts`
- Create: `tests/equation-motion-dom.test.ts`

- [ ] **Step 1: Write failing DOM helper tests**

Create `tests/equation-motion-dom.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  measureAnnotatedEquationMotionTokens,
  type AnnotatedMotionToken
} from "../src/rendering/equation-motion-dom.ts";

test("measureAnnotatedEquationMotionTokens reads data-kp-motion-id boxes", () => {
  const x = fakeElement("lhs.x", "x", rect(120, 80, 10, 18));
  const equals = fakeElement("equals", "=", rect(140, 80, 12, 18));
  const root = fakeRoot([x, equals], rect(100, 60, 100, 80));

  assert.deepEqual(measureAnnotatedEquationMotionTokens(root), [
    {
      motionId: "lhs.x",
      text: "x",
      rect: rect(120, 80, 10, 18),
      localRect: rect(20, 20, 10, 18),
      element: x
    },
    {
      motionId: "equals",
      text: "=",
      rect: rect(140, 80, 12, 18),
      localRect: rect(40, 20, 12, 18),
      element: equals
    }
  ]);
});

test("measureAnnotatedEquationMotionTokens rejects duplicate motion ids", () => {
  const root = fakeRoot(
    [
      fakeElement("lhs.x", "x", rect(120, 80, 10, 18)),
      fakeElement("lhs.x", "x", rect(130, 80, 10, 18))
    ],
    rect(100, 60, 100, 80)
  );

  assert.throws(
    () => measureAnnotatedEquationMotionTokens(root),
    /Duplicate equation motion id lhs.x/
  );
});

function fakeRoot(children: HTMLElement[], bounds: DOMRect): HTMLElement {
  return {
    getBoundingClientRect: () => bounds,
    querySelectorAll: (selector: string) =>
      selector === "[data-kp-motion-id]" ? children : []
  } as unknown as HTMLElement;
}

function fakeElement(
  motionId: string,
  textContent: string,
  bounds: DOMRect
): HTMLElement {
  return {
    dataset: {
      kpMotionId: motionId
    },
    textContent,
    getBoundingClientRect: () => bounds
  } as unknown as HTMLElement;
}

function rect(
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({ left, top, width, height })
  } as DOMRect;
}
```

- [ ] **Step 2: Run the DOM helper tests and verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-dom.test.ts
```

Expected: FAIL because `src/rendering/equation-motion-dom.ts` does not exist.

- [ ] **Step 3: Implement DOM measurement**

Create `src/rendering/equation-motion-dom.ts`:

```ts
import type { KatexTokenRect } from "./katex-transition-types.ts";

export interface AnnotatedMotionToken {
  readonly motionId: string;
  readonly text: string;
  readonly rect: KatexTokenRect;
  readonly localRect: KatexTokenRect;
  readonly element: HTMLElement;
}
```

Implement:

- `measureAnnotatedEquationMotionTokens(root: HTMLElement): readonly AnnotatedMotionToken[]`
- Query `[data-kp-motion-id]`.
- Read `element.dataset["kpMotionId"]`.
- Normalize text with whitespace collapsed and trimmed.
- Compute `rect` from `getBoundingClientRect()`.
- Compute `localRect` relative to `root.getBoundingClientRect()`.
- Throw on duplicate `motionId`.
- Ignore elements with empty IDs.

- [ ] **Step 4: Run the DOM helper tests and verify they pass**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-dom.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit DOM measurement**

Run:

```bash
git status --short
git add src/rendering/equation-motion-dom.ts tests/equation-motion-dom.test.ts
git commit -m "feat: measure annotated equation motion tokens"
```

Expected: commit contains only DOM measurement files.

---

### Task 5: Progress Player

**Files:**
- Create: `src/rendering/equation-motion-player.ts`
- Create: `tests/equation-motion-player.test.ts`

- [ ] **Step 1: Write failing player tests**

Create `tests/equation-motion-player.test.ts`:

```ts
import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition
} from "../src/math/equation-transform.ts";
import {
  createEquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";
import {
  createEquationMotionPlayer
} from "../src/rendering/equation-motion-player.ts";

test("createEquationMotionPlayer samples explicit progress", () => {
  const plan = createEquationMotionPlan(
    createEquationOperationTransition({
      sourceLatex: "x + 3 = 7",
      operation: {
        kind: "subtractBothSides",
        valueLatex: "3"
      }
    })
  );
  const sampled: number[] = [];
  const player = createEquationMotionPlayer(plan, {
    render(frame) {
      sampled.push(frame.progress);
    }
  });

  player.setProgress(0.25);
  player.setProgress(0.75);

  assert.deepEqual(sampled, [0.25, 0.75]);
});

test("createEquationMotionPlayer rewinds by sampling backward", () => {
  const plan = createEquationMotionPlan(
    createEquationOperationTransition({
      sourceLatex: "x = 7 - 3",
      operation: {
        kind: "simplifySide",
        side: "right",
        rule: "evaluate-constant-difference"
      }
    })
  );
  const sampled: number[] = [];
  const player = createEquationMotionPlayer(plan, {
    render(frame) {
      sampled.push(frame.progress);
    }
  });

  player.setProgress(1);
  player.rewindTo(0, { steps: 4 });

  assert.deepEqual(sampled, [1, 0.75, 0.5, 0.25, 0]);
});
```

- [ ] **Step 2: Run the player tests and verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-player.test.ts
```

Expected: FAIL because `src/rendering/equation-motion-player.ts` does not exist.

- [ ] **Step 3: Implement the progress player**

Create `src/rendering/equation-motion-player.ts`:

```ts
import type { EquationMotionPlan } from "./equation-motion-plan.ts";
import {
  sampleEquationMotion,
  type EquationMotionFrame
} from "./equation-motion-sampler.ts";

export interface EquationMotionPlayerRenderer {
  render(frame: EquationMotionFrame): void;
}

export interface EquationMotionStepOptions {
  readonly steps: number;
}
```

Implement:

- `createEquationMotionPlayer(plan, renderer)` returns:
  - `setProgress(progress: number): void`
  - `playTo(targetProgress: number, options: EquationMotionStepOptions): void`
  - `rewindTo(targetProgress: number, options: EquationMotionStepOptions): void`
  - `getProgress(): number`
- `setProgress` clamps through `sampleEquationMotion`.
- `playTo` samples monotonically from current progress to target progress over `steps`.
- `rewindTo` calls the same stepping function with a lower target progress.
- This test-only player is synchronous. Browser animation can wrap it with `requestAnimationFrame` in a later task.

- [ ] **Step 4: Run the player tests and verify they pass**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/equation-motion-player.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit the progress player**

Run:

```bash
git status --short
git add src/rendering/equation-motion-player.ts tests/equation-motion-player.test.ts
git commit -m "feat: add equation motion progress player"
```

Expected: commit contains only player files.

---

### Task 6: Operation-First Demo Rendering

**Files:**
- Modify: `src/editor/editor.ts`
- Modify: `tests/editor.test.ts`

- [ ] **Step 1: Update editor tests for operation-first states**

Modify the existing equation-motion test in `tests/editor.test.ts` so it expects four states:

```ts
assert.match(html, /data-kp-equation-motion-state="0"/);
assert.match(html, /data-kp-equation-motion-state="1"/);
assert.match(html, /data-kp-equation-motion-state="2"/);
assert.match(html, /data-kp-equation-motion-state="3"/);
assert.match(html, /data-kp-equation-motion-latex="x \+ 3 = 7"/);
assert.match(html, /data-kp-equation-motion-latex="x \+ 3 - 3 = 7 - 3"/);
assert.match(html, /data-kp-equation-motion-latex="x = 7 - 3"/);
assert.match(html, /data-kp-equation-motion-latex="x = 4"/);
assert.match(html, /data-kp-motion-id="lhs\.x"/);
assert.match(html, /data-kp-motion-id="equals"/);
assert.match(html, /data-kp-motion-id="rhs\.7"/);
```

- [ ] **Step 2: Run the editor tests and verify they fail**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/editor.test.ts
```

Expected: FAIL because the demo still renders three states and no `data-kp-motion-id` attributes.

- [ ] **Step 3: Render operation-first demo states**

Modify `src/editor/editor.ts`:

- Import `createEquationOperationTransition` from `../math/equation-transform.ts`.
- Build demo transitions:
  - subtract: `x + 3 = 7` -> `x + 3 - 3 = 7 - 3`
  - simplify left: `x + 3 - 3 = 7 - 3` -> `x = 7 - 3`
  - simplify right: `x = 7 - 3` -> `x = 4`
- Render four states from those transitions.
- Set `EQUATION_MOTION_MAX_STEP` in `src/main.ts` in a later task; this task only updates markup.
- For V1 markup, wrap rendered state containers with annotation metadata by adding `data-kp-motion-id` spans around the whole KaTeX output for each token group. Use the transition annotations to emit hidden measurable token wrappers next to the KaTeX state:

```html
<span class="equation-motion__motion-anchor" data-kp-motion-id="lhs.x">x</span>
```

The visual KaTeX remains visible. The motion anchors are measurement hooks and should be hidden by CSS in the next task if needed.

- [ ] **Step 4: Run the editor tests and verify they pass**

Run:

```bash
node --disable-warning=ExperimentalWarning --test tests/editor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit operation-first demo markup**

Run:

```bash
git status --short
git add src/editor/editor.ts tests/editor.test.ts
git commit -m "feat: render operation first equation states"
```

Expected: commit contains only editor markup and editor tests.

---

### Task 7: Browser Playback Migration

**Files:**
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Modify: `tests/katex-transition.browser.spec.ts`

- [ ] **Step 1: Write failing browser assertions for generated plans**

Modify `tests/katex-transition.browser.spec.ts` in the editor demo test:

```ts
await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
await next.click();
await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "1", {
  timeout: 5_000
});
await expect(demo).toHaveAttribute(
  "data-kp-equation-motion-last-renderer",
  "operation-plan"
);
await expect(demo).toHaveAttribute(
  "data-kp-equation-motion-latest-source",
  "0"
);
await expect(demo).toHaveAttribute(
  "data-kp-equation-motion-latest-target",
  "1"
);
await next.click();
await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "2", {
  timeout: 5_000
});
await next.click();
await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "3", {
  timeout: 5_000
});
await rewind.click();
await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "2", {
  timeout: 5_000
});
```

Also add an explicit progress probe:

```ts
const progressSample = await page.evaluate(() => {
  const demo = document.querySelector<HTMLElement>(
    "[data-kp-equation-motion-demo]"
  );

  if (demo === null || window.__kpEquationMotionSetProgress === undefined) {
    throw new Error("Expected operation-first equation motion progress hook.");
  }

  window.__kpEquationMotionSetProgress(demo, 0.5);

  return demo.dataset["kpEquationMotionProgress"];
});

expect(progressSample).toBe("0.5");
```

Add this global test hook type:

```ts
__kpEquationMotionSetProgress?: (demo: HTMLElement, progress: number) => void;
```

- [ ] **Step 2: Run the focused browser test and verify it fails**

Run:

```bash
npm run test:browser:katex -- -g "editor equation motion demo"
```

Expected: FAIL because `src/main.ts` still uses bespoke choreography and no explicit progress hook.

- [ ] **Step 3: Implement operation-first browser playback**

Modify `src/main.ts`:

- Set `EQUATION_MOTION_MAX_STEP = 3`.
- Remove `equationMotionChoreographyKind` from the demo path.
- Add a transition factory that maps `(sourceStep, targetStep)` to `createEquationOperationTransition(input)`.
- Use `createEquationMotionPlan(transition)` and `createEquationMotionPlayer(plan, renderer)`.
- During playback, set:
  - `data-kp-equation-motion-last-renderer="operation-plan"`
  - `data-kp-equation-motion-progress`
  - latest source/target fields
  - transition count
- Install a test hook:

```ts
declare global {
  interface Window {
    __kpEquationMotionSetProgress?: (demo: HTMLElement, progress: number) => void;
  }
}
```

The hook should:

- read the current latest source/target or current step transition;
- create the matching plan;
- sample progress through the player;
- write `data-kp-equation-motion-progress`.

Modify `src/styles.css`:

- Add `.equation-motion__motion-anchor` as invisible but measurable:

```css
.equation-motion__motion-anchor {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
```

Use the existing visible state swap at the end of a transition. This task proves operation-first control flow before replacing overlay visuals.

- [ ] **Step 4: Run the focused browser test and verify it passes**

Run:

```bash
npm run test:browser:katex -- -g "editor equation motion demo"
```

Expected: PASS.

- [ ] **Step 5: Commit operation-first playback**

Run:

```bash
git status --short
git add src/main.ts src/styles.css tests/katex-transition.browser.spec.ts
git commit -m "feat: drive equation demo from motion plans"
```

Expected: commit contains only playback migration files.

---

### Task 8: Final Verification And Spec Note

**Files:**
- Modify: `docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md`

- [ ] **Step 1: Append implementation note**

Append this section to the spec:

```md
## Implementation Note

The first implementation slice supports the `x + 3 = 7` demo through explicit
`subtractBothSides(3)`, `simplifySide(left)`, and `simplifySide(right)`
transitions. It introduces the operation-first compiler, lifecycle validation,
annotated measurement hooks, pure sampling, and progress-player API. Rich
overlay visuals can now be rebuilt on top of the sampler without changing the
semantic identity model.
```

- [ ] **Step 2: Run the full verification set**

Run:

```bash
npm run typecheck
npm test
npm run test:browser:katex
```

Expected:

- `npm run typecheck`: exit 0.
- `npm test`: all Node tests pass.
- `npm run test:browser:katex`: all browser tests pass.

- [ ] **Step 3: Commit the spec note**

Run:

```bash
git status --short
git add docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md
git commit -m "docs: note operation first motion implementation"
```

Expected: commit contains only the spec note.

- [ ] **Step 4: Final status report**

Run:

```bash
git status --short
```

Expected: no uncommitted changes from this plan. If pre-existing unrelated changes remain, list them separately and do not stage them.

---

## Self-Review

Spec coverage:

- Explicit symbolic intent: Task 1.
- Complete token lifecycles: Tasks 1 and 2.
- Annotated arbitrary KaTeX boundary: Tasks 4 and 6.
- Tweenable sampler: Task 3.
- Exact rewind through same timeline: Tasks 3 and 5.
- Renderer/player boundary: Tasks 4, 5, and 7.
- Demo migration: Tasks 6 and 7.
- Verification: Task 8.

Placeholder scan:

- The plan intentionally uses narrow V1 operation support for the approved demo.
- No step asks the implementer to invent unspecified behavior.
- Every new file has tests before implementation.

Type consistency:

- `EquationTransition`, `EquationTransitionToken`, `EquationMotionAnnotation`, `EquationMotionPlan`, `EquationMotionTrack`, `MotionPose`, and `EquationMotionFrame` are introduced before use.
- Lifecycle strings match the approved design spec.
- Test hook name is consistently `__kpEquationMotionSetProgress`.
