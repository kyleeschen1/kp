# Symbolic exemplar sequence and responsive attention

Date: 2026-07-21
Status: accepted direction; attention interaction remains under design

## Decision

After the solve-x human checkpoint is accepted, promote polished symbolic and
geometric exemplars in this order:

1. distribution and factoring synchronized with the missing-middle area model;
2. fractions and division in equation solving;
3. radicals and exponents;
4. functional wrapping and unwrapping, including `sin`, `cos`, `log`, and
   parenthesized arguments;
5. derivatives synchronized with secant-to-tangent geometry;
6. integral accumulation before the more involved full FTC presentation;
7. vector addition and dot-product projection;
8. matrix-vector multiplication synchronized with a geometric linear map.

Existing standalone radicals, exponents, and function-wrapping products are
references and reusable semantic/motion evidence. Promotion still requires one
exemplar-quality reader integration and human checkpoint; it does not authorize
family-wide visual generalization in advance.

## Responsive constraint

Two-column scrollytelling is not the default narrow-device projection. On a
phone, stacking the text rail above or below a sticky animation stage consumes
too much vertical space and creates competition between reading and motion.
The same semantic document, checkpoints, URLs, focus refs, and runtime clock
must support a phone-specific interaction projection rather than compressing
the wide layout.

The leading narrow-device candidate is a focus stepper: one substantial visual
stage, one short active cue, direct step/scrub controls, and a frictionless
searchable transcript or review projection. The exact interaction remains to
be reviewed before implementation.

## Attention problem to solve

Text and animation currently compete for the learner's gaze. A learner reading
new prose cannot simultaneously inspect moving symbols. Future lesson
composition should therefore assign a primary attentional target for each
phase and explicitly hand attention between prose and visual evidence.

Candidate beat phases are:

1. orient: a short stable clause identifies the operation and pre-cues the
   corresponding visual objects;
2. act: the visual is primary, the prose does not introduce new information,
   and unrelated motion is suppressed;
3. settle: the result is static and explanatory prose can resume;
4. inspect: text and visual references become bidirectionally hoverable,
   focusable, tappable, and linkable.

This phase model is a design hypothesis, not yet a universal runtime contract.
It must be tested on the solve-x exemplar before promotion.

## Preservation requirements

- Keep the full lesson searchable and reviewable independently of animation.
- Preserve stable text, state, selector, and URL identities across wide and
  narrow projections.
- Do not autoplay important motion while presenting new prose that must be
  read.
- Do not require hover; keyboard focus and touch must expose the same
  correspondence.
- Do not let responsive layout changes alter semantic progress or rewind law.
