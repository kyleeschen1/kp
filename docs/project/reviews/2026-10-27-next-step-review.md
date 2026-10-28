# Prototype plan: a multi-step algebra derivation trail

Status: proposed implementation plan. The user selects multi-step algebra and
the derivation trail as the prototype focus. This supersedes the unimplemented
completing-the-square recommendation, not the mathematical code or the pending
connected-matrix-argument review. No global format promotion is approved.

## Tutorial

Use the existing exact chain **Solve x/2 + 3 = 7**:

| State | Equation | Incoming operation |
| --- | --- | --- |
| initial | x/2 + 3 = 7 | Read the equation |
| afterSubtract | x/2 + 3 − 3 = 7 − 3 | Subtract 3 from both sides |
| additiveCancelled | x/2 = 7 − 3 | Cancel additive inverses |
| rightSimplified | x/2 = 4 | Evaluate the difference |
| multiplied | 2(x/2) = 2 · 4 | Multiply both sides by 2 |
| denominatorCancelled | x = 2 · 4 | Cancel the denominator |
| solved | x = 8 | Evaluate the product |

Assume the learner understands arithmetic and equality but is learning to isolate
an unknown. Distinguish applying an operation to both sides from simplifying an
expression. End with the readable check `8/2 + 3 = 7`; animated substitution is
outside scope unless its existing supported semantic path is established.

Six transformations test a real trail without quadratic branching, graph
coordination or new solving machinery. This is intentionally elementary. A longer
equation with distribution and variables on both sides can test transfer later.

## Derivation trail behavior

1. A settled equation occupies a reserved document slot beside its explanation.
2. That historical occurrence stays there and scrolls with the document.
3. A separate continuation starts at the source geometry and travels toward the
   next slot. Desktop initially uses one equation lane to the right of prose;
   mobile places equations with their corresponding explanations.
4. Terms transform through the existing semantic transition. Initially try a
   short departure, transformation near the receiving slot, then settlement.
   Exact timing and travel are candidates for visual review.
5. The continuation hands paint ownership to the destination's native equation
   without a flash, double ink or layout change.
6. Reverse and direct seeks reconstruct the same trail without traversal history.

Historical sources persist; only one active transition surface is needed.
Future slots reserve geometry and settle as their segment completes. A direct
jump reconstructs the appropriate settled prefix. Reading mode shows the complete
stable derivation. At coincident departure geometry avoid double painting the
source and continuation; at arrival enforce exclusive continuation/target paint.
Separate historical occurrences can legitimately share a mathematical referent.

## Minimal authoring contract

Separate mathematical states/transitions, authored stops/links/prose, and derived
visual occurrences. Authors reference existing operations rather than cloning DOM
or supplying geometry. Illustrative local source shape, not an existing API:

```ts
const trail = {
  id: "solve-with-equal-moves",
  stops: [
    { id: "read", state: S.initial, text: "What is being done to x?" },
    { id: "subtract", state: S.afterSubtract, text: "Subtract three equally." },
    { id: "cancel", state: S.additiveCancelled, text: "The opposites cancel." },
    // Remaining stops follow the same pattern.
  ],
  links: [
    { from: "read", to: "subtract", via: T.subtract },
    { from: "subtract", to: "cancel", via: T.cancelAdditive },
  ],
};
```

`S` and `T` are aliases for registered state/transformation IDs, not a new semantic
registry. Explicit links leave room for later branching; this prototype validates
and presents only a linear path. Check unique IDs, reachability, and operation
source/target compatibility. Unsupported lowering returns a typed repair gap,
never a generic fade. Save a stable stop/link and local progress, not pixels.
Derive stable occurrence IDs from trail, stop and role.

## Existing owners and preservation

- Canonical lesson: `content/lessons/solve-fractional-linear.md`.
- Current host: `/reader/solve-fractional-linear/`.
- Semantic source: `src/semantic/fractional-linear-equation-asset.ts`.
- Animation adapter: `src/animation/fractional-linear-equation-adapter.ts`.
- Reader binding: `src/reader/app/equation-lesson-descriptors/fractional-linear.ts`.
- The route declares the shared equation presentation. Verify actual transition
  participation rather than treating metadata as fresh compositor evidence.
- Reuse the shared native surface, continuous-scroll clock and passage/document
  owners, following `../principles/reasoning-passage-presentation.md` and the
  generation entrypoint. Do not copy a demo page's complete theme.

Use an opt-in projection. Preserve existing routes, mathematical guarantees and
accepted motion. Rollback consists of the new source/host adapter; any necessary
shared mounting extraction must be independently recoverable. No new framework,
solver, scene graph, clock or universal tutorial schema is needed.

## Implementation sequence after plan approval

1. **Verify reuse and write the static trail.** Trace all six transitions through
   the responsible renderer; identify typed gaps. Write complete ordinary prose
   and seven native equation slots. Preserve the distinction between equal
   operations and local simplifications.
2. **Prove one handoff.** Exercise subtraction and its following cancellation:
   retained source, moving continuation, native settlement, reverse and direct
   seek. Reuse one active surface and check endpoint ownership before extending.
3. **Complete this exemplar.** Compose all six links with one trail projection.
   Actual document scroll owns progress. Allow unequal transition intervals and
   reading holds without requiring a viewport-sized card for each microstep.
4. **Preserve place across layouts and modes.** Add Animated/Reading, phone layout,
   keyboard navigation and semantic anchors. Restore semantic progress rather
   than raw scrollY after fonts, resize and mode changes. Reduced motion selects
   settled states independently of mode. Keep one accessible reading sequence;
   decorative continuations do not duplicate screen-reader output.
5. **Review before promotion.** Present one URL. Inspect a middle transition,
   reverse it, jump to the solution, return to an earlier explanation and switch
   modes midway. Judge reasoning continuity, retained history and excess spacing.
   Require this exemplar's review and a structurally different caller before
   promoting a general trail API.

## Verification, performance and scope

Test endpoint compatibility, occurrence ownership, boundary continuity, reverse
and direct seek, deep-anchor refresh, geometry invalidation, mode round trips and
disposal. Start with focused semantic tests and one repository-owned browser
command for Chromium desktop/phone; reserve the full browser matrix for promotion.

Require one active compositor, no per-stop live players, no KaTeX parsing or
full-document measurement per scroll frame, and no accumulating listeners.
Snapshots are static math. Cache geometry and invalidate on actual layout changes.
Measure incremental payload and scrolling cost against the existing equation
route before claiming the new presentation is cheap.

Defer graphs, quadratic methods, arbitrary generation, branching UI, zoomable
history, nested tutorial stacks, lateral detours, theme redesign and catalog
rollout. The imported handoff is provenance; its broader features are not all
required for this focused test. This proposal owns rationale; after approval an
execution record can own live progress. Commit checked recoverable slices and
back up under standing policy. The first human checkpoint is this complete
bounded exemplar, before generalization.
