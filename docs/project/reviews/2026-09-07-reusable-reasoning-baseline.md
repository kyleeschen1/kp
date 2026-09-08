# R2 exemplar and author-task baseline

Date: 2026-09-07. Scope: s01 of the approved R2 proposal; not visual approval.
Baseline commit: `8d9ffd7a4` (completed R1).

## Canonical ownership

- Canonical animation artifact: `animation.fraction-composition.two-thirds-solve`.
- Semantic source: `createKpLawfulFractionSolveMacro` in
  `src/semantic/fraction-solve-macro.ts`; exact verified equation states and
  operation adjacency. Bounded reason prefix: distribute, normalize,
  constant-product, constant-quotient. Normalization is real and must not be
  silently skipped to pretend this is only two primitive operations.
- Authored source: `createKpAuthoredDistributionExplanation` and its existing
  state assembly, verified receipt and pins. Projection retains the full
  canonical fraction animation; only its distribution endpoints are replaced
  by aggregate-backed truth. Later prefix steps remain owned by the macro.
- Host: `src/experiments/authoring-distribution-focus-card/entry.ts`, route
  `/experiments/authoring-distribution-focus-card/`.
- Transport: `buildKpAuthoredDistributionFocusCardPreview` and reader restore.
- Renderer: fraction-composition descriptor, canonical stage shell and
  `createKpChromeFreeCanonicalEquationSession`; one existing reader timeline
  clock and Focus Deck range controller.
- Card form: shared authored Focus Card content/scaffold. Preserve Georgia
  passage typography, loading shielding, coherent fraction transport,
  direct-arc motion, native evaluation and continuous input.
- References: Article semantic links explicitly carry `timelineAuthority:
  "none"`; a reason link must not become a second timeline authority.
- Prompts: existing `KpFlashcardSpec`, cloze/predict-next projections and
  separate answer state.
- Explanation spine v1 has a closed subtract/divide lesson vocabulary; it
  cannot honestly encode this procedure without changing its contract.
  Preserve it. Use the approved bounded authoring-side record, not a general
  spine rewrite or a claim that arbitrary nested procedures already exist.

## Reproducible baseline tasks

1. Wording: change authored cue prose in the existing shared card content.
   Prose remains editorial; no source-backed reason/prompt group yet exists.
2. Step/detail: the existing card intentionally selects only the first
   operation window. Extending its range requires host/controller coordination;
   no authored parent/reason range drives it today.
3. Reuse: flashcard specs can already reference native asset objects and
   transformations. Revision pin, required assumptions and parent return
   context are not carried by those specs; R2 must compose those around the
   existing projection rather than claim flashcard shape validation is proof.

Baseline has zero integrated parent/reason return paths and no author command
that updates full/compact/two retrieval views together. These are source
observations, not timing estimates or live-model results. Measure the same
tasks after integration; count new caller glue and repeated declarations.

## Acceptance and rollback

One isolated reasoning host will use the same verified fraction trace and
native path. Full reading may group steps; the child exposes their actual
adjacency and named assumptions. Native evidence cannot be replaced by
equation-string equality. Required context survives extraction. After editing,
inspect actual displayed states and answers, not compile status alone.

Each slice is one reversible commit; preserve tax and R1 routes and all existing
public/Article/semantic contracts. No promoted abstraction before s14 human
acceptance plus the code pressure caller. Stable baseline command:
`npm run test:reusable-reasoning`. Existing browser preservation:
`npm run visual:authoring-distribution-card`.
