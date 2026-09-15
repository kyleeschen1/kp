# Independent scalar reader: visual checkpoint

Status: HUMAN_CHECKPOINT — implementation and integration verification delivered;
scalar visual acceptance remains open.
Control: `run-contract.kp.reader-scalar-reuse-v1`.
Scope/rationale: `../reviews/2026-09-15-reader-authoring-reuse-boundary.md`.

## Review

Open <http://localhost:8000/experiments/scalar-cancellation/?derivation-detail=expandable#remaining-factor>.
The existing localhost-only shared server owns this route; no second server or
LAN exposure was added. Phone presentation remains provisional.

Read the short explanation first. Drag through the single cancellation, open
**Inspect smaller steps**, inspect 1.1–1.3 forward and backward, then use any
**Back to step 1** affordance. The original held position should return.

Judge whether the full working expression supplies enough context, the
remaining denominator factor is easy to track, and the motion feels consistent
with the accepted physics reading. This example tests reuse of the medium,
not a new motion motif or a complete mathematics lesson.

Physics reference:
<http://localhost:8000/experiments/mechanics-relations/?derivation-detail=expandable#energy-from-momentum>.

## Canonical owners and actual reuse

- Source: `examples/algebra/scalar-cancellation.json` plus the adjacent
  `scalar-cancellation.article.md`; ordinary `kp.article.v1` compilation and
  the existing lesson-document projection are retained.
- Mathematical authority: `domains/algebra/scalar-cancellation.ts`; positive
  real factor and real numerator, distinct single-letter notation. The checker
  supplies the exact bounded cancellation and its finer steps. It is not an
  arbitrary LaTeX solver. Physics authority and its vector norm are unchanged.
- Shared checked role topology: `src/semantic/momentum-energy-derivation-plan.ts`.
  Separate domain issuers feed one governed lowering and native binding.
- Shared renderer: `src/rendering/momentum-energy-derivation-session.ts`, using
  the existing canonical native KaTeX compositor and ink-knot sampler. No new
  renderer, clock, motion curves or paint mechanism was introduced.
- Shared publication, controls and stylesheet remain in
  `src/tutorial/mechanics-relations/`. Legacy energy names are compatibility
  names, not separate scalar implementations. No caller-specific CSS was added.

The first caller-to-second-caller work required **engine intervention**: checked
plan metadata, semantic refinement anchors, optional provenance and shared
lowering. Subsequent coherent symbol/prose edits are **source-only** and tested.
Update both the source symbols and the Article's corresponding math/prose;
reload the shared development route to compile a fresh document. Inconsistent
equations reject publication. A runtime source fingerprint also rejects a
different source presented under the same transition IDs.

Unsupported input example: changing `factorDomain` to `real` yields
`algebra.scalar-cancellation.unsupported-source` at `$.factorDomain`, expecting
`positive-real`. Changing mathematical assumptions needs new authority, not a
renderer fallback. Free editorial claims remain reviewable, not proof-checked.

## Evidence and limits

- 31 focused tests cover authority separation, private issuer types, runtime
  forgery rejection, exact outer endpoints, selector roles, outline numbering,
  source-only edits, mismatched publication rejection and prior output stability.
- Full app/node/test/Svelte/domain type checking passed.
- `npm run visual:mechanics-relations`: 25 Chromium checks passed, including
  both callers, reverse/held progress, local collapse, physics exact return,
  failed-view recovery, source mismatch, no-JS/print and existing provisional
  phone regressions. This is not phone approval or supported-browser promotion.
- The no-JS test simulates a rebuilt shared stylesheet by changing
  `--derivation-reason-measure` in its response for both fresh pages. The actual
  default remains 27rem. Existing immutable editions were not rewritten;
  detached/bundled exports require rebuilding to receive shared style repairs.
- Production build succeeds. The clean `npm test` rerun passes all architecture,
  inference, catalog and promotion-memory gates plus 7,104 tests, with no skips
  or failures. `npm run test:equation-reachability` also passes all 12 checks.
  Tests do not establish learner comprehension.

### Measured production closure

`npm run measure:mechanics-relations-closure -- physics` and the same command
with `scalar` measure the emitted production manifest. Figures are gzip bytes:

| Reading | Initial JS/CSS | All reachable JS/CSS, including activation | HTML |
| --- | ---: | ---: | ---: |
| Physics | 35,833 | 141,744 | 21,679 |
| Scalar | 32,871 | 139,581 | 6,586 |

Raw HTML is 305,938 bytes for physics and 100,632 for scalar, including retained
record and optional inspection templates. These are closure/transfer estimates,
not network traces or device-performance measurements. Fonts, images, HTTP
overhead, parsing, execution and paint costs are excluded. A pre-run retained
`dist` was not a controlled build of the starting commit, so it is not used to
claim a causal before/after delta. The build still reports large unrelated
application chunks; neither reading's closure is the whole application bundle.

Initial failures were repaired rather than waived: a physics revision-ID
regression, issuer/test TypeScript errors, unsupported empty-import shorthand,
an incomplete test-only symbol rename, and a no-JS test that attempted scripted
style injection. The architecture gate also caught a type-only deep import;
it now uses the domain public API. A pre-existing stale Current Queue pointed
to deferred v2 and omitted its tabled matrix frontier; the queue now references
the actual approved run and preserves that frontier without reactivating it.
An inherited direction test also hardcoded the earlier semantic-state lane as
active. It now resolves the roadmap's selected thread and checks the live queue
against that path, while retaining the historical foundation/preservation checks.
This repairs routing drift without locking future product priorities to today's
thread or treating a historical reference as live execution authority.
The first full regression run also exposed stale caller/reachability inventories.
The explicit caller test now includes the existing governed physics/derivation
compilers and their test; the generated graph was refreshed with
`npm run generate:equation-reachability`. Its 68 classified roots and boundary
rules are unchanged. All 12 reachability/caller checks pass; no gate was removed.

## Resume and preservation

Commits: `f5706c47d` (authority/shared binding), `80a9ae8a1` (scalar exemplar).
They are separately reversible boundaries. Do not merge or deploy this branch.
Before new work use `theseus work context next-action.kp.relational-reader --mode brief`.
Theseus, not this review, owns live package status.

After visual acceptance, close this bounded run. The saved six-loop horizon
remains in `../reviews/2026-09-15-next-step-review.md`. The broader earlier-result
recall-to-use animation remains unimplemented; a local reference alone does not
satisfy it. Code, richer mechanics and graph linkage remain subsequent scoped
proposals, not implied authority from unused time in this run.
