# Linear Equation Visual Exemplar Review Package

Date: 2026-07-20

Run contract: `run-contract.kp.concept-room.linear-equation-visual-exemplar-v2`

Canonical route: `/concepts/mathematics/linear-equations/solve-with-balance`

Status: automated gates passed; stopped for mandatory human visual review

## Outcome

KP now has one bounded, searchable concept-room exemplar for solving
`2x + 3 = 8`. It coordinates KaTeX algebra with an SVG balance on one exact,
URL-addressable clock and offers three views of the same content:

- Watch plays the causal sequence without introducing a second lesson model.
- Touch exposes direct manipulation, semantic inspection, and exact-state links.
- Review presents all explanation text in ordinary searchable document order.

The final visual capture caught a production-only integration failure that the
standalone motion fixture did not: the shell rendered the measured symbolic
stage in a disconnected container, so its zero geometry triggered the safe
static fallback while the balance continued moving. Interactive renderers now
receive the connected viewport, and the canonical route asserts that the
algebraic subtraction choreography and balance motion are present on the same
clock.

This is still an exemplar candidate, not a promoted house style. Human review
is required before any theme, geometry, choreography, or layout is generalized.

## Mandatory Named States

Run `npm run visual:linear-equation` to regenerate the 34-state disposable
review package. The committed harness records exact URLs and captures these
required coordinated states at desktop and phone widths:

| State | Checkpoint | Time | Required observation |
|---|---:|---:|---|
| Initial | `start` | `0` | `2x + 3 = 8` and the matching balanced quantities are immediately legible. |
| Subtraction transit | `start` | `200` | Algebraic `-3` applications and three geometric removals are visibly coordinated. |
| Subtraction settlement | `subtract-three` | `400` | Both representations settle exactly at `2x = 5`. |
| Division transit | `subtract-three` | `575` | Matched division structures and two exact geometric groups move together. |
| Final | `solved` | `1000` | Both representations settle at the exact solution `x = 5/2`. |

The same command also captures reduced motion, forced colors, semantic hover
and pinning, Review mode, equation-only and balance-only views, and denser
subtraction/division timeline samples. Outputs live under `tmp/codex/`; they
are review artifacts, not committed pixel goldens.

## Human Review Questions

1. Is the causal relation between algebra and geometry understandable without
   reading instructions?
2. Does symbol motion feel inevitable and calm rather than decorative?
3. Is the page more searchable and reviewable than video while still making
   the concept visibly move?
4. Do focus, hover, links, controls, typography, and color feel like one
   product?
5. Is any element recognizably generic generated-interface filler?

## Verification Evidence

| Command | Result | Scope |
|---|---|---|
| `./node_modules/.bin/playwright test linear-equation --project=chromium` | Passed, 46 tests | Canonical route, symbolic and balance motion, modes, accessibility, sharing, responsive behavior, and failure paths. |
| `npm test` | Passed | Full unit suite plus architecture, inference, and generated-catalog gates. |
| `npm run typecheck` | Passed | Application, Node, test, and domain TypeScript projects. |
| `npm run build` | Passed | Production build and lazy concept-room chunks. |
| `npm run smoke:linear-equation` | Passed, 2 tests | Canonical and exact-state URLs plus degraded Review fallbacks. |
| `npm run perf:linear-equation` | Passed, 3 tests | One-stage DOM shape, stable direct seeks, Watch frame budget, and zero WebGL contexts. |
| `npm run visual:linear-equation` | Passed, 34 states | Desktop, phone, reduced-motion, forced-color, mode, focus, and operation timeline review package. |
| `theseus workspace validate` | Passed, 664 nodes and 8,493 events | Durable project-memory integrity after s25 closeout. |

Manual inspection covered the initial, subtraction transit, subtraction
settlement, division transit, final, reduced-motion, forced-color, and Review
captures. It confirms that every required representation is present and
bounded; it does not substitute for the product owner's aesthetic acceptance.

## Preservation And Rollback

- Semantic trace, exact-rational provider, published artifact, route schema,
  and authoring contracts remain unchanged.
- The presentation repair is confined to the concept-room shell's attached
  renderer boundary, the route-local exemplar style, its browser assertion,
  and the stable capture harness.
- The independently reversible rollback unit is the s25 closeout commit. It
  does not require rolling back the earlier semantic or architectural slices.

## Residual Risks And Explicit Deferrals

- Human visual acceptance is pending, especially for the density and calmness
  of algebraic transit frames.
- WebGL is intentionally absent from this exemplar. A future 3D concept must
  use the shared canvas manager and preserve SVG/WebGL theme parity.
- Ask/LLM execution, arbitrary generated equations, learner step entry, and
  correction choreography remain deferred.
- Missing-middle, FTC revisions, economics, programming, and other concepts
  remain outside this contract.
- No global theme rollout, balance-capability promotion, generic concept
  registry, modal slideshow, scroll-jacking, or internal scroll rail was
  introduced.

## Hard Stop

Stop after committing this package. Do not promote or generalize the exemplar,
begin another concept, or make further subjective visual changes without
explicit human visual acceptance and a new bounded contract.
