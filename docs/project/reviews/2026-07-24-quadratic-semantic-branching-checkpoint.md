# Quadratic semantic branching exemplar checkpoint

Status: awaiting renewed human review after symbolic-motion revision

Run contract: `run-contract.kp.quadratic-semantic-branching-v2`  
Slice: `slice-20`

## Recommendation

Review the quadratic lesson as the canonical reference for one equation with
two exact solution methods, explicit plus-minus branches, one native solution
set, and graph-root correspondence. Approve the exemplar before it is
published in the Animation Workbench or used to extract shared branching
contracts.

## Canonical reference

The exact semantic fixture in
`src/semantic/quadratic-branching-fixture.ts` owns
\(x^2-5x+6=0\), its coefficients, discriminant, and the roots \(2\) and \(3\).
The completing-square and quadratic-formula authorities derive two lawful
paths from that fixture. `src/animation/quadratic-branching-asset.ts` composes
those paths under one immutable animation identity, and
`src/animation/quadratic-presentation-profile.ts` owns the visual schedule.

The lesson route projects that asset through native KaTeX equation states,
explicit sign branches, a native KaTeX solution set, and an exact SVG parabola.
The SVG renderer receives exact graph points and root selectors; it does not
solve the equation. URL, scroll, controls, keyboard, equation, branches, and
graph all sample the same canonical clock.

## Observable acceptance criteria

1. The opening equation is quiet, centered, and immediately legible.
2. Completing the square and using the quadratic formula visibly move
   selector-owned symbols through measured paths rather than replacing whole
   equations, without changing the eventual root identities.
3. The plus and minus paths visibly separate into \(x=3\) and \(x=2\), with no
   duplicated or ownerless mathematical ink.
4. Both paths reunite into the native complete solution set
   \(x \in \{2,3\}\); neither root disappears or changes order.
5. The graph arrives after the algebra, and the two existing root identities
   meet the exact \(x\)-axis intersections rather than being recreated by the
   renderer.
6. Direct seek to any checkpoint is deterministic. Seeking from the graph
   backward through the branches and forward again reproduces the same frames
   without a snap.
7. Wide and phone layouts preserve the same reading order, branch meaning,
   graph correspondence, and controls without horizontal overflow.
8. System, reduced, full, and static motion choices remain understandable;
   keyboard endpoints, live narration, forced colors, and the no-script
   transcript preserve access to the complete explanation.

The automated criteria pass. The remaining decision is whether the two
methods, branch split, reunion, and graph handoff read as one coherent
explanation.

## How to inspect

The development server is available at
`http://127.0.0.1:8000/reader/quadratic-branching/`.

Useful deterministic states:

- Completing the square:
  `?kpLesson=lesson.algebra.quadratic-branching&kpVersion=1&kpProgress=180&kpMethod=completing-square&kpMotion=full`
- Quadratic formula:
  `?kpLesson=lesson.algebra.quadratic-branching&kpVersion=1&kpProgress=400&kpMethod=formula&kpMotion=full`
- Plus-minus branches:
  `?kpLesson=lesson.algebra.quadratic-branching&kpVersion=1&kpProgress=680&kpMethod=completing-square`
- Native reunion:
  `?kpLesson=lesson.algebra.quadratic-branching&kpVersion=1&kpProgress=880&kpMethod=completing-square`
- Graph correspondence:
  `?kpLesson=lesson.algebra.quadratic-branching&kpVersion=1&kpProgress=1000&kpMethod=completing-square`

After viewing the graph, drag back to 68 percent and then forward to 100
percent. Scrub slowly across 10–58 percent for each method, then switch methods
at 34, 40, and 68 percent. Repeat at a phone-width viewport.

`npm run visual:quadratic-branching` regenerates the deterministic 14-frame
contact sheet at
`tmp/codex/quadratic-branching-preservation/checkpoint-contact-sheet/contact-sheet.png`.
The sheet covers both methods, branch separation, native reunion, graph
settlement, and wide/phone projections. Direct-seek and rewind equivalence are
verified in the focused Chromium suite because they are temporal properties,
not separate static appearances.

## Verification evidence

| Gate | Result |
| --- | --- |
| Quadratic semantic convergence cohort | Passed |
| `npm run test:semantic-animation-convergence` | Passed: 255 tests |
| `npm run test:browser:reader-conformance` | Passed: 9 tests across 8 routes |
| Quadratic focused Chromium suite | Passed: 9 tests, including measured symbolic paths |
| `npm run test:browser:animation-workbench` | Passed: 14 tests; quadratic still mounts zero Workbench players |
| `npm run visual:quadratic-branching` | Passed: 14 preservation captures and deterministic 14-frame contact sheet |
| `npm test` | Passed: 2,257 tests |
| `npm run typecheck` and `npm run build` | Passed |
| Reader production closure and route budgets | Passed for all 8 routes |
| Development-review production closure | Passed: no review markers in 137 production files |
| `npm run perf:animation` | Passed with no regressions; existing product targets remain reported separately |
| `theseus workspace validate` | Passed |

## Preservation boundary and rollback

The preservation boundary includes the exact semantic fixture and solution
set, both method authorities, stable branch/root selectors, native KaTeX
endpoints, the shared clock, graph points supplied by semantic authority,
direct seek and rewind, the seven previously accepted reader routes, and every
already accepted animation family.

The smallest independently reversible rollback unit is the lesson-owned
quadratic route and its quadratic-specific semantic, animation, projection,
renderer, capture, and test files introduced by slices 3–20. Reverting that
unit does not require changing shared reader contracts, existing animation
families, or the radical implementation.

## Radical residual boundary

The known initial `1/2` jerk in the WebGL-assisted radical animation remains
documented in
`docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md`.
This quadratic exemplar neither changes nor imports that cross-renderer
handoff. Its formula notation remains native KaTeX, so approval here is not
evidence that the radical workaround transfers to other root animations.
Future root work must begin from native semantic and KaTeX ownership and opt
into another renderer only with its own explicit evidence.

## Promotion boundary

Approval authorizes slices 21–24: publish this exact exemplar in the
Workbench, extract only contracts proven by the already accepted solve-x
consumer and this quadratic consumer, audit compatibility and promotion
claims, and run final release proof. Approval does not authorize a general
quadratic curriculum, arbitrary polynomial solving, family-wide radical
promotion, or reuse of the radical WebGL material path.

## Human decision

Pending. Stop after this checkpoint until the user explicitly approves or
requests a bounded revision.

Human review accepted the graph and plus-minus branching, but rejected the
first checkpoint because the method phase replaced whole native KaTeX states
without visible symbolic movement. Slice 20 was reopened to repair that
presentation gap without changing the accepted graph or branch choreography.

The revision now moves selector-owned native KaTeX symbols through measured,
direct-seekable paths in both methods. In the completing-square path, the
constant visibly relocates across the equality; in the formula path, the
native radical and its evaluated value retain semantic ownership through the
transition. Full motion exposes those paths, while reduced and static modes
retain legible native checkpoints. The graph, branch split, reunion, semantic
fixture, and radical renderer boundary are unchanged.

The renewed review initially could not proceed because this route claimed
development-review readiness without mounting the standard inbox. The route
now uses the shared font/review lifecycle and emits the complete typed reader
capture frame. Shared reader conformance also requires the real review shell
and launcher, so a readiness attribute alone can no longer conceal this class
of omission on a generated page.
