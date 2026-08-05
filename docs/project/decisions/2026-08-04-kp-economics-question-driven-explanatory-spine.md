# Restructure The Economics Exemplar Around A Question-Driven Spine

Date: 2026-08-04
Status: implemented exemplar; human editorial checkpoint pending

## Decision

Keep the economics lesson as continuous structured prose, but make its argument
advance through a legible causal sequence:

1. pose the concrete puzzle;
2. establish the initial model and equilibrium;
3. change exactly one relationship;
4. ask the learner to predict the consequence;
5. use a short transition passage to name what will move;
6. follow it with a distinct interpretation passage that states what the
   settled frame means;
7. repeat that transition/interpretation pair for the movement along supply;
8. use equations only after the visual mechanism is understood, as
   verification rather than a competing explanation; and
9. finish with scope, retrieval, and optional transfer.

A paragraph must not both forecast essential motion and interpret its result.
Transition prose should be short enough to coordinate attention before and
during movement. Interpretation may be longer because it is read against a
settled frame. This preserves the contextual advantage of prose without
turning the lesson into disconnected captions.

## Implemented Exemplar

`content/lessons/economics-demand-shift.md` now follows the question-driven
sequence while retaining its stable section, passage, motion-block, and
checkpoint identities. The two-column comparison uses six compact local beats:
graph at rest, initial equilibrium, demand transition, new-equilibrium
interpretation, supply-movement transition, and movement-along-supply
interpretation.

The final supply interpretation is deliberately separate from the motion that
precedes it. The old graph-side verification copy is absent from the two-column
comparison; the ordinary lesson prose explains the unchanged supply
relationship and then verifies both equilibria algebraically. Default and
inline-sticky presentations retain their existing verification surface.

## Authoring Boundary

This is evidence for a lesson grammar, not yet a shared schema. Do not require
every domain to use this exact nine-part sequence, and do not promote the
economics-local compact passage array as the public authoring API. A second
structurally different lesson must show which roles—question, transition,
interpretation, verification, retrieval—actually generalize.

## Verification

- `npm run test:economics-demand-shift-tutorial`
- `npm run visual:economics-two-column-scroll`
- `npm run visual:economics-inline-sticky-poc`
- `npm run test:browser:economics-demand-shift-tutorial`
- `npm run typecheck`
- `git diff --check`

## References

- `2026-08-02-kp-continuous-explanation-and-attention-coordination.md`
- `2026-08-02-kp-salience-transmission-engine.md`
- `2026-08-04-kp-two-column-natural-graph-and-uniform-strokes.md`
- `../threads/explanation-attention.md`
