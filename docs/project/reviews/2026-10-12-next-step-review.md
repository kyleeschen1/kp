# Next step after the repeatable row workbench

Status: recommendation only; no implementation scope authorized by this review.

## Current focus and evidence

The accepted workbench now supports repeated swap, nonzero scale and row
addition, exact rational values, atomic history, Undo/Redo and persistent
equality. The prior bounded run is complete. This is a useful working
mechanism, but source-only explanatory reuse and a general LA authoring format
have not been established for it.

Direct evidence: `src/math/linear-system-row-operation.ts` owns checked
operations and inverses; `row-session.ts` owns transactions and a two-row,
three-column presentation envelope; `row-workbench-model.ts` fixes the source,
demo sequence and x/y/z reading; `row-workbench.ts` owns operation-specific
wording; `row-workbench-view.ts` fixes geometry. The collection authoring packet
already separates annotations and typed source from its local renderer, providing
an existing example of the boundary to follow rather than a new global format.

## Options and rationale

| Option | Authoring value | Reuse evidence | Main cost/risk | Recommendation |
| --- | --- | --- | --- | --- |
| Authored operation sequences, tested on contrasting systems | High: change data, steps and explanatory intent without player edits | Direct test of the accepted mechanism | Small/medium; avoid a universal scene language | Do next |
| Corresponding equation and matrix representations of the current state | High: make meaning and representation inspectable | Strong cross-representation test | Medium; correspondence and cancellation must remain exact | Follow the authoring slice |
| 3×3 or other matrix shapes | Medium; enables more real elimination examples | Strong structural pressure on layout | Medium/high; new lanes, row selection and larger values | After bounded authoring reuse; required before broad renderer promotion |
| Another non-LA explanation through an existing algebra path | High product-thesis pressure across domains | Tests common authoring intent, not a universal mathematical authority | Scope can grow quickly; keep one reasoning move | Next breadth checkpoint after this LA boundary |
| More visual polish or controls | Low marginal authoring gain now | Limited new evidence | Easy to drift back into an endless visual iteration | Fix observed defects; defer speculative additions |
| Small learner observation | High evidence about understanding | Does not prove authoring reuse | Reader validation is explicitly deferred | Revisit only if the user changes that priority |

These are project-local judgments, not claims about market demand or measured
learning effectiveness. KP's nonprofit toolmaking direction favors reusable
explanatory machinery; additional content earns its place as a test case.

## Recommended next action

Introduce a small typed source boundary for this workbench: initial system and
ordered unknowns, stable named operation steps, and short annotations tied to
those steps. Reuse the existing exact checker, session, clock and local view.
Buttons and authored steps should invoke the same checked operation path. Keep
current defaults and free exploration. Invalid inputs or unsupported presentations
must produce located repairs, not approximate arithmetic or improvised motion.

Pressure it with two same-shape systems:

- Coefficients `[[1,2,3],[2,4,6]]`, RHS `[7,14]`: applying R2 ← R2 − 2R1
  produces the redundant constraint 0 = 0.
- The same coefficients, RHS `[7,15]`: the same operation produces 0 = 1,
  revealing inconsistency.

This pair changes the explanatory claim while reusing one operation. The current
view can show zero rows and RHS values through the operation path; do not route
these through the collection parser's separate all-zero-row restriction. A zero
row alone does not classify an arbitrary larger system; the contradiction or
redundancy explanation must refer to the complete checked constraints.

Done when, after the bounded extraction, both examples and their changed text
are authored without editing renderer, player or CSS; each retains exact history,
inverse reasoning and a readable static record. Record engine repairs honestly.
Use one existing host and a single review packet. This tests same-shape reuse;
it is not the structurally different caller needed for shared renderer promotion.

Then add an equation reading of the same current system, with explicit row and
coefficient correspondences. Begin with correct linked representations before
inventing a morph. This is especially valuable for 0 = 0 versus 0 = 1 and for
explaining why a row operation changes an equation but preserves the solution
set. Any universal API, automatic elimination, wider shape rollout, graph layer
or reader redesign is separate scope.

## Continuity and limits

Older recommendations to implement the first row operation are fulfilled, not
the next queue. Reader-layout and broad content-library work stay deferred;
no new run is created by this assessment. The roadmap links this proposal without
making it active implementation work. `theseus work resume` and `work next`
both hit existing tool-output limits (1641/1200 and 306/300 tokens); direct
canonical documents, the completed run contract and source inspection supplied
this review. No tool budget or execution queue was modified.
