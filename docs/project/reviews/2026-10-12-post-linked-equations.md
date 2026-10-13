# After the linked-equation experiment

Status: the user approved the composition recommendation with “go”.

The user said: “this is fine, although I don't see using this animation. proceed”.
Close the bounded technical checkpoint. Do not translate this into enthusiasm
for the presentation, learner benefit, or permission to promote it globally.
Preserve the existing panel and tests as inspection evidence; no removal was
requested. The underlying row workbench and authored stories were separately
accepted and are not rejected by this comment.

## Recommendation

Test one composable explanation: equations → collect unknowns into a vector →
perform one checked row operation → expand the resulting matrix back into
equations. Reuse the accepted collection and compact arithmetic motifs on the
existing host. Use the original two-equation, three-unknown system and add row
2 to row 1, exposing `6 = 2x + z` while retaining `-1 = y - 2z`.

The teaching job is to show that coefficient manipulation changes complete
equations, including RHS, while preserving their joint solutions. The engineering
job is to carry the same semantic objects through adjacent representations and
operations without duplicated example data or caller-specific arithmetic.
This directly tests the user's desired composability and reversibility; another
selection control or larger grid would not establish it.

## Evidence and missing boundary

- `linear-system-source.ts` supplies the accepted collection fixture.
- `polynomial-view.ts` supports reversible collection for its compiled model.
- `row-operation-view.ts` already reuses that view, but calls `base.render(1)`:
  its guided animation begins at the assembled matrix, with a fixed addition.
  Do not mistake shared rendering code for the complete proposed composition.
- `row-workbench-source.ts`, `row-session.ts` and the exact operation checker
  now support repeated authored operations, but the host is separate.
- `row-equations.ts` derives truthful endpoint equations with coefficient and
  unknown references. Its linked panel is not a required part of the new view.
- Collection and workbench currently construct their own semantic objects. A
  matching fixture or identifier string is not a valid continuity handoff.

The first implementation task would establish a bounded adapter that accepts
the actual checked objects at the handoff. Do not reconstruct them from printed
values or duplicate the source declaration. Preserve original identities for
retained values and explicit derivation for changed values. If the old view
cannot consume this faithfully, report the specific repair boundary rather than
introducing a parallel generic animation engine.

The collection source currently rejects whole-zero rows, fractions and some
larger coefficients. Start with the original integer example, whose selected
operation stays in its numeric envelope. Redundant/contradictory endpoint
expansion would require a separate explicit extension; current workbench support
does not imply collection support.

## Alternatives

| Candidate | Authoring/reuse value | Main risk | Recommendation |
| --- | --- | --- | --- |
| Compose the accepted collection and row-operation mechanisms | Tests an actual chain and retained referents | Handoff ownership and reversible geometry | Next bounded proposal |
| Expand to 3×3 elimination | Tests layout generality | More motion before proving composition | Defer |
| Add another algebra-domain example | Tests breadth through existing owners | Leaves this demonstrated composition gap open | Next breadth checkpoint |
| Polish the linked panel | Little demonstrated benefit after feedback | More time on an unwanted presentation | Do not pursue |

## Proposed finish line and limits

One existing-host reversible exemplar, one source declaration, no extra clock,
checked endpoints and exact cancel/reverse behavior. First inspect the handoff
for continuity, then review the complete explanation. Commit evidence with the
candidate; measure all real delivery consumers. Do not claim general composition
from this one pair or build a universal scene API. Preserve the accepted standalone
views, native equality, source contracts and free-operation workbench.

The linked-equation run ended here. The subsequent “go” authorizes a separate
bounded composition run. The older recommendation to build a linked view is fulfilled.
Reader evaluation remains deferred; source-only reuse and a good explanation
are separate claims, neither of which proves learner outcomes.

## Approved execution boundary

Canonical artifact: one chain derived from `linearSystemModel` and an exact
checked add-row-2-to-row-1 operation. Host: existing rectangular-product route,
opt-in `view=row-composition`. Renderers: existing collection and compact row
operation views. Source authority: the actual immutable coefficient/unknown/RHS
objects and existing exact operation checker, not matching IDs or printed values.

Two packages: checked object-preserving projections and sequence sampling; then
same-host reversible composition with one shared clock and explicit paint
ownership at identical native endpoints. Keep the collection matrix positions
through the arithmetic stage using a local renderer layout adapter. Preserve all
standalone defaults. Rollback units are the local projection/sequence model,
then the composed view/host integration and optional renderer-layout input.

Verify semantic identity and located unsupported presentation gaps, exact native
handoff bounds and exclusive visible ownership, direct seeks/reversal, reduced
motion, disposal, and existing collection/workbench regressions. Use scoped npm
unit/browser commands, full types at integration, production closure measurement
and Theseus validation. Stop for one human handoff/composition checkpoint; no
general composer, wider shapes or unrelated motif promotion. Commit checked
units and back up before the review stop. No minimum duration; reserve time for
evidence and closeout once the candidate is reviewable.

## Implemented candidate and repairs

Host: `/experiments/rectangular-product/?view=row-composition`. Use Play or Next
through equations, matrix, changed matrix and expanded equations. Scrub backward
through either handoff; the coefficient grid and retained second row should stay
identifiable. Final constraints are `6 = 2x + z` and `-1 = y - 2z`.

The bounded model derives both collection projections from the same checked
objects. No fixture data is duplicated. Source-only generic composition is not
claimed: this adds a local sequence model/view, host mode and renderer layout
input. The accepted arithmetic fusion and collection samplers remain the owners.

An initial typecheck exposed an accidental inferred RHS identifier pattern in
CollectionModel; the explicit output union now accepts the actual derived ID.
Initial browser captures exposed a copy crossing the receiving glyphs and a
missing retained RHS raster. The local outward lane now has lateral clearance;
one compositing surface per view and binary paint ownership replace ancestor
visibility/per-glyph compositing in this composition. Native handoff tests check
both bounds and screenshot pixels, and a full-frame ink check guards the retained
RHS without relying on a token recapture. Three repeated composition runs pass.
The first browser probe also needed to set exact range values through the input
event because Playwright rejected long decimal strings in `fill`; this was test
input precision, not a relaxation of sampler or continuity checks.

Focused semantic checks: 16 row tests and 9 collection/pouring tests pass.
Browser preservation: 13 scoped row checks and 10 collection/pouring checks pass.
Full app/node/test/Svelte/domain typechecking and production build pass.
The generic impact selector lacked a focused rule; the declared bounded contract
uses these scoped tests, full types and complete production closures rather than
claiming a repository-wide test-suite run.

Initial delivery measurement exceeded the all-mode JS ceiling. The
[explicit cost amendment](../decisions/2026-10-12-row-composition-cost-boundary.md)
attributes the growth and adds a complete composed-mode activation gate. No
consumer, semantic guarantee or check is removed. Human judgment of the composed
explanation remains pending; automated continuity does not establish usefulness.
