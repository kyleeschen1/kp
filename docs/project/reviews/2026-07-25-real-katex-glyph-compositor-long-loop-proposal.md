# Real KaTeX glyph compositor long-loop proposal

Date: 2026-07-25

Status: approved

Theseus target:
`next-action.refill.experiment.plan-revision.kp.v8.native-math-settlement`

## Objective

Determine whether semantic-constrained glyph reconciliation can produce
convincing object-constant symbolic motion using actual rendered KaTeX
fragments rather than approximate text overlays or whole-equation crossfades.

The canonical exemplar is the solve-x cancellation:

`x + 3 - 3 = 7 - 3` to `x = 7 - 3`.

The existing native KaTeX source and target remain canonical. The experiment
must visibly transport the actual rendered `x`, keep stable semantic material
visible, reflow surrounding material gradually, and hand ownership to exact
native target notation without a size, weight, baseline, or position jump.

## Acceptance and preservation boundary

The slice-12 exemplar passes only when:

- no whole-equation crossfade occurs during active motion;
- no character replacement occurs during the `x` transit;
- cloned KaTeX fragments retain the source's computed font and styling;
- native handoff has no visible weight, baseline, size, or position jump and
  remains within one CSS pixel of the measured target;
- exactly one visual owner controls the `x` at each sampled moment;
- surrounding material remains visible and moves continuously;
- direct seek and rewind reproduce identical frames; and
- accessibility, hover, annotations, and semantic identity remain attached to
  authoritative native DOM rather than moving clones.

Preserve semantic artifacts, canonical execution and lineage, branching,
flashcards, Cloze, accessibility, hover, annotations, static-JavaScript
publication, optional headless compilation, and the standard review inbox.

The first exemplar remains isolated to the experiment route. Production
animation behavior does not change before the human checkpoint.

## Complexity and rollback budget

Reuse the existing material layer, computed-style cloning, font readiness,
semantic motion selectors, lineage matcher, and bounded clearance scheduler.
Add at most four focused production compositor modules and at most six generic
lifecycle primitives. Do not retain the approximate overlay renderer as a
parallel strategy after promotion.

Every slice is one independently reversible commit. Before slice 12, the
smallest full rollback unit is the experiment route plus its compositor seam;
the canonical semantic asset and production reader remain unchanged.

## Ordered slices

| # | Slice | Intended change | Risk | Verification and stop |
|---:|---|---|---|---|
| 1 | Failed-overlay baseline | Freeze the current mock-overlay failure, wide/phone evidence, and explicit visual laws. | Low | Focused tests and deterministic captures; stop if the defect is not reproducible. |
| 2 | Durable-boundary ratchet | Reject DOM, glyph geometry, keyframes, and backend plans from durable artifacts. | Medium | Schema and serialization tests plus typecheck. |
| 3 | Fragment-observation contract | Define an ephemeral native-fragment observation seam. | Medium | Pure contract tests plus typecheck. |
| 4 | Semantic KaTeX leaf observation | Resolve semantic motion nodes to exact rendered leaf rectangles. | High | Browser fixtures; stop if undocumented KaTeX-tree guessing is required. |
| 5 | Coordinate normalization | Normalize glyph geometry into one stage-relative coordinate space. | High | Responsive, transformed-container, and zoom browser checks. |
| 6 | Font and style settlement | Gate observation on font readiness and settled computed styles. | Medium | Font-readiness and invalidation browser checks. |
| 7 | Lineage-fragment binding | Bind observations only within executor-established lineage. | High | Ambiguity and equal-ink negative fixtures. |
| 8 | Computed-style fragment clone | Clone actual fragments into the existing material layer. | High | Geometry/style comparison; clones remain hidden from accessibility and hit testing. |
| 9 | Exclusive visual ownership | Transfer visual ownership through source, clone, and target states. | High | Dense ownership laws; no duplicate or invisible geometry owners. |
| 10 | Exact native handoff | Settle the clone into coincident native target geometry. | High | Filmstrip and one-pixel tolerance checks; stop on persistent bold, dip, or baseline flash. |
| 11 | Gradual context reflow | Move unchanged surrounding material between measured endpoints without full-layer fading. | High | Occlusion, discontinuity, and seek/rewind checks. |
| 12 | Real-glyph solve-x exemplar | Build the isolated live exemplar and stable wide/phone contact sheet. | Broad | Focused suite, browser check, typecheck, build, deterministic visual capture, then mandatory human review. |
| 13 | Delete mock overlay | After approval, remove the approximate overlay path. | Medium | Architecture/count ratchet and route parity. |
| 14 | Denominator fragment binding | Observe and bind both real source denominator fragments and the target denominator. | High | Semantic multiplicity and fragment tests. |
| 15 | Generic many-to-one compositor | Converge two actual `2` fragments without mid-flight character mutation. | High | Merge filmstrip; stop on fraction-specific scheduling. |
| 16 | Merge settlement and Cloze | Hand ownership to one native denominator while preserving Cloze authority. | High | Cloze, accessibility, hover, and ownership tests. |
| 17 | Generic one-to-many compositor | Fission one plus-minus origin into stable minus and plus descendants. | High | Split lineage, ownership, and native settlement tests. |
| 18 | Live branch interaction | Preserve branching, seek, rewind, hover, and annotations across the split. | Broad | Branch browser and interaction suites. |
| 19 | Crowded projection | Apply the unchanged compositor and scheduler to the crowded quadratic fixture. | High | Wide/phone collision and protected-ink checks. |
| 20 | Conservative settlement fallback | Make ambiguity and blocked geometry choose an inspectable checkpoint settlement. | Medium | Negative geometry and ambiguity fixtures. |
| 21 | Compound trace drill-down | Retain sped-up canonical operations and exact paused-frame drill-down. | Medium | Trace completeness and frame restoration tests. |
| 22 | Responsive and performance certification | Certify reduced motion, caching, payload, and frame-time budgets. | Broad | Performance script, production build, and wide/phone captures. |
| 23 | Complexity-negative migration | Remove superseded mock and policy code and prove architecture counts do not increase. | High | Architecture ratchets, convergence, build, and workspace validation. |
| 24 | Four-case decision checkpoint | Assemble the complete real-glyph route and release evidence. | Broad | Full tests, browser gates, production closures, performance, review-log audit, and human decision. |

## Mandatory checkpoint and promotion rule

Initial approval authorizes slices 1 through 12. Slice 12 is a mandatory human
checkpoint. Slices 13 through 24 remain stored but cannot execute until the
user explicitly approves generalization after reviewing the real solve-x
exemplar.

## Hard stop conditions

Stop rather than adding exceptions when:

1. semantic selectors cannot identify native fragments without brittle
   KaTeX-internal heuristics;
2. solve-x still requires whole-equation fading or mid-flight character
   replacement;
3. one bounded correction to shared geometry or handoff cannot eliminate the
   visible native-settlement jump;
4. any case requires operation-, fraction-, quadratic-, branch-, or
   viewport-specific scheduling;
5. DOM nodes, measurements, keyframes, or backend plans enter the durable
   artifact;
6. moving clones become accessibility or interaction authority;
7. the fixed module or lifecycle-primitive complexity budget is exceeded;
8. performance budgets require case-specific optimization;
9. existing semantic, reader, branching, Cloze, or production-closure checks
   regress;
10. radical behavior, broader family rollout, or unrelated user work enters
    scope; or
11. the slice-12 exemplar still reads as a crossfade, ghost, or text
    substitution.

One bounded correction is allowed only for an identifiable shared fragment
geometry or native-handoff defect. It may not introduce case-specific policy.

## Deferred work

No radical handoff repair, full Manim export, Python runtime, video encoding,
CAS, live LLM API, new renderer family, production family rollout, curriculum
expansion, or unrelated roadmap mutation.
