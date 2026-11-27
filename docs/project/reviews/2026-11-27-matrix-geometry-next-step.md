# Next outcome: see the geometry of the column combination

Date: 2026-11-27
Status: proposed; implementation not started.

The user's “good. go” accepts the reference shelf and requests continuation.
Its contract now has all three packages complete. Recommend this distinct next
outcome for scope approval, returning to the mathematical-library goal after
establishing source export, independent playback and repeated return.

## Recommendation

One saved matrix card shows the same column combination symbolically and on a
compact 2D graph. The graph shows the columns, their signed scalar contributions,
and their head-to-tail sum as the existing seven-step explanation advances.
Seeking, reversing and restoring a saved position give matching representations.

| Candidate | Benefit | Existing foundation | Cost/risk | Recommendation |
|---|---|---|---|---|
| Link column algebra to 2D geometry | Direct symbolic/graphical explanation from one authored object | Accepted matrix runtime, column player and notebook graph | Bounded visual projection and clock subscription | Next |
| Add another mathematical family | Broader repertoire | Domain APIs exist, but product adapter needed | Larger semantic and visual scope | Later |
| Add more shelf management | Convenience | Accepted shelf | Low, but less mathematical value now | Defer |

Inspected owners: `math-resources/runtime.ts` already supplies typed operands,
product and source-linked explanations. `matrix-column-combinations/model.ts`
already derives terms and sums from `columnCombinations`; do not repeat their
arithmetic in a graph adapter. `fraction-notebook/matrix-graph.ts` demonstrates
equal-scale 2D coordinates through `graph-2d-scene.ts` and `graph-2d-svg.ts`, but
its input/output-only view is not the proposed animated decomposition.
The existing player exposes settled progress for persistence, not every sampled
frame: a small optional frame subscription at its clock owner is needed.

## Bounded scope and review

Canonical host: `/experiments/matrix-reference/?geometry=1`, initially opt-in.
Canonical source: the selected persisted `MatrixVectorDocument`; first review
uses the original shear example, then the existing negative/zero snapshots.
Mathematical authority: existing typed product and column-combination owners.
Symbol renderer: accepted KaTeX column embed. Graph renderer: the existing
independent Graph2D/SVG primitives, composed outside the notebook host. This
proposal does not decide a general SVG/WebGL replacement.

1. Derive a pure, source-linked geometric sample from the existing semantic
   combination and playhead. Keep original column/weight/result identities;
   zero and cancellation remain explicit. Fix equal axis scale and framing for
   a source so playback does not continually resize the graph.
2. Attach one compact graph to the reference card using the same clock, seek
   and disposal lifecycle. Add an optional sampled-frame subscription at the
   existing player boundary; no second clock, private RAF or persistence per
   animation frame. Existing consumers retain their current behavior.
3. Review one combined exemplar before promotion. Test positive, negative,
   zero and cancellation endpoints, direct seek/reverse equivalence, source
   replacement and teardown. Use a small Chromium/Firefox smoke cohort and the
   complete reader dependency/build check; reserve broad motif certification
   for accepted promotion.

Finish: changing/importing a supported source updates both representations;
the same controls and saved position govern both; one human-reviewed example
makes the column-sum relationship easier to see. Tests establish mathematical
and lifecycle correctness, not learner understanding or aesthetic acceptance.

Preserve the accepted notebook, plain reference-card route, shelf IDs/storage,
column choreography and restored fraction scrolling. Rollback unit: opt-in
graph adapter plus the optional frame-subscription seam. No saved source schema
change is needed. No broad renderer migration, new object family, LLM mutation,
publication, 3D, arbitrary CAS or expansion of the completed shelf contract.

Suggested execution: three packages above, four-hour ceiling including a final
45-minute verification reserve, checked rollback-unit commits and normal branch
backup. Stop at the combined-exemplar review. Approval starts a new contract;
the accepted shelf remains complete.
