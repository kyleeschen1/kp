# Semantic KaTeX Transform Long-Loop Proposal

Date: 2026-07-09
Project: kp
Status: proposal

## Summary

Proposes a long loop for fleshing out semantic equation objects,
semantic transformations, correspondence maps, and KaTeX animation cases. The
goal is to make equation animation downstream of semantic identity rather than
DOM diff guesses.

The standard Theseus command was attempted first:

```sh
npm run theseus -- long-loop-report --limit 30
```

It failed because this repository currently has no `theseus` script in
`package.json`. This proposal is therefore recorded manually under the
configured Theseus `eventsRoot`, `docs/theseus/events`, following the existing
repo fallback pattern.

## Run Contract

Run contract id: `run.semantic-katex-transform-v1`

Title: Semantic KaTeX transform foundations

Domain: `semantic-animation`

Goal: Build the V1 foundation that lets authored equation animations preserve
semantic identity through `SemanticObject`, `SemanticTransformation`, and
`CorrespondenceMap` definitions, then expose those cases through catalog cards
and focused test fixtures.

Run mode: proposal until approved.

Max slices: 24.

Commit cadence: commit after each verified slice.

Default verification level: standard for source changes; focused for docs,
catalog metadata, and pure helper fixtures.

Allowed work:

- semantic object and expression selector foundations;
- semantic transformation records for equation algebra;
- correspondence-map records and lifecycle relations;
- KaTeX transform taxonomy fixtures;
- renderer adapters that consume explicit correspondence maps;
- dashboard/catalog entries for implemented or proposed cases.

Disallowed work:

- broad UI redesign;
- full CAS implementation;
- full arbitrary LaTeX parser;
- replacing KaTeX layout;
- replacing the existing WebGL graph renderer;
- large unrelated refactors.

Stop conditions:

- stop if a slice requires a broader math object model decision not captured in
  this proposal;
- stop if verification fails and the cause is architectural rather than local;
- stop if the next slice would broaden beyond semantic equation transform
  foundations;
- stop when all approved slices are exhausted.

## Proposed Slices

1. Add semantic transform node records to the dashboard catalog
   Target: `frontier.catalog.semantic-transform-groups-v1`
   Risk: low.
   Verification: focused.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts`
   Commit boundary: catalog data, editor test assertions.
   Stop if: catalog data needs a persistence format before more cards are useful.

2. Add KaTeX transform taxonomy proposal to docs
   Target: `frontier.docs.katex-transform-taxonomy-v1`
   Risk: low.
   Verification: focused.
   Expected checks:
   - `git diff --check`
   Commit boundary: taxonomy doc only.
   Stop if: taxonomy scope expands beyond equation/text transitions.

3. Define core selector relation vocabulary
   Target: `frontier.semantic.correspondence-relation-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts`
   - `npm run typecheck`
   Commit boundary: relation types and tests.
   Stop if: relation names conflict with existing lifecycle naming.

4. Introduce `CorrespondenceMap` records for equation transitions
   Target: `frontier.semantic.correspondence-map-record-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts`
   - `npm run typecheck`
   Commit boundary: type definitions and transition-map fixture tests.
   Stop if: existing transition tokens cannot carry maps without churn.

5. Split semantic lifecycle from visual lifecycle
   Target: `frontier.semantic.visual-lifecycle-separation-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts`
   - `npm run typecheck`
   Commit boundary: lifecycle vocabulary and compatible adapters.
   Stop if: sampler API needs a breaking redesign.

6. Add expression selector paths for current equation fixture
   Target: `frontier.expression.selector-paths-linear-equation-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/latex-parser.test.ts`
   - `npm run typecheck`
   Commit boundary: selector path helpers for `x + 3 = 7`.
   Stop if: parser limitations block stable selector emission.

7. Generalize `subtractBothSides` beyond the hardcoded fixture
   Target: `frontier.transform.subtract-both-sides-general-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-plan.test.ts`
   - `npm run typecheck`
   Commit boundary: transform generator and fixtures.
   Stop if: expression parser cannot preserve enough structure.

8. Generalize additive inverse cancelation
   Target: `frontier.transform.cancel-additive-inverse-general-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/equation-motion-sampler.test.ts`
   - `npm run typecheck`
   Commit boundary: cancel transform and correspondence-map tests.
   Stop if: repeated term ambiguity needs an authoring UI first.

9. Generalize constant-expression simplification
   Target: `frontier.transform.evaluate-constant-expression-v1`
   Risk: medium.
   Verification: standard.
   Expected checks:
   - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/math-expression.test.ts`
   - `npm run typecheck`
   Commit boundary: constant evaluator transform and simplify-into maps.
   Stop if: exact arithmetic semantics are unclear.

10. Add `NotationTransform` category
    Target: `frontier.semantic.notation-transform-v1`
    Risk: medium.
    Verification: standard.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/equation-transform.test.ts tests/katex-token-snapshot.test.ts`
    - `npm run typecheck`
    Commit boundary: notation-transform types and docs.
    Stop if: notation transform overlaps too much with semantic transform.

11. Add fraction make/split/combine taxonomy fixtures
    Target: `frontier.katex.fraction-transform-fixtures-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/katex-token-matcher.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: KaTeX fixture cases and expected structural nodes.
    Stop if: DOM capture cannot reliably isolate fraction bar and numerator.

12. Add exponent/subscript role-change fixtures
    Target: `frontier.katex.script-transform-fixtures-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/katex-webgl-transition.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: script fixture cases and sampler expectations.
    Stop if: baseline/scale measurement needs a new geometry contract.

13. Add radical/root fixture coverage
    Target: `frontier.katex.radical-transform-fixtures-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: radical SVG detection and fixture diagnostics.
    Stop if: radical SVG capture needs a renderer-specific fallback.

14. Add delimiter and wrapper transform fixtures
    Target: `frontier.katex.wrapper-transform-fixtures-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts tests/equation-motion-plan.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: parentheses, absolute value, norm, and function wrapper cases.
    Stop if: scalable delimiter identity needs separate artifact records.

15. Add large-operator fixtures
    Target: `frontier.katex.large-operator-fixtures-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/katex-token-snapshot.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: sum, product, integral, limit fixture cases.
    Stop if: under/over limit geometry needs layout-role metadata first.

16. Add matrix/vector transform fixtures
    Target: `frontier.katex.matrix-transform-fixtures-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/rendering.test.ts tests/katex-token-snapshot.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: matrix bracket, entry selector, row/column fixture cases.
    Stop if: matrix selectors need a dedicated matrix-view adapter first.

17. Add visual artifact lifecycle records
    Target: `frontier.render.visual-artifact-lifecycle-v1`
    Risk: medium.
    Verification: standard.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/katex-token-snapshot.test.ts`
    - `npm run typecheck`
    Commit boundary: artifact records for bars, brackets, radical glyphs, accents.
    Stop if: artifact IDs cannot be stable across KaTeX output.

18. Add correspondence-aware token matching override
    Target: `frontier.render.katex-correspondence-overrides-v1`
    Risk: high.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/katex-token-matcher.test.ts tests/katex-transition-controller.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: matcher override API and browser fixture.
    Stop if: controller API must change in a way that affects existing callers.

19. Add role-aware motion primitive descriptors
    Target: `frontier.motion.role-aware-primitives-v1`
    Risk: medium.
    Verification: standard.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/equation-motion-sampler.test.ts tests/equation-motion-player.test.ts`
    - `npm run typecheck`
    Commit boundary: descriptors for inline-to-fraction, inline-to-script, wrap, unwrap.
    Stop if: existing sampler cannot express role-specific scale/baseline.

20. Add beat compiler for semantic transform timelines
    Target: `frontier.motion.semantic-beat-compiler-v1`
    Risk: high.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/equation-motion-plan.test.ts tests/equation-motion-sampler.test.ts tests/equation-motion-player.test.ts`
    - `npm run test:browser:katex`
    - `npm run typecheck`
    Commit boundary: transform-to-beats compiler and current demo migration.
    Stop if: current equation demo behavior regresses.

21. Add scrubber fixture gallery for transform cases
    Target: `frontier.dashboard.katex-transform-gallery-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/project-dashboard.test.ts`
    - `npm run test:browser:dashboard`
    - `npm run typecheck`
    Commit boundary: dashboard cards and fixture selection UI.
    Stop if: gallery storage needs a persistence decision.

22. Add fixture import/export shape for LLM-authored transforms
    Target: `frontier.authoring.transform-fixture-contract-v1`
    Risk: medium.
    Verification: standard.
    Expected checks:
    - `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/semantic.test.ts`
    - `npm run typecheck`
    Commit boundary: JSON-compatible fixture schema and validation.
    Stop if: schema needs full object-history integration.

23. Add report-card checklist for semantic animation readiness
    Target: `frontier.theseus.semantic-animation-report-card-v1`
    Risk: low.
    Verification: focused.
    Expected checks:
    - `git diff --check`
    Commit boundary: Theseus event or dashboard report seed data.
    Stop if: report card should be generated by a future Theseus CLI instead.

24. Run broad closeout verification and record Theseus stop report
    Target: `frontier.loop.semantic-katex-transform-closeout-v1`
    Risk: medium.
    Verification: broad.
    Expected checks:
    - `npm run typecheck`
    - `npm test`
    - `npm run test:browser:katex`
    - `npm run test:browser:dashboard`
    - `git diff --check`
    Commit boundary: closeout event with evidence and residual risks.
    Stop if: any broad verification failure needs product judgment.

## Deferred

- Full arbitrary LaTeX semantic parser: deferred because V1 should use authored
  semantic objects and correspondence maps, with visual heuristics only as
  fallback.
- Full computer algebra system: deferred because the loop needs enough exact
  transforms for animation identity, not a complete solver.
- Native WebGL text layout: deferred because KaTeX remains the typography and
  accessibility source of truth.
- Full matrix row-operation animation: deferred until the matrix selector and
  fixture slices are in place.
- Curriculum dependency graph integration: deferred until transform fixtures can
  be referenced as stable gallery cards.
- Production iframe/embed runtime: deferred until object, transform, and
  timeline contracts stabilize.

## Why This Loop Now

- It advances the active direction that animations should be generated from
  semantic identity rather than visual diffing.
- It turns the current hardcoded equation demo into a path toward general,
  authored semantic transformations.
- It gives the API catalog and dashboard concrete cards to track.
- It keeps the slices independently verifiable and avoids a broad CAS/parser
  rewrite.

## Approval Gate

Do not execute the loop until the user explicitly approves this proposal.
