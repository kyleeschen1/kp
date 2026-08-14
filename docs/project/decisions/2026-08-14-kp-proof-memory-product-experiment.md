# KP Proof-Memory Product Experiment

Status: accepted experiment
Date: 2026-08-14

## Decision

Test a narrower learner-product thesis before continuing the existing public
projection sequence:

> KP helps a learner inspect, reconstruct, and retain a difficult symbolic
> argument instead of repeatedly relearning it from scratch.

This is the **Proof Memory Loop** experiment. It is a bounded product wedge,
not yet a replacement for KP's compiler, publication, catalogue, or broader
public-product strategy.

The loop is:

```text
encounter confusion
-> inspect the exact objects and dependency
-> predict or reconstruct the next inference
-> save a compact prompt
-> return after a delay
-> pressure the idea with a variation
-> re-enter the full searchable proof at the lost context
```

The initial audience is a technically mature learner who has encountered the
notation but cannot yet reliably reconstruct the argument. Public discovery
may still begin with an urgent question or quick explanation; the distinctive
value is durable understanding and re-entry, not greater animation volume.

## First Exemplar

Use the proof that every complex normal matrix is unitarily diagonalizable,
inspired by Michael Nielsen's
[spaced-repetition mathematics essay](https://cognitivemedium.com/srs-mathematics),
as the first proof-memory exemplar.

This proof is a good pressure case because it is:

- bounded enough to finish and review;
- dense enough to expose symbol-role and working-memory failures;
- organized around two inspectable ideas rather than a long calculation;
- naturally decomposable into prediction, reconstruction, and boundary
  prompts; and
- explicitly underserved by static flashcards when a learner needs to see the
  relevant row, column, product entry, and inference together.

KP will write an original explanation and prompt set. Nielsen's article is a
research reference, not source copy; its noncommercial license must not leak
licensed wording or card content into a future commercial artifact.

## Bounded Exemplar Scope

The first proof should contain:

- one static, searchable proof that remains useful without JavaScript;
- a compact ledger for the theorem's symbols, roles, and assumptions;
- roughly five semantic checkpoints covering the two core ideas and recursive
  conclusion;
- one native-KaTeX matrix scene with semantic addresses and direct seeking;
- approximately eight to twelve prompts spanning recall, prediction,
  explanation, and one or two boundary variations;
- links from every prompt back to the exact proof state it tests; and
- a small single-learner review rehearsal sufficient to test delayed return.

Existing Article, semantic-link, native-KaTeX, deterministic-timeline,
flashcard-projection, and URL-restoration capabilities should be reused. The
exemplar may add semantic content and bindings; it may not add a second clock,
generic matrix engine, learner database, or universal lesson layout.

## Evidence Gate

The experiment earns another proof when it demonstrates most of the following:

- the learner can relocate a forgotten symbol or dependency quickly;
- the learner can reconstruct the proof after one day and again after one
  week with less external support;
- prompts feel like views into one durable proof rather than disconnected
  cards;
- semantic motion or selection makes at least one inference clearer than a
  static diagram or video alone;
- authoring a useful variation mostly adds semantic content, not renderer or
  runtime machinery;
- the learner voluntarily returns, edits, or saves prompts; and
- at least a small number of tutors, instructors, or serious learners would
  reuse, assign, or pay for the resulting memory object.

The experiment should stop or narrow if it merely reproduces an article plus
ordinary flashcards, requires large new matrix/layout infrastructure, or fails
to improve reconstruction and re-entry.

## Preservation Boundary

- Preserve the verified semantic-to-interactive compiler as product core.
- Preserve the approved TypeScript and algebra public exemplars.
- Preserve the current economics source and generated-publication edits.
- Treat economics graph pressure as paused behind this checkpoint, not
  rejected or obsolete.
- Keep full curricula, accounts, classrooms, automated scheduling, SVD, broad
  linear algebra, and Graph3D out of the first experiment.

## Reversibility

The smallest rollback unit is the proof-memory Article, prompt projection, and
its route. Any experiment-specific presentation remains local until a second
structurally different proof demonstrates a reusable boundary.
