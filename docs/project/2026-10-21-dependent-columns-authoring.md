# Information loss without a zero column

Approved by the user's “go” after the accepted projection trial and the
recommendation to test dependent nonzero columns through the same interface.
Uses the KP delivery workflow. Theseus owns live progress.

Reader: familiar with signed scalar multiplication, vector addition and the
column-combination reading introduced in the accepted projection example.
Question: can a matrix lose information even when neither column is zero?

A = [[1,2],[2,4]], B = [[3,5],[-1,-2]]. The two inputs give (1,2):
3(1,2) − (2,4) and 5(1,2) − 2(2,4). The second column is twice the first,
so the output depends on x + 2y, not on x and y separately. Increasing x by
2 while decreasing y by 1 cancels the change. Define dependence through this
relation before naming it. Do not imply that all inputs share one output or
that reverse playback inverts a non-injective map.

Static baseline: the two weighted sums plus their common factor (x + 2y)(1,2).
Motion's proposed benefit is tracking signed weights into nonzero contributions
before their sum, preserving source identity. Scrubbing inspects the negative
contribution; the existing column selector supports comparison. Transfer question:
(7,−3) maps to (1,2), while (7,−2) maps to (3,6). The complete reasoning stays
in text; the inherited fixed sequence and reload-based comparison are limitations.

Canonical source: content/authoring/linear-algebra/dependent-columns.ts.
Host: /experiments/matrix-column-combinations/?input=dependent-columns.
Renderer: existing local native KaTeX column player, presentation and continuity
owners. Semantic truth: matrixProduct and columnCombinations via M.matrix and
M.product. Preserve the accepted projection example, motion, typography, timing,
source references, direct seek/reverse and existing unsupported-shape gaps.

Packages:
1. Add one typed mathematical/editorial source and register it. Verify the two
   outputs, nonzero signed contributions, cancellation direction and transfer.
2. Verify the unchanged host renders those exact sources/cues and endpoints;
   capture an exemplar and preservation evidence. Record actual authoring cost
   and any friction. No host edits unless a demonstrated correctness bug requires
   repair at its existing owner. A new presentation requirement is a typed gap.
3. Review the changed explanation before any broader promotion. This trial
   tests source-only reuse within one layout, not a universal lesson interface.

Rollback unit: the source and its registry entry. No new dependencies, CSS,
geometry, clocks, catalogue rollout, paid services, deployment or agents.
Checks: matrix unit cohort, full types, matrix production build and scoped
Chromium checks through the stable visual:matrix-interpretations command.
Ceiling: two hours, reserving 20 minutes for evidence and backup. Commit the
verified candidate; stop at review, completion, ceiling or an external blocker.
