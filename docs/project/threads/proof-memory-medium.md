# Proof-Memory Medium

Status: experiment
Last Updated: 2026-08-14
Current Next Action: review
`../reviews/2026-08-14-normal-matrix-proof-memory-exemplar-spec.md`. If the
human checkpoint approves it, create an executable Theseus contract for the
eight bounded implementation slices. Do not implement a scheduler, broad
matrix API, SVD sequence, or linear-algebra curriculum.

## Goal

Determine whether KP can become an inspectable mathematical memory medium: a
learner can move between a full searchable argument, an exact semantic state,
a reconstruction prompt, and a later return without losing object identity or
proof context.

## Product Hypothesis

Many learners seek quick fixes, but a smaller high-intent audience has a costly
recurring problem: notation and local explanations fade before the proof or
model becomes durable mental structure. KP may serve that audience by making
the same semantic object usable as explanation, intuition pump, prompt,
variation, and re-entry point.

The experiment does not assume that "depth" is a mass-market pitch. A public
entry may answer an immediate question; the retained value is that the learner
does not need to start over next time.

## Canonical Workflow

Use **Proof Memory Loop** for this experiment's learner workflow:

1. inspect the full proof;
2. focus the exact objects supporting an inference;
3. predict or reconstruct the next step;
4. save or revise a compact prompt;
5. return after a delay;
6. pressure the same structure with a variation; and
7. jump back into the complete searchable proof at the relevant state.

Do not treat cards as separate content authority. They are projections of the
same proof, semantic addresses, and deterministic states.

## Canonical Exemplar

The first candidate is the proof that a complex normal matrix is unitarily
diagonalizable. Its semantic spine is:

1. diagonal entries of `MM†` are squared row norms;
2. diagonal entries of `M†M` are squared column norms;
3. normality therefore equates corresponding row and column norms;
4. choose an orthonormal basis beginning with an eigenvector, so the first
   column is `(lambda, 0, ...)`;
5. equal first-row and first-column norms force the remaining first-row entries
   to zero; and
6. recurse on the lower-right block.

The exemplar should use semantic identities for the matrix, adjoint,
eigenvalue, first-row remainder, first column, relevant product entries, and
lower-right block. Glyph equality must not stand in for identity.

## Exemplar Acceptance

- The complete proof is searchable static HTML.
- Definitions and symbol roles can be recovered without replay.
- Roughly five directly addressable proof checkpoints are sufficient to
  reconstruct the argument.
- A minimal native-KaTeX matrix scene highlights exact row/column products and
  preserves settled math as the paint authority.
- Eight to twelve prompts reuse existing flashcard-projection kinds where they
  fit: cloze, explain-transform, focus-relationship, and predict-next.
- Each prompt restores the exact proof and animation state through a stable
  URL.
- One prompt tests why complex scalars matter; another tests why checking the
  diagonal condition in an arbitrary basis is insufficient.
- A manual day-one/day-seven rehearsal is possible without an account system
  or production scheduler.
- The route uses the existing clock, renderer ownership, Article authority,
  and static/no-JavaScript truth.

## Demand And Learning Evidence

Track:

- time to recover the meaning of a forgotten symbol;
- unaided proof reconstruction immediately, after one day, and after one week;
- which prompts are rewritten, discarded, or voluntarily revisited;
- whether semantic selection or motion changes an inference the learner can
  explain;
- whether a learner can traverse from a prompt to context and back without
  feeling lost;
- authoring time and number of runtime/renderer exceptions; and
- reuse, assignment, or payment interest from a small set of serious learners,
  tutors, or instructors.

These are experiment measures, not a promise to build analytics or learner
profiles.

## Promotion Boundary

One approved proof establishes an exemplar. A structurally different second
proof is required before promoting a general proof-memory authoring contract.
SVD is a possible later destination, not the second slice by default. A second
caller should be selected for maximum semantic contrast and minimum new
renderer authority.

## Out Of Scope

- a complete linear-algebra course;
- singular value decomposition as the first exemplar;
- a generic matrix animation system;
- 3D visualization;
- automated spaced-repetition scheduling, accounts, or learner models;
- mass generation of cards before the proof representation is good;
- copying Nielsen's prose or cards; and
- selecting a universal reader layout.

## Links

- `../decisions/2026-08-14-kp-proof-memory-product-experiment.md`
- `../reviews/2026-08-14-proof-memory-experiment-next-step-review.md`
- `../reviews/2026-08-14-normal-matrix-proof-memory-exemplar-spec.md`
- `../roadmap.md`
- `../strategy.md`
- [Michael Nielsen, "Using spaced repetition systems to see through a piece of mathematics"](https://cognitivemedium.com/srs-mathematics)
