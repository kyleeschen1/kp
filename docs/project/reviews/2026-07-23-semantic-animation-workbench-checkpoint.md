# Semantic Animation Workbench control-plane checkpoint

Status: `HUMAN_CHECKPOINT`

The Workbench control plane is ready for human review. Quadratic semantic or
visual implementation has not started.

## Review routes

- Radical:
  `/?view=animation-workbench&q=radical&workbenchAnimation=animation.generated.radical.square-root-as-power`
- Derivative:
  `/?view=animation-workbench&q=tangent&workbenchAnimation=animation.derivative-rules.tangent-graph`
- Planned quadratic:
  `/?view=animation-workbench&q=solution+branching&workbenchAnimation=animation.algebra.quadratic.solution-branching`

## What the reviewer should verify

1. Search returns one top-level result per canonical animation; aliases and
   representations remain nested.
2. Radical and derivative reuse the existing player, direct seek, rewind,
   diagnostics, and semantic asset clock.
3. The acceptance brief cites asset law checks, lifecycle facets, and current
   review notes rather than creating an independent prose authority.
4. Roadmap, execution, maturity, approval, review, verification, and
   playability remain simultaneously visible and independent.
5. Current and historical review notes are isolated by canonical animation
   identity and link back to their captured route and provenance.
6. Representation switches change only the subordinate representation URL
   parameter; canonical animation identity and player asset identity remain
   stable.
7. Planned quadratic has no representation or player and names its missing
   evidence explicitly.
8. Keyboard search and traversal, system reduced motion, static checkpoints,
   and the 390-pixel stacked layout remain usable.
9. The selected animation appears immediately below its canonical title;
   `What I should see` follows the player controls; tags, lifecycle,
   representations, and review history form the lower metadata region.
10. The development review capture control remains visible for playable and
    planned items, docks left on wide layouts, and becomes a bounded sheet on
    narrow layouts.
11. A learner lesson appears only when the existing learner-experience
    registry explicitly names the same animation. The solve-x animation opens
    its real animated reader route; radical and derivative do not fabricate
    lesson links while dedicated lesson sources are absent.

## Stable evidence

- `npm run visual:animation-workbench` produced six current wide/narrow
  captures and one contact sheet. The manifest observed one player for radical,
  one for derivative, zero for quadratic, seven lifecycle facets on every
  item, one review capture control per item, an available local review
  projection, and no horizontal overflow.
- `npm run test:browser:animation-workbench` passed seven Chromium acceptance
  cases, including review capture and an actual Workbench-to-lesson handoff.
- `npm test` passed 2,026 tests after extending the learner-experience
  relationship contract.
- `npm run build` passed type-checking and production bundling.
- `npm run check:dev-review-production` proved the development review client
  and endpoint were erased from production output.
- `npm run review:logs -- audit` proved the append-only review source remained
  byte-stable and its projection retained identity and order.

The visual command writes disposable review output under
`tmp/codex/animation-workbench-checkpoint/`; durable evidence is the stable
command and the observable assertions above, not the generated screenshots.
