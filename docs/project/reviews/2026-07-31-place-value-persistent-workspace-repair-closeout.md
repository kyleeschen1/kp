# Place-Value Persistent-Workspace Repair Closeout

Date: 2026-07-31
Status: HUMAN_CHECKPOINT
Canonical exemplar: `278 + 156 = 434`
Catalog status: `partial` (`ready-for-human-review`)

## Outcome

The canonical written-addition animation now uses one persistent documentary
workspace instead of replacing whole equation scenes between operations. The
original addend digits, addition sign, and underline remain the same connected
DOM nodes for the complete timeline. Contributing paint proxies move from
measured native ink, converge at the measured result location, and hand off to
the settled native result. Nonterminal overflow follows a measured arch to its
adjacent destination and remains present after settlement. Consumed source
digits dim monotonically but never disappear.

The runtime retains one reader clock, one renderer session, one written
scaffold, and zero WebGL leases. The superseded result-only settlement renderer
and its hidden DOM ownership path were deleted. Scene preparation now waits for
fonts and connected layout, then prewarms outside scroll callbacks; this avoids
both stale hidden-layout coordinates and cold compositor construction during
interaction.

## Reusable Contract Boundary

Reusable compiler, route, ownership, and renderer code is expressed in terms
of an ordered sequence of exact radix positions: sequence index, exact scale,
adjacency, contributor set, destination, result, and terminal fit or extension.
Names such as ones, tens, and hundreds belong only to fixture-facing labels and
review anchors. They are not reusable control-flow vocabulary.

This distinction matters because a fixed three-column implementation would
make the current exemplar look correct while preventing honest reuse for wider
numbers or fractional positions. The current types and source checks instead
make arbitrary ordered position sequences architecturally admissible without
claiming that every numeric shape has already been certified.

## Proven Scope

- `278 + 156 = 434` follows the approved persistent-workspace storyboard at
  wide and phone widths.
- Generated `999 + 1 = 1000` uses the same compositor and renderer path,
  proving unequal operand width and terminal result extension without a new
  renderer branch.
- Forward playback, rewind, and scrambled direct seeking preserve documentary
  node identity, ownership, geometry, and endpoint state.
- The Animation Library remains the single review host, with lazy loading,
  Review capture, accessible/static output, responsive behavior, and no WebGL
  allocation.

## Deliberately Unproven Scope

- Sparse positions with only one contributor, such as `123 + 4`, still need a
  typed direct-settlement operation. The generator rejects these inputs rather
  than silently inventing motion.
- Decimal points and fractional radix scales have not received semantic,
  typography, adjacency, or cross-browser visual certification.
- More than two addends has not been certified.

These are explicit place-value family proof obligations, not hidden special
cases. They can extend the ordered-position compiler without reintroducing
named columns. The present promotion decision concerns the canonical exemplar,
not a promise that every combination of numbers and decimals is production
ready.

## Release Evidence

- `npm run test:place-value-addition`: 116/116 unit cases.
- Complete current browser matrix: 111/111 cases in one
  Chromium/Firefox/WebKit run.
- `npm run visual:place-value-addition`: 33/33 cases across all three browsers.
- Typecheck, architecture, inference, promotion-memory, production build,
  resource, responsive, accessibility, static/export, Review, and Theseus
  validation gates pass.
- Type-system cost remains bounded at 49,279 types, 61,770 instantiations, and
  2.77 seconds.
- The lazy place-value capability pack is 95.93 kB raw and 25.45 kB gzip.
  Existing main and graph chunk warnings predate and remain outside this
  repair.

## Final Human Gate

Automation certifies this exemplar as `ready-for-human-review`; it does not
grant aesthetic approval. Before promotion, review the canonical animation at
wide and phone widths and verify:

1. every source mark remains visible and stationary while its documentary
   appearance dims;
2. each pair of contributors converges where its evaluated total appears;
3. every nonterminal overflow visibly arches to the adjacent position and
   persists;
4. no flicker, overlap, font change, baseline jump, or endpoint snap occurs;
5. rewind and direct seeking reproduce the same states as forward playback.

Until that approval, rank 2 remains `next`, the catalog remains `partial`, and
rank 3 does not begin.

## Conditional Successor

After human promotion, the stable frontier advances to the bounded economics
equilibrium-shift exemplar. That work should reuse the single-host, typed
readiness, deterministic seeking, persistent ownership, and evidence-derived
promotion boundaries, while testing synchronized graph, parameter, and
narrative views. It must not turn this place-value compiler into a universal
scene graph.

Sparse direct settlement and decimal/radix presentation remain a short
place-value harvest candidate. Their scheduling can be decided after the
canonical promotion without silently changing the recorded frontier order.

## Rollback And Evidence Chain

The independently reversible implementation spans the approved repair commits
from `07ba460c` through `6c3021e1`. The semantic trace and synchronized base-ten
projection stayed outside the presentation rollback boundary. The approved
contract and slice-by-slice evidence remain in Theseus contract
`run-contract.kp.place-value-persistent-workspace-repair-v2`.

## Links

- `docs/project/reviews/2026-07-30-place-value-persistent-workspace-repair-long-loop-proposal.md`
- `docs/project/decisions/2026-07-30-kp-persistent-workspace-composition-sequence.md`
- `docs/project/threads/animation-library-promotion.md`
