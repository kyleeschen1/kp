# After the linked-equation experiment

Status: assessment after qualified acceptance; new implementation scope proposed.

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

The linked-equation run ends here; it contains no approved continuation for this
new composition work. The older recommendation to build a linked view is fulfilled.
Reader evaluation remains deferred; source-only reuse and a good explanation
are separate claims, neither of which proves learner outcomes.
