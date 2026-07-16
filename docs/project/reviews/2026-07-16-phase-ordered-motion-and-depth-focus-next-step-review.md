# Phase-Ordered Motion And Depth-Focus Next-Step Review

Date: 2026-07-16
Status: accepted; expanded by grill-me design

Expanded design:
`docs/superpowers/specs/2026-07-16-phase-ordered-choreography-and-gestalt-styles-design.md`

Execution proposal:
`docs/project/reviews/2026-07-16-phase-ordered-choreography-gestalt-style-loop-proposal.md`

## Conclusion

The next KP focus should be a phase-ordered choreography compiler that wraps
every operation-specific motif in a common attention and cleanup envelope. The
current runtime has semantic identity, lineage, stable layouts, paths,
continuous interpolation, and operation motifs, but it can still produce
perceptually disordered motion because those subsystems do not enforce when
focus, persistent reflow, semantic change, settling, and unfocus occur.

The dashboard examples for `x -> f(x)`, fractional exponent to radical, and
linear rearrangement should become the first conformance cohort.

## Evidence

- `src/rendering/equation-motion-quality.ts` checks position, scale, velocity,
  acceleration, boundary continuity, collision, crowding, and salience
  availability. It does not check perceptual phase order.
- `src/rendering/equation-visual-motif-timeline.ts` compiles operation-specific
  motif phases, but there is no universal preview/reflow/action/settle/release
  envelope.
- `src/rendering/executable-motif-grammar.ts` defines `kp.core.focus`, but focus
  is not automatically composed around movement-producing operations.
- The current `wrap` descriptor contains argument shift and wrapper entry, but
  no required focus preview or release.
- The older dashboard motion controller contains richer hand-tuned radical
  artifact folding and linear reflow behavior that the generated editor path
  does not yet treat as authoritative choreography.

## Recommended Guidelines

### Universal envelope

1. **Orient:** focus the causal or moving parts when focus is useful.
2. **Reflow:** smoothly move persistent entities to their target positions.
3. **Act:** perform vanish, introduction, copying, merging, replacement,
   structural morph, or operation-specific travel.
4. **Settle:** finish target alignment and remove source-only staging.
5. **Release:** unfocus and remove temporary presentation effects.

These are ordering and dependency rules, not rigid duration ratios. The
compiler may omit an empty phase or permit declared overlap, but it must retain
the causal order.

### Function wrapping

1. Focus `x`.
2. Move `x` continuously into its final argument position.
3. Introduce the parentheses as an enclosure around the already-positioned
   argument, then introduce `f`.
4. Settle enclosure spacing.
5. Release focus from the complete `f(x)` group.

### Fractional exponent to radical

1. Focus the base and fractional exponent as one causal group.
2. Move the persistent base into its final radicand position.
3. Morph or fold the exponent structure into the radical/index seed while the
   radical bar and hook form from that seed.
4. Settle native radical geometry and remove temporary bundle artifacts.
5. Release focus from the completed radical.

### Linear rearrangement

1. Focus the operand or terms that motivate the rearrangement.
2. Reflow all persistent terms, operators, and relation marks toward their final
   positions.
3. Introduce copied inverse operations, move operation-specific entities, and
   execute cancellation or simplification only after space exists.
4. Settle the new equation and preserve the relation anchor.
5. Release focus.

## Enforcement Design

Add a renderer-neutral `KpChoreographyPlan` above the current motif timeline.
It should contain:

- envelope phases and dependency edges;
- focus targets and optional focus profile;
- persistent, introduced, eliminated, copied, merged, and structural entity
  sets;
- layout reservation prerequisites;
- operation-specific motif bindings;
- settle invariants and rewind projection;
- accessibility projections.

Compile the plan from canonical operations, correspondence, lineage, salience,
layout snapshots, and motif specifications. The LLM-facing draft should remain
unchanged except for optional high-level salience/focus intent.

Add static laws:

- total lifecycle classification;
- focus-before-motion;
- persistent-reflow-before-change;
- cause-before-elimination;
- reservation-before-introduction;
- target-settle-before-release;
- exact rewind dependency reversal;
- no raw geometry in generated intent.

Add sampled laws:

- focus lead and release lag;
- persistent opacity and identity continuity;
- exact endpoint position and zero residual transform;
- velocity and acceleration at envelope boundaries;
- no attention gap during handoff;
- focus depth/shadow continuity;
- identical x/y paths with flat and elevated focus profiles.

Add conformance fixtures that sample start, focus peak, reflow completion,
semantic act midpoint, settle, release, and mirrored rewind. Prefer semantic and
geometry assertions over screenshot matching.

## 3D And Shadow Experiment

The first experiment should compare three trusted focus profiles on the same
choreography:

| Profile | Treatment | Purpose |
| --- | --- | --- |
| Flat | color, underline, or subtle plate | Control condition |
| Elevated | `translateZ`, tiny scale, soft shadow | Test depth as attention |
| Context dim | unchanged target with surrounding context reduced | Test focus without moving the target |

Start with group-level elevation, not individual glyph elevation. Use a
perspective container and an external focus wrapper or clone so KaTeX layout
remains untouched. Avoid rotation initially. Evaluate legibility, blur,
occlusion, perceived continuity, reduced-motion behavior, and whether the
effect incorrectly implies semantic importance.

Recommended initial bounds for experimentation, not contract constants:

- elevation: roughly 8–14 CSS pixels;
- scale: roughly 1.01–1.025;
- shadow: broad and low-opacity, with no hard edge;
- orientation and release: short relative to the semantic act;
- full return to zero depth, unit scale, and no shadow at settle completion.

## Options Reviewed

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Patch the three examples independently | 1 | 2 | 1 | 2 | Reject |
| Compile a universal choreography envelope | 5 | 5 | 5 | 3 | Do next |
| Build 3D focus before phase governance | 2 | 2 | 3 | 4 | Defer one tranche |
| Start live LLM prompt/upload ingestion | 5 | 3 | 4 | 4 | Defer until conformance |

## Suggested Implementation Order

1. Capture the three dashboard exemplars as phase and geometry baselines.
2. Define the choreography envelope schema and dependency laws.
3. Compile existing salience and motif timelines into the envelope.
4. Add focus-before-motion and settle-before-release diagnostics.
5. Move function wrapping onto the envelope.
6. Move linear rearrangement onto the envelope.
7. Move exponent/radical rewrite onto the envelope, preserving the dashboard
   fold/bundle behavior.
8. Add editor phase diagnostics and conformance summaries.
9. Add the flat/elevated/context-dim focus profile experiment.
10. Gate generated drafts and editor catalog promotion on envelope conformance.

## Stop Conditions

- Stop if focus styling changes measured layout or semantic x/y paths.
- Stop if the envelope requires a second playback clock.
- Stop if a universal phase model erases operation-specific causal ordering.
- Stop if 3D focus requires unsafe KaTeX internals or makes glyphs materially
  less legible.
- Stop if LLMs must author raw timing or geometry to make examples conform.

## Recommendation

Implement the universal choreography envelope first, using the dashboard
function-wrap, radical-rewrite, and linear-rearrangement examples as hard
behavioral references. Add 3D/shadow focus as a presentation-profile experiment
inside that envelope, after flat focus passes conformance.
