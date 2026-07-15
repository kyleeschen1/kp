# Semantic Incremental Transition Next-Step Review

Date: 2026-07-15
Status: proposed; awaiting explicit loop approval

## Conclusion

The next KP loop should replace generic equation-layer cross-fades with a
semantic transition compiler and persistent token renderer, then make that
compiler the target of constrained LLM animation authoring. A minimal visual
diagram scene should close the loop by proving that the same semantic draft,
correspondence, timing, and validation contracts can drive a second surface.

## Evidence

- `src/editor/equation-surface-adapter.ts` renders source and target as whole
  KaTeX layers, remounts on phase/frame changes, and animates layer opacity.
- `src/editor/equation-runtime-frame-projection.ts` and
  `src/semantic/asset-transformation.ts` expose only one-to-one selector pairs
  on the active editor path.
- `src/semantic/correspondence.ts` already models identity, role-change,
  introduction, removal, cancellation, fan-in, fan-out, artifact, and focus.
- `src/rendering/equation-motion-plan.ts`,
  `src/rendering/equation-motion-sampler.ts`, and the older measured equation
  controller prove reusable token-level planning and sampling ingredients.
- `src/authoring/transform-fixture-contract.ts` already captures selector-aware
  generated KaTeX fixtures, rich correspondence, motifs, artifacts, and
  geometry diagnostics, but it is not connected to the shared editor player.
- The current LLM authoring specification describes good constraints but lacks
  a versioned draft schema, validator/compiler, insertion path, and one valid
  end-to-end generated example.

## Options Reviewed

| Option | Decision | Reason |
| --- | --- | --- |
| Improve opacity easing | Do not pursue | It cannot express persistence or lifecycle. |
| Add more bespoke family controllers | Defer | It increases coverage without creating a reusable authoring target. |
| Build a semantic transition compiler and token renderer | Do next | It joins existing rich correspondence, motion, KaTeX, and player contracts. |
| Add direct live-model generation first | Defer | The model needs a validated deterministic compiler target before an API surface. |
| Add a minimal visual diagram scene after equations | Include | It proves that LLM-authored semantics generalize without requiring a broad layout system. |

## Proposed 30-Slice Loop

Every slice is intended to end in focused verification and one commit. Standard
verification includes affected tests, `npm run typecheck`, and
`npm run theseus -- validate`; browser-facing slices additionally run the
focused Chromium spec. The final gate runs the full affected suite and build.

1. Record the approved run contract and queue focus.
2. Make rich correspondence available on semantic transformations without
   breaking the existing one-to-one shorthand.
3. Normalize shorthand and rich relations into one canonical map.
4. Add total lifecycle, endpoint-shape, composition, and rewind laws.
5. Define a renderer-neutral equation transition intermediate representation.
6. Compile active semantic transformations into that transition IR.
7. Resolve transformation-definition bindings and semantic roles to selectors.
8. Produce explicit diagnostics for missing bindings and fallback causes.
9. Define a stable selector-annotated LaTeX/KaTeX contract.
10. Render semantic token anchors and stable motion IDs into KaTeX.
11. Bind structural artifacts such as fraction bars, radicals, delimiters, and
    matrix brackets.
12. Bridge annotated source/target tokens to measured transition geometry.
13. Extract a reusable token motion renderer from the older measured demo path.
14. Keep the equation stage mounted across phases and remove remount jerk.
15. Drive sampled token frames from the shared editor playback session.
16. Restrict whole-layer fading to a visible, diagnosed fallback.
17. Move solve-x onto the shared semantic token renderer.
18. Add fraction simplification with cancellation and fan-in.
19. Add function wrapping with role-change and introduction.
20. Add distribution/factoring as inverse fan-out/fan-in examples.
21. Add exponent/radical transitions with structural artifact motion.
22. Add inequality relation replacement and persistent operand motion.
23. Add matrix-entry persistence and row/column emphasis.
24. Gate representative equation transitions at start, midpoint, end, reverse,
    and phase boundaries in Chromium.
25. Define a versioned constrained LLM animation-draft schema.
26. Validate and compile LLM drafts into semantic assets and transition IR.
27. Add one accepted generated equation example and actionable rejection
    diagnostics for invalid or underspecified drafts.
28. Define `DiagramScene` nodes, edges, groups, labels, correspondence, and a
    diagram render target.
29. Add a deterministic SVG diagram adapter and one generated semantic diagram
    using the shared player and draft compiler.
30. Run the full quality gate, record residual risks, close the run contract,
    and write the loop closeout.

## Expected End State

- Terms that persist remain visibly continuous instead of disappearing and
  reappearing with their equation layer.
- Cancellation, simplification, introduction, removal, fan-in, fan-out,
  role-change, relation replacement, and structural artifacts have executable
  motion semantics.
- Scrub, seek, reverse, rewind, and phase boundaries sample one shared clock
  without remount-induced jumps.
- Unsupported or underspecified transitions still render, but the editor labels
  the whole-layer fallback and identifies the missing semantic information.
- An LLM can produce a versioned semantic draft using approved definitions and
  selectors; KP validates and deterministically compiles it. Invalid target math
  or correspondence is rejected rather than animated optimistically.
- The editor contains at least one generated equation animation and one minimal
  generated node-edge diagram driven by the same semantic principles.

## Explicit Deferrals

- arbitrary symbolic equivalence or a broad computer algebra system;
- LLM-authored DOM, SVG coordinates, pixels, or raw keyframes;
- live model-provider integration, prompt management, or hosted generation;
- a general graph-layout engine, 3D diagram language, or arbitrary diagram DSL;
- complete bespoke motion coverage for every existing catalog descriptor;
- the six remaining symbolic-family promotions until this compiler is proven;
- unrelated dashboard, export, curriculum, package-loading, and media work.

## Stop Conditions

Stop and report before continuing if the work needs a second playback clock,
requires unsafe KaTeX internals, cannot preserve stable token identity without a
broad editor rewrite, requires a general CAS to validate draft output, permits
unverified arbitrary target equations, or expands diagram work into a general
layout engine.
