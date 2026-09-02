# Typed Semantic Authoring Promotion Next-Step Review

Date: 2026-09-02
Status: implemented; API review pending
Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Promote the completed proof through one narrow, import-tiered authoring facade
before adding an economics model, code generation, or Article integration.
The facade should curate proven contracts without moving implementation or
inventing another semantic/runtime layer.

The first implementation slice should expose:

- a core entrypoint for typed scalar, vector, matrix, function, and equation
  construction plus renderer-neutral projection;
- optional calculus, optics, bounded-LaTeX, and scene-recovery entrypoints so
  ordinary authors do not always import every capability;
- an exact export inventory and architecture guard proving that the facade
  owns no implementation and imports no renderer, domain, Article, or runtime
  host authority; and
- one consumer-style TypeScript fixture that hand-authors the affine Jacobian
  and quadratic Hessian through only the promoted entrances, retaining the
  existing compile-time negative cases.

Do not add ergonomic aliases until that consumer fixture demonstrates a
specific repeated burden. Autocomplete comes first from curated named exports
and inferred constructors, not from one large namespace object.

## Candidate Comparison

Scores run from 1 (low) to 5 (high). Risk scores run from 1 (bounded) to 5
(speculative).

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Import-tiered public authoring facade | 5 | 5 | 5 | 2 | Do next |
| Linear supply-demand capability pack | 5 | 4 | 5 | 3 | First domain caller after facade |
| Declaration-driven code generation | 5 | 3 | 5 | 4 | Wait for domain repetition evidence |
| Markdown/Article typed-math integration | 4 | 3 | 4 | 4 | Wait for real mixed-authoring friction |
| Broader symbolic algebra or CAS adapter | 2 | 2 | 3 | 5 | Defer |
| Four-card Focus Deck human checkpoint | 2 | 5 | 5 | 1 | Preserve as separate human checkpoint |

## Ordered Next Steps

1. **Curate the public boundary.** Add core and optional capability entrypoints
   that re-export only the proven contracts. Keep implementation in the
   existing modules for this slice.
2. **Prove hand authoring.** Compile a consumer fixture using only those
   entrypoints. Preserve literal dimension inference, invalid-composition
   errors, typed LaTeX gaps, and direct step recovery.
3. **Measure import closure.** Confirm that core authoring does not pull in
   LaTeX, calculus, scene, renderer, Article, or domain code merely because
   those optional packs exist.
4. **Stop for API review.** Review names, inference quality, diagnostic shape,
   and whether any convenience helper is justified. This is the rollback unit.
5. **Build one economics pack.** Model linear supply and demand, derived
   equilibrium, and immutable policy/change scenarios. Pressure it with a tax
   and a price floor before promoting shared domain protocols.
6. **Generate only demonstrated plumbing.** Once the economics caller shows
   repeated declarations, generate optics, visitors, schemas, or catalogue
   metadata from a small reviewed declaration. Do not generate mathematical
   rules.
7. **Test mixed prose authoring.** Only then decide whether Markdown imports,
   colocated `.ts` authoring modules, or a build-time typed-LaTeX block offers
   the best article workflow.

## Economics Boundary After The Facade

The first economics capability pack should own supply, demand, equilibrium,
tax or subsidy wedges, price controls, quantity traded, consumer and producer
surplus, government revenue, and deadweight loss. It may use a bounded exact
linear solver owned by the economics pack. It must not ask the shared math
kernel to solve arbitrary systems.

Scenario changes should produce immutable semantic snapshots with stable
handles and explicit source-to-target correspondence. Derived equilibrium and
welfare values should be recomputed from the scenario rather than copied into
animation annotations. Graph2D remains the renderer and geometry projection,
not the semantic source of truth.

## Promotion Boundary

The user's approval promotes the proof contracts to a narrow supported
authoring facade. It does not promote exact internal module layout, a root
namespace object, code generation, an economics ontology, Article grammar,
renderer integration, a universal registry, or broader algebra.

The facade plus consumer fixture is the smallest reversible rollback unit.
The economics pack is a subsequent caller, not part of the facade promotion.

## Continuity

The Focus Deck composition remains preserved at its separate human checkpoint.
The existing delivery queue still mentions supply-tax scroll work, but it does
not override this explicit typed-authoring promotion decision. A successor
Theseus plan revision should reconcile that stale operational action before
implementation begins.

## Implementation Checkpoint

The facade rollback unit is complete in `e16697782`, `c23fcde35`, and
`f936334e3`. The core and four optional packs have explicit named exports and
own no implementation. The consumer fixture confirms the intended static and
dynamic authoring boundaries, including compile-time composition errors and a
required runtime vector guard for parsed functions. The realized bundle guard
keeps every pack framework-neutral and proves the core does not retain the
optional LaTeX, optics, scene, Hessian, or Jacobian implementation paths.

One API change emerged from actual hand authoring: the core facade now exports
the existing expression constructors because typed scalar and function output
construction is otherwise impossible without reaching into an internal
module. No convenience aliases were warranted.

The checkpoint review should now answer only these questions:

1. Are the core and capability-pack names understandable from autocomplete?
2. Is the parsed-function vector guard the right honest dynamic boundary?
3. Are the current diagnostics sufficient before an economics caller exists?
4. Does any repeated burden in the fixture justify exactly one helper?

If the answers are acceptable, proceed to the bounded linear supply-demand
caller described above. Reopening implementation layout, code generation,
Article grammar, or general algebra is outside this checkpoint.
