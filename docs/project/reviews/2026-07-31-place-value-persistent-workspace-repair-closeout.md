# Place-Value Persistent-Workspace Repair Closeout

Date: 2026-07-31
Status: promoted
Canonical exemplar: `278 + 156 = 434`
Catalog status: `ported`

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

Human review approved both the two-contributor `8 + 6 → 14` exemplar and
the structurally distinct three-contributor `1 + 7 + 5 → 13` caller. The
same required, count-derived contributor-fusion motif now governs every
canonical ordered-position evaluation; the former comparator path is gone.

## Deliberately Unproven Scope

- Sparse positions with only one contributor, such as `123 + 4`, still need a
  typed direct-settlement operation. The generator rejects these inputs rather
  than silently inventing motion.
- Decimal points and fractional radix scales have not received semantic,
  typography, adjacency, or cross-browser visual certification.
- Arbitrary multi-addend written problems have not been certified; the carried
  three-contributor canonical caller proves motif structure, not a general
  input generator.

These are explicit place-value family proof obligations, not hidden special
cases. They can extend the ordered-position compiler without reintroducing
named columns. The present promotion decision concerns the canonical exemplar,
not a promise that every combination of numbers and decimals is production
ready.

## Release Evidence

- `npm run test:place-value-addition`: 120/120 unit cases.
- `npm run test:browser:place-value-addition:contributor-fusion`: 36/36 dense
  contributor-route cases across Chromium, Firefox, and WebKit at wide and
  phone widths.
- `npm run test:browser:place-value-addition`: 123/123 complete place-value
  browser cases across Chromium, Firefox, and WebKit.
- `npm run visual:place-value-addition`: 33/33 cases across all three browsers.
- Typecheck, production build, promotion-memory, catalog generation, reader
  production closure, dev-review production closure, resource, responsive,
  accessibility, static/export, Review, and Theseus validation gates pass.
- Type-system cost remains bounded at 49,286 types, 61,771 instantiations,
  and 2.91 seconds in an isolated inference check.
- The lazy place-value capability chunk is 103.86 kB raw and 27.79 kB gzip;
  the Animation Library gate reports no place-value or outer-shell violation.
- The repository-wide unit run passed 3,110/3,114 cases. Its four failures are
  existing, independently owned ratchets: the HTML-escaping inventory, native
  compositor source ceiling, linear-provider dependency boundary, and a stale
  operation-promotion evidence path left by the earlier catalog runtime split.
  The two global payload failures likewise concern the pre-existing main-host
  and shared-reader closures, not the lazy place-value pack. Theseus records
  these exceptions explicitly rather than treating them as feature evidence.

## Approval Result

The human approved the canonical animation after reviewing the initial
two-contributor treatment and the structurally distinct three-contributor
caller. The accepted observations were:

1. every source mark remains visible and stationary while its documentary
   appearance dims;
2. each pair of contributors converges where its evaluated total appears;
3. every nonterminal overflow visibly arches to the adjacent position and
   persists;
4. no flicker, overlap, font change, baseline jump, or endpoint snap occurs;
5. rewind and direct seeking reproduce the same states as forward playback.

Release authority is not an authorable boolean: the catalog requires the exact
module-owned nominal approval that combines readiness, full motif coverage,
human decision, and named evidence sources. Rank 2 is therefore promoted and
rank 3 becomes planning-only next work.

## Conditional Successor

The stable frontier now advances to the bounded Supply and demand equilibrium
shift exemplar. That work should reuse the single-host, typed
readiness, deterministic seeking, persistent ownership, and evidence-derived
promotion boundaries, while testing synchronized graph, parameter, and
narrative views. It must not turn this place-value compiler into a universal
scene graph.

Sparse direct settlement and decimal/radix presentation remain a short
place-value harvest candidate. Their scheduling can be decided after the
canonical promotion without silently changing the recorded frontier order.

## Rollback And Evidence Chain

The independently reversible implementation spans the approved repair commits
from `07ba460c` through this closeout's promotion commit. The semantic trace
and synchronized base-ten projection stayed outside the presentation rollback
boundary. The approved contract and slice-by-slice evidence remain in Theseus
contract `run-contract.kp.place-value-persistent-workspace-repair-v2`.

## Links

- `docs/project/reviews/2026-07-30-place-value-persistent-workspace-repair-long-loop-proposal.md`
- `docs/project/decisions/2026-07-30-kp-persistent-workspace-composition-sequence.md`
- `docs/project/threads/animation-library-promotion.md`
