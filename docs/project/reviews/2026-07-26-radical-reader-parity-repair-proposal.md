# Radical Reader Parity Repair Proposal

Date: 2026-07-26
Status: approved; slice 16 authorized
Contract: `run-contract.kp.radical-reader-promotion-kit-v0`
Target slice: `slice-16` (`apply-reviewed-generic-repair`)

## Recommendation

Replace the planned focus-color-only repair with one bounded parity repair:
make the glyph experiment and reader consume the same canonical native-KaTeX
session and give that session exclusive authority over atom-local paint.

This is an iteration inside the existing approved long-loop contract, not a new
long loop. Stop for immediate human review when slice 16 is complete. Do not
start promotion-kit extraction, the unit-exponent proof, or release work until
the reader matches the approved glyph reference.

## Are We Repeating The Same Mistake?

Yes at the architectural-pattern level, although not as the same literal bug.

Earlier failures repeatedly allowed two concepts to answer one paint question:

- settlement readiness and paint ownership were encoded as one continuous
  opacity, producing two-owner fades;
- native typography and moving-clone geometry were allowed to settle on
  different baselines, producing endpoint jumps;
- compatibility and canonical paths were both allowed to contribute paint,
  producing hidden implementation forks.

The radical reader now repeats the underlying authority error in a new form.
`KpNativeKatexRendererSession` samples the accepted local atom tracks, after
which `applyReaderMotionTrace` writes `left`, `top`, `width`, `height`,
`opacity`, and `transform` onto those same atom owners. The experiment does not
perform this second write. The reader also renders the equation at a much
smaller host type scale. The result shares compositor machinery but not the
approved presentation.

The recurring weakness is therefore:

> We have tested ownership of DOM layers, but not exclusive authority over
> individual presentation properties or parity between hosts.

That gap matters to governed LLM generation. The model boundary remains sound:
models select verified semantic operations and intent rather than authoring
pixels. But KP is not yet a trustworthy deterministic compiler target if host
adapters may reinterpret the compiled presentation after the canonical session
samples it.

## Canonical Reference

The accepted visual reference is the live radical card at:

```text
/glyph-reconciliation-experiment.html?radicalInventory=1
```

The reference behavior is:

- the radicand `x` remains one persistent visual entity;
- the fractional exponent and rule eliminate according to declared lifecycle;
- the native radical structure introduces according to declared lifecycle;
- a single compositor owns atom-local geometry, opacity, scale, and settlement;
- the notation is large enough for its structural motion to be legible; and
- native endpoints retain semantic, typography, focus, and accessibility
  authority.

The goal is not to preserve the experiment's surrounding chrome. The reader
keeps its lesson, controls, URLs, transcript, focus, annotations, accessibility,
static output, and exports.

## Slice-16 Repair

### 1. Freeze cross-host reference evidence

Add one live browser parity surface with a shared scrubber showing the glyph
reference and reader equation region side by side. Capture the same semantic
moments at 0%, 25%, 50%, 75%, 96%, 99.9%, and 100% in wide/phone and DPR 1/2.

The review surface must be accessible from the development webview. Disposable
PNGs may support automation, but they are not the human review interface.

### 2. Enforce one property authority

Refactor the canonical reader bridge so:

- `KpNativeKatexRendererSession` alone owns atom-local `left`, `top`, `width`,
  `height`, `opacity`, and `transform`;
- reader layout may transform only a parent presentation group;
- the canonical bridge no longer receives or reapplies atom-level reader motion
  poses;
- experiment and reader construct playback through the same reusable session
  factory; and
- native DOM remains the sole settled semantic and interaction owner.

Delete or narrow the superseded `applyReaderMotionTrace` path in the same
rollback unit. Do not add a radical ID, glyph-text, KaTeX-class, route, or
viewport branch.

### 3. Share legible responsive presentation

Move the accepted prominent equation sizing into one shared canonical-stage
presentation contract consumed by both hosts. Size must respond to available
inline space and measured fit, not to the word “radical” or a lesson ID.

Run the approved solve-x and fraction reader controls. If the shared size
cannot contain a longer expression, the generic fit surface must reduce it;
the repair must not introduce operation-specific type sizes.

### 4. Add permanent regression gates

Add three complementary gates:

1. **Property-authority gate:** fail if a canonical host writes atom-local
   paint properties after the renderer session.
2. **Cross-host parity gate:** compare the experiment and reader equation
   regions at the named moments under the same computed type size.
3. **Temporal continuity gate:** densely sample persistent atoms and reject
   opacity loss, style discontinuity, non-finite frames, endpoint velocity, or
   geometry jumps. Introduce/eliminate lifecycles remain legal and explicit.

The persistent `x` must remain fully opaque and style-continuous. The 99.9% to
100% ownership handoff must be geometrically and chromatically equivalent.

## Observable Acceptance

Slice 16 passes only when:

- the reader visibly reads as the approved glyph animation rather than a small
  replacement fade;
- the reader and experiment use the same session factory and sampled local
  tracks;
- no post-session atom-level style writer exists in the canonical reader path;
- the radical is legible at wide and phone sizes without overflow;
- the persistent `x` never fades, remounts, jumps, changes size, or changes
  color at native handoff;
- source structural elimination and target structural introduction remain
  governed by declared lineage rather than inferred glyph identity;
- solve-x and fraction canonical controls preserve their approved ownership,
  no-fade fission/fusion, geometry, seek, rewind, and responsive behavior;
- compatibility paint remains empty on migrated transitions;
- one live, shared-scrubber parity page is available for human review; and
- no production-family promotion begins before explicit visual approval.

## Verification

Focused implementation gates:

```text
npm run test:canonical-equation-renderer
npm run test:real-katex-glyph-compositor
npm run test:radical-reader-promotion
npm run test:browser:radical-reader-promotion
```

New stable gates:

```text
npm run test:browser:canonical-host-parity
npm run visual:canonical-host-parity
```

Boundary gates:

```text
npm run test:browser:canonical-animation-construction
npm run typecheck
npm run check:architecture
npm run build
theseus workspace validate
```

The visual command must open or generate the browser-readable live parity
surface; loose image files alone do not satisfy the checkpoint.

## Preservation Boundary

Preserve:

- canonical semantic objects, operations, laws, roles, and lineage;
- the governed LLM request/compiler boundary;
- existing reader lesson content, controls, attention, URLs, transcript,
  focus, annotations, accessibility, static mode, Cloze, and export seams;
- approved solve-x and fraction behavior; and
- compatibility coverage for unmigrated transitions.

Do not:

- add another renderer, clock, runtime, durable animation artifact, or product
  route;
- let the LLM author presentation coordinates, CSS, glyph matches, timing, or
  DOM;
- add radical-specific geometry, timing, font size, or lifecycle behavior;
- broaden into promotion-kit extraction or unit-exponent work; or
- update visual goldens merely to accept the degraded reader output.

## Stop Conditions

Stop and report rather than widening the repair if:

- exact parity requires a radical/operation/route-specific branch;
- the accepted experiment actually depends on a second runtime or inaccessible
  private state;
- removing the second atom writer breaks solve-x or fraction and cannot be
  repaired through a generic parent-group/local-atom boundary;
- the canonical session cannot preserve persistent style and native settlement
  simultaneously;
- the live parity surface needs a production runtime fork; or
- visual comparison still reads as a fade/replacement after the automated
  contracts pass.

## Rollback

One slice-16 commit is the independently reversible unit. Reverting it restores
the current checkpoint implementation without touching the completed semantic,
reader-seam, accessibility, export, or geometry work from slices 1–15.

If the stop condition fires, keep the glyph experiment as the approved visual
reference, mark the radical reader route unpromoted, and retain the completed
semantic integration as evidence. Do not call the current reader animation
canonical.

## After Approval

On approval, replace only slice 16's stored summary with this reviewed repair
scope, execute it, and stop at another `HUMAN_CHECKPOINT`. Slices 17–20 remain
planned but inactive until the user approves the live parity result.
