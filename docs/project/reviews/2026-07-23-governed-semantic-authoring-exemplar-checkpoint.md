# Governed semantic authoring exemplar checkpoint

Status: `HUMAN_CHECKPOINT`

Run contract: `run-contract.kp.product-roadmap-v5-continuation-v2`  
Slice: `s24`

## Recommendation

Accept this exemplar as evidence that an LLM can select bounded semantic intent
while KP retains deterministic compilation, repair, provenance, mathematics,
and presentation authority. Keep the boundary exemplar-local until another
operation family exercises it; do not yet expose a live prompt endpoint or
promote the request schema as an unrestricted authoring API.

## What was reviewed

Codex produced one provider-shaped request for the verified structured
fraction fan-out fixture `2/3(x+6)`. The request is checked in as a durable,
reproducible response with session-local provider provenance rather than
calling a network model during tests.

The canonical semantic reference is
`src/semantic/fraction-fan-out-fixture.ts`. The governed response and its
accepted compilation are assembled by
`src/authoring/governed-fraction-fan-out-exemplar.ts`.

The response selects:

- the exact verified source and operation-pack revisions;
- the registered distribution operation and its semantic role bindings;
- fan-out correspondence from the common `2/3` subtree to both copies;
- a transmit focus intent;
- the named `one-at-a-time` branch cadence;
- the registered `distributed-sum` normal form; and
- `key-steps` compression while preserving law and lineage.

The deterministic compiler, not the provider, derives:

- exact operation-pack and registry resolution;
- the canonical `persist → fan-out → eliminate → reorder` composition;
- operation laws, witnesses, motif requirements, and ownership;
- `per-descendant` pacing with two semantic units;
- source evidence and provider/compiler provenance; and
- the stable FNV-1a fingerprint.

## Observable acceptance criteria

1. Every provider reference resolves to an identity in the verified fraction
   fixture and its exact revision.
2. The distribution operation resolves through exact `kp.core@1.0.0` and
   `kp.algebra@0.1.0` pins.
3. Role cardinality, fan-out endpoint shape, source-supported normal form, and
   evidence references compile without a fallback.
4. Recompiling the recorded response produces the same immutable plan and
   fingerprint.
5. The provider response contains no raw mathematical text, DOM, HTML, SVG,
   CSS, pixels, geometry, coordinates, timing, keyframes, typography, selector,
   route, or renderer authority.
6. Stale source revisions, unknown operations, invalid roles, unsupported
   normal forms, unsafe fields, and incomplete provenance remain typed repair
   results with no plan.
7. Existing reader routes, measured motion, native KaTeX settlement,
   responsive behavior, accessibility projections, and visual appearance are
   unchanged.

All seven criteria are satisfied by the committed code and verification
evidence.

## Authority audit

| Provider may choose | Compiler or verified source owns |
| --- | --- |
| Verified IDs and exact declared pins | Whether those IDs and pins resolve |
| Registered operation and role bindings | Role contracts and cardinality |
| Semantic correspondence | Allowed relations and endpoint shapes |
| Focus and named cadence intent | Semantic pacing units and all actual timing |
| Registered normal form | Rewrite law, verified topology, and lineage |
| Compression level | Noncompressible law and lineage evidence |
| Pedagogical title | Math truth, geometry, typography, rendering, and routes |

No request field can encode raw LaTeX, unchecked math, coordinates, pixels,
durations, keyframes, CSS, selectors, or renderer choices. Rejection does not
silently substitute a simpler operation or presentation.

## Preservation and visual inspection

This exemplar adds no route and no renderer. The existing fractional-linear
reader remains the preservation boundary. Its dedicated visual check passed.
The eight-capture deterministic reader contact sheet was regenerated and
inspected; no clipping, collision, fraction-rule drift, mobile control
regression, or unexpected visual change was observed.

## Verification evidence

| Gate | Result |
| --- | --- |
| `node --disable-warning=ExperimentalWarning --test tests/governed-fraction-fan-out-exemplar.test.ts` | Passed: verified-source grounding, deterministic compilation, and authority exclusion |
| `npm run typecheck` | Passed |
| `npm test` | Passed: full architecture and deterministic regression suite |
| `npm run build` | Passed: production build and repository typecheck |
| `npm run test:browser:reader-conformance` | Passed: shared reader browser cohort |
| `npm run visual:fractional-linear-equation` | Passed |
| `npm run visual:contact-sheet` | Passed: eight captures, visually inspected |
| `theseus workspace validate` | Passed |

## Preservation boundary and rollback

The preservation boundary includes accepted semantic documents, structured
fraction truth, reader routing and URL state, measured-motion ownership,
accessibility, typography, and renderer behavior. The new authoring schema,
compiler, recorded exemplar, tests, and this checkpoint package are separate
reversible commits from the fraction implementation.

Rejecting the checkpoint can remove the governed-authoring tranche without
touching the approved fraction architecture or existing readers. Revising only
the provider choices is smaller still: the recorded exemplar module is the
independent rollback unit.

## Human decision

Recommended: approve the bounded authority split and proceed to the radical and
exponent breadth exemplar. Approval does **not** authorize a live prompt API,
automatic promotion, free-form mathematical generation, or provider control
over presentation.

If the response vocabulary is too broad or too narrow, request a revision to
this one recorded exemplar before any second family uses the contract.
