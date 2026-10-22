# Connected matrix reading: local exemplar

Status: candidate awaiting human reading review, not a promoted Article schema.
Source: `content/authoring/linear-algebra/recovering-input.ts`.
Host: <http://localhost:8000/experiments/matrix-column-combinations/?argument=1>.
Evidence: [connected argument](../reviews/2026-10-23-connected-matrix-argument.md).

This experiment connects one complete authored argument to existing calculations.
The source owns title, introduction, variable-length sections, text, static
native equations, questions/answers and optional inspection locations. Helpers
are `text`, `math`, `question` and `inspect`, checked with `defineArgument`.
An inspection supplies its identity, label, local notation context and either
an actual `ColumnExample` or an actual `ComparisonSource`. It cannot choose a
renderer by a string or supply new motion geometry/timing. See the existing
[column](matrix-column-authoring-packet.md) and
[comparison](matrix-comparison-packet.md) packets for their distinct limits.

Every inferential bridge belongs in the main reading. Use inspection context to
explain labels newly introduced by the reused view; it is not a place to hide
necessary reasoning. The complete mathematical explanation remains readable
without opening any player, after this JavaScript preview loads. Source math is
authored algebra; numerical entries and inspected operations come from the
matrix objects. Static LaTeX is not permission to animate an unchecked step.

Run `npm run test:matrix-argument` for source/math invariants and
`npm run visual:matrix-argument` for the local reading/return contract.
Unknown blocks and duplicate/invalid identities produce `ArgumentGap` with a
located path. These checks cannot validate the truth or usefulness of arbitrary
prose. The current general argument pins its numerical premise explicitly.

Opening prepares one native player; switching or closing releases it. Returning
restores focus and the reading position. Reopening restores its exact in-session
fractional progress; a reload starts inspections closed. The argument owns its
document location; child playback never rewrites it. The old standalone players
keep their existing URL controls.

This first composition needed host and embedding code. It demonstrates reuse of
existing motion inside a connected reading, not arbitrary source-only authorship,
an in-browser editor, portable publication, or proof that the local block format
should become universal. Human review comes before a differently organized
argument pressures the boundary. The old walk and calculus remain parked.
