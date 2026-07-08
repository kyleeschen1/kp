# Operation-First Equation Motion Design

## Summary

Equation motion should be driven by authored symbolic transformations, not by
visual diffs between rendered KaTeX trees. The authoring input is a semantic
operation such as `subtractBothSides(3)`. The compiler derives the target
equation, assigns stable token identities, classifies each token as persisted,
entered, exited, moved, cancelled, or simplified, and emits a normalized motion
plan.

The renderer remains responsible for measuring and drawing KaTeX. It does not
infer algebraic intent. It consumes annotated source and target render trees plus
a tweenable plan that can be sampled at any progress value. Forward playback,
rewind, replay, sliders, and scroll all use the same sampler.

## Goals

- Encode symbolic manipulation intent explicitly.
- Support arbitrary KaTeX rendering when it is produced from annotated semantic
  transformations.
- Give every visible token a lifecycle before rendering.
- Preserve identity for tokens that persist through a transformation.
- Make every transition sampleable by progress, so it can be driven by time,
  rewind, sliders, and scroll.
- Guarantee rewind uses the exact same timeline sampled backward.
- Keep the renderer algebra-agnostic.
- Leave heuristic KaTeX token matching available only as fallback for generic
  non-semantic transitions.

## Non-Goals

- Infer full algebraic intent from arbitrary source and target KaTeX alone.
- Build a complete lesson-authoring product in this slice.
- Replace KaTeX layout or typography.
- Require every KaTeX internal span to be individually addressable.
- Preserve the current bespoke `transfer-3` and `melt-right-side` choreography
  model as the durable architecture.

## Core Model

The durable motion path is:

```txt
operation -> semantic transition -> motion plan -> sampled frame -> renderer
```

An author specifies a source equation and a semantic operation:

```ts
{
  source: "x + 3 = 7",
  operation: {
    kind: "subtractBothSides",
    value: "3"
  }
}
```

The compiler derives the target expression and emits a complete lifecycle map.
Each visible rendered unit must be classified before it reaches the renderer.

```ts
type TokenLifecycle =
  | "persist"
  | "enter"
  | "exit"
  | "move"
  | "cancel"
  | "inverse-enter"
  | "simplify-into"
  | "group-wrap"
  | "group-unwrap";
```

If a token appears in the source or target and has no lifecycle, the compiler
must reject the plan. The renderer must not guess identity from text order when
semantic IDs are available.

## Initial Operation Vocabulary

The first operation set should cover common one-line algebra manipulation:

```ts
type EquationOperation =
  | { kind: "addBothSides"; value: MathExpression }
  | { kind: "subtractBothSides"; value: MathExpression }
  | { kind: "multiplyBothSides"; value: MathExpression }
  | { kind: "divideBothSides"; value: MathExpression }
  | {
      kind: "moveTermAcrossEquals";
      termId: SemanticId;
      inverse: "add" | "subtract" | "multiply" | "divide";
    }
  | {
      kind: "simplifySide";
      side: "left" | "right";
      rule: SimplificationRule;
    };
```

Each operation defines both math semantics and motion semantics. For example,
`subtractBothSides(3)` on `x + 3 = 7` means:

- `x` persists.
- `=` persists.
- `7` persists.
- The original left-side `+ 3` is marked `cancel`.
- The right-side `- 3` is marked `inverse-enter`.
- A subsequent `simplifySide(left)` removes the cancelled pair.
- A subsequent `simplifySide(right)` turns `7 - 3` into `4`.

This is intentionally different from treating the original `3` as literally
moving to the other side. "Move to the other side" may be a visual metaphor, but
the semantic operation is subtracting from both sides and introducing an inverse
term.

## Motion Plan

Operations compile to normalized tracks. The runtime samples those tracks rather
than owning motion semantics.

```ts
interface EquationMotionPlan {
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly tokens: readonly MotionToken[];
  readonly tracks: readonly MotionTrack[];
}

interface MotionToken {
  readonly id: string;
  readonly lifecycle: TokenLifecycle;
  readonly sourceMotionId?: string;
  readonly targetMotionId?: string;
  readonly label: string;
}

interface MotionTrack {
  readonly tokenId: string;
  readonly lifecycle: TokenLifecycle;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
  readonly from: MotionPose;
  readonly to: MotionPose;
}

interface MotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}
```

Plan progress is normalized from `0` to `1`. Track timing is also normalized.
Forward playback increments progress. Rewind samples the same plan backward.
There is no separate reverse choreography.

```ts
sampleEquationMotion(plan, progress: number): MotionFrame
```

This makes sequencing reversible by construction. If a term cancels first in
forward playback, it uncancels last when sampled backward.

## Arbitrary KaTeX Boundary

The system supports arbitrary KaTeX output when it is rendered from annotated
semantic transformations. The renderer consumes motion IDs, not algebraic
structure.

```html
<span data-kp-motion-id="lhs.x">x</span>
<span data-kp-motion-id="eq">=</span>
<span data-kp-motion-id="rhs.7">7</span>
```

For complex or arbitrary KaTeX fragments where internal annotation is not
available, the compiler may assign a motion ID to a larger group:

```html
<span data-kp-motion-id="rhs.sqrt-group"><span class="sqrt">sqrt(x)</span></span>
```

That group can persist, enter, exit, wrap, unwrap, or move as one unit. Future
work can improve granularity without changing the identity contract.

Matching priority:

1. Exact `data-kp-motion-id` plus compiler lifecycle.
2. Group-level `data-kp-motion-id` plus compiler lifecycle.
3. Existing heuristic visual token matching only for non-semantic fallback.

Heuristic diffing may assist diagnostics or generic demos, but it must not own
identity for operation-first equation motion.

## Runtime And Renderer Boundaries

The semantic compiler owns:

- deriving the target equation;
- assigning stable IDs;
- classifying token lifecycles;
- emitting normalized timeline tracks;
- rejecting incomplete lifecycle maps.

The DOM/renderer layer owns:

- rendering annotated source and target KaTeX;
- measuring source and target boxes by `data-kp-motion-id`;
- building overlay visuals;
- sampling frames at explicit progress values;
- rendering those frames;
- revealing normal KaTeX DOM at rest states.

The player owns:

- button playback;
- rewind;
- replay;
- slider progress;
- scroll progress;
- reduced-motion policy.

The player must not encode algebraic sequencing. It only controls progress.

## Proposed Module Shape

### `src/math/equation-transform.ts`

Applies `EquationOperation` values to the semantic equation model. It returns a
semantic transition with source tree, target tree, token IDs, and lifecycle
metadata.

### `src/rendering/equation-motion-plan.ts`

Converts semantic transitions into normalized motion tracks. It enforces that
all source and target motion IDs have lifecycle entries.

### `src/rendering/equation-motion-sampler.ts`

Pure sampler with no DOM dependency.

```ts
sampleEquationMotion(plan, progress): MotionFrame
```

This is the core unit for deterministic testing and exact rewind behavior.

### `src/rendering/equation-motion-dom.ts`

Measures annotated KaTeX boxes and connects measured geometry to the motion
plan.

### `src/rendering/equation-motion-player.ts`

Imperative adapter for autoplay, rewind, replay, sliders, and scroll-driven
progress. It owns clock/progress state only.

### Existing Modules

`src/rendering/equation-motion-choreography.ts` should become temporary demo
code and then be replaced by the operation-first path. The generic
`transitionKatexEquations` path can remain for non-semantic visual transitions.

## Demo Migration

The current `x + 3 = 7` demo should become:

1. `subtractBothSides(3)` from `x + 3 = 7`.
2. `simplifySide(left)` to remove the cancelled `+ 3 - 3`.
3. `simplifySide(right)` to turn `7 - 3` into `4`.

The demo may still use a visual style that suggests the `3` moving across the
equals sign, but the semantic identity model should treat the right-side `- 3`
as an inverse-enter token tied to the operation.

Rewind should sample the same plan backward. If the forward visual introduces
the inverse term and then cancels the left term, rewind removes the inverse term
and uncancels the left term in the exact reverse order.

## Testing Strategy

Unit tests:

- `subtractBothSides` derives the correct target equation.
- `divideBothSides` derives the correct target equation.
- `simplifySide` creates a simplification transition.
- Plan compilation rejects source or target tokens without lifecycle entries.
- Plan compilation emits deterministic tracks for repeated symbols with stable
  semantic IDs.
- `sampleEquationMotion(plan, 0)` returns the source frame.
- `sampleEquationMotion(plan, 1)` returns the target frame.
- Sampling `p` and `1 - p` uses the same tracks and does not require reverse
  choreography.

Browser tests:

- Annotated KaTeX tokens are measured by `data-kp-motion-id`.
- Repeated visible symbols do not swap identities when IDs differ.
- The equation demo can be driven by explicit progress values.
- Rewind follows the same path backward.
- Slider-driven progress lands on deterministic intermediate frames.
- Fallback visual matching still works for generic non-semantic transitions, but
  reports that it used heuristic identity.

## Implementation Notes

As of July 8, 2026, the first operation-first path is implemented for the
`x + 3 = 7` demo:

- `src/math/equation-transform.ts` encodes the supported semantic operations
  and lifecycle annotations for `subtractBothSides(3)`, `simplifySide(left)`,
  and `simplifySide(right)`.
- `src/rendering/equation-motion-plan.ts`,
  `src/rendering/equation-motion-sampler.ts`, and
  `src/rendering/equation-motion-player.ts` compile, sample, and play a
  normalized plan. The compiler rejects duplicate token identity and lifecycle
  endpoint mismatches. Rewind samples the same plan backward rather than using
  a separate reverse choreography.
- `src/rendering/equation-motion-dom.ts` measures visible annotated token
  wrappers by `data-kp-motion-id` and rejects duplicate IDs inside one measured
  state.
- `src/editor/equation-motion-demo-controller.ts` wires the editor demo to the
  semantic operations, validates rendered state LaTeX against each operation's
  derived target, and measures only the source and target state roots so IDs may
  repeat across states.
- The public progress contract is directional: progress `0` means the latest
  transition source and progress `1` means the latest transition target. The
  demo also exposes canonical plan progress for diagnostics because reverse
  transitions are sampled against the lower-step-to-higher-step plan.

## Open Follow-Up Work

- Decide how much of the existing math parser can produce annotated token trees
  without a larger expression-rendering refactor.
- Add higher-level operations for exponentiation, roots, factoring, expansion,
  distribution, and wrapping/unwrapping grouped expressions.
- Add author-facing syntax for composing multi-step transformations.
- Decide whether operation styles should be named separately from operations,
  for example `subtractBothSides` with style `"balance-scale"` or
  `"move-across-equals"`.
