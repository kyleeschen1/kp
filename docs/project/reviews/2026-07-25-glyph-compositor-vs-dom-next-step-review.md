# Glyph compositor versus DOM-first next-step review

Date: 2026-07-25
Status: accepted as the decision boundary for the approved convergence loop

## Question

After the completed glyph-compositor promotion run, should KP continue toward
a general atomized glyph renderer, return to a native-DOM-centric equation
renderer, or combine the useful mechanics into one canonical equation
renderer while retiring duplicate implementations?

## Current evidence

The glyph work proved the semantic and runtime architecture more strongly than
it proved universal visual rendering:

- Canonical semantic lineage, rather than glyph equality or DOM order, drives
  identity and multiplicity.
- Renderer-session scene observations and plans remain ephemeral. Native KaTeX
  owns settled endpoints and all accessibility, focus, annotation, hover,
  Cloze, static, and export authority.
- The generic compositor covers persistence, merge, split, introduction,
  elimination, and explicit unsupported settlement without operation-specific
  scheduling.
- Fraction merge/split, rational-exponent-to-radical succession, one reader
  card, and a ten-operation completing-square trace pass deterministic seek,
  rewind, responsive, reduced-motion, performance, and closure gates.
- The `(x+y)/2` merge still has a visible endpoint defect. Its persistent plus
  clone retains a source/target computed-font-size ratio of roughly `1.43x`.
  Geometry, ownership, rule paint, and timing are correct; the remaining issue
  is typography adaptation between two native KaTeX contexts.
- The compositor is query-selected and dynamically loaded. Global reader or
  notation-family rollout was explicitly deferred.

The experiment should therefore be classified as:

- **semantic architecture:** passed;
- **generic lifecycle and structural coverage:** passed for the reviewed
  exemplars;
- **browser/product integration:** passed for one isolated reader card;
- **universal endpoint fidelity:** not passed;
- **default-renderer readiness:** not established;
- **global rollout:** not authorized.

## Important framing

The glyph compositor is not independent of the DOM. It observes native KaTeX
DOM, clones computed paint into an inert material layer, animates those clones,
and returns authority to native DOM. The meaningful product choice is:

1. use native DOM and semantic wrappers as the normal presentation surface;
2. use atomized clone transit only when a structural transformation cannot be
   expressed clearly with stable native elements; or
3. attempt to make atomized clone transit the universal equation renderer.

## Candidate comparison

Scores are relative, with `5` strongest except for risk, where `5` is highest
risk.

| Candidate | Authoring | Reliability | Reuse | Stale-system reduction | Slice size | Risk | Recommendation |
|---|---:|---:|---:|---:|---:|---:|---|
| Immediate universal glyph-compositor rollout | 3 | 2 | 5 | 3 | 1 | 5 | Do not pursue now |
| Abandon compositor and use DOM/checkpoints only | 4 | 4 | 2 | 4 | 4 | 3 | Fallback if the final gate fails |
| One canonical native-KaTeX scene renderer after a bounded gate | 5 | 5 | 5 | 5 | 3 | 2 | Recommended |
| Permanent DOM/compositor dual routing | 2 | 3 | 3 | 1 | 3 | 5 | Reject |
| Another broad endpoint-repair loop | 2 | 2 | 3 | 2 | 2 | 5 | Do not authorize |
| One bounded typography-handoff spike | 3 | 4 | 4 | 3 | 5 | 2 | Optional first slice |

## Recommendation

Do not retain a permanent DOM renderer and glyph renderer as peer
implementations. Adopt one **canonical native-KaTeX scene renderer**, provided
that one final bounded typography-handoff gate passes.

The semantic artifact, canonical operation execution, correspondence, clock,
and accessibility model already form the canonical upper layers. The winning
renderer should have internal presentation modes, not competing public
implementations:

1. **Native continuity mode** keeps intact native KaTeX material when stable
   semantic elements can move without atomization.
2. **Atom-transit mode** uses total semantic-constrained paint reconciliation
   for merge, split, rule bifurcation, or representational succession.
3. **Checkpoint-settlement mode** remains the conservative branch when lineage
   is ambiguous, geometry is blocked, or typography cannot hand off safely.

These modes must share one measurement pass, one reconciliation record, one
track sampler, one ownership law, and one native endpoint contract. They are
implementation strategies inside one renderer, not separately routed
animation products.

The current query-selected glyph route is a migration scaffold. It must not
become a permanent second reader implementation.

## What to keep and retire

| Existing work | Disposition |
| --- | --- |
| Semantic animation assets, canonical operations, lineage, clocks, checkpoints, branches, Cloze, annotations, and exports | Keep as the durable canonical model |
| Graph, SVG, DiagramScene, code, and table renderers | Keep; they are different render surfaces, not duplicate equation renderers |
| Native KaTeX source and target DOM | Keep as exact typography, layout, accessibility, and interaction authority |
| Generic scene observation, total reconciliation, multiplicity, track sampling, ownership, responsive containment, and settlement fallback | Keep and make the candidate canonical equation-renderer core |
| Existing choreography and motif definitions | Keep only as semantic/presentation intent that compiles into the canonical renderer |
| Reader operation-specific material-layer renderer | Freeze; migrate exemplars off it and delete each superseded path after parity |
| Query-selected reader compositor route | Keep only during the bounded decision and migration; remove the flag when one renderer wins |
| Older KaTeX/WebGL equation-transition path with no product source consumer | Mark archive-candidate, then remove after confirming no retained export or diagnostic dependency |
| Operation-, notation-, or viewport-specific geometry schedulers | Do not add; retire when the canonical scene renderer covers their accepted exemplar |

## Near-term implementation recommendation

Before any broader reader rollout or migration, run exactly one short
typography-handoff decision spike. Test a generic target-style or dual-endpoint
FLIP model at the clone boundary. It must:

- eliminate the fraction-plus size and baseline jump at wide and phone
  checkpoints;
- work through scene-level rules rather than a plus, fraction, or KaTeX-class
  exception;
- preserve exact native endpoints and inert transit ownership;
- regress neither inverse split nor radical succession;
- add no lifecycle, paint kind, operation scheduler, or durable geometry; and
- remain within the existing controller, payload, and performance budgets.

If that bounded model passes, declare the native-KaTeX scene renderer
canonical. Migrate one gold equation exemplar at a time and delete its old
operation-specific rendering path in the same slice. The query flag disappears
when the first production migration is accepted.

If that bounded model fails, fire the original `STOP_CUSTOM_PLANNER` intent:
do not retain a permanent selective compositor product path. Keep the semantic
lineage and reconciliation evidence, remove the query-selected reader
integration, and make native DOM plus explicit checkpoint settlement the one
canonical equation renderer. High-fidelity atom motion then remains experiment
or lesson-reference evidence, not a competing runtime.

This creates a real terminal choice:

```text
generic typography handoff passes
  -> scene compositor wins
  -> migrate and delete old equation render paths

generic typography handoff fails
  -> native DOM/checkpoint renderer wins
  -> remove product compositor routing
```

## Promotion policy

A compositor-backed family should require:

- two structurally distinct clean exemplars;
- no unresolved endpoint-style mismatch in that family;
- exact native endpoint authority;
- ordinary-route dynamic isolation;
- static, export, Cloze, focus, annotation, and accessibility preservation;
- wide and phone visual approval; and
- no operation-specific scheduling or notation-specific paint vocabulary.

Passing semantic and automated laws is necessary but not sufficient for
default product routing. Visible endpoint fidelity remains a human promotion
gate.

## Current focus and next action

Current focus: resolve the equation-renderer fork and remove permanent
dual-implementation ambiguity.

Recommended next action: approve one bounded typography-handoff decision spike
with the explicit pass/fail retirement outcomes above. Do not add another
equation animation or renderer feature before the winner is recorded.

## Stale-plan notes

`docs/project/roadmap.md`,
`docs/project/threads/cross-domain-tutorial-platform.md`, and
`docs/project/threads/semantic-runtime.md` still describe the glyph experiment
as pending or unapproved. They should be reconciled only after this renderer
policy is accepted. Existing user edits in the roadmap and active thread were
not modified by this review.
