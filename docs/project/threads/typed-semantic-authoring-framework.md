# Typed Semantic Authoring Framework Thread

Status: bounded domain pressure complete; API promotion checkpoint
Last Updated: 2026-09-02
Current Next Action: review the bounded supply-demand pressure findings in
`../reviews/2026-09-02-typed-semantic-authoring-ergonomics-closeout.md` and
decide whether a second non-economics unit-scalar caller should test one local
builder. Do not promote an economics ontology, unit algebra, or renderer path
from this single caller.

## Goal

Make rich mathematical and domain objects pleasant to hand-author in
TypeScript while retaining stable semantic identity, correct derived values,
typed composition, renderer-independent selection, runtime reparameterization,
and bounded LaTeX interchange.

The authoring experience should provide IDE inference and autocomplete without
forcing content authors to manually annotate every correspondence, selector,
KaTeX fragment, or derivative entry. Generated structure remains inspectable,
and unsupported work remains an explicit typed repair gap.

## Accepted Capability Goals

1. A typed semantic term layer for scalars, quantities, expressions,
   relations, functions, vectors, matrices, and domain-owned objects.
2. Inferred function input/output signatures and shape-safe composition for
   statically known authoring values.
3. Hygienic semantic macros with compact and expanded forms, beginning with
   gradients, Jacobians, and Hessians.
4. Deterministic code generation for repetitive construct plumbing, generated
   optics, schemas, parser/printer glue, catalogue metadata, and conformance
   fixtures.
5. Typed lens, optional, prism, and traversal composition over semantic
   children and collections, including author-friendly selectors such as
   `equation.rhs` and `matrix.cols.slice(1, 5)`.
6. Immutable selection transformations that generate stable target references,
   semantic lineage, correspondence, and diagnostics.
7. A bounded LaTeX parser and elaborator that produces the same typed objects
   as library authoring and preserves source spans for editor tooling.
8. Direct object and selection recovery from deterministic semantic scene
   state at any step.
9. Domain and mathematical capability packs that are imported on demand and
   preserve domain-owned semantics and renderer ownership.

## Scope Boundary

KP owns a small extensible symbolic kernel, not a complete CAS. It needs enough
symbolic structure to type expressions, resolve binders, substitute values,
differentiate supported forms, apply registered rewrites, validate matrix and
function composition, and explain how a supported result was derived. It does
not need arbitrary equation solving, universal simplification, broad symbolic
integration, theorem proving, or comprehensive special-function support.

An external CAS may later sit behind an optional capability adapter. Its output
must be checked and lowered into registered KP operations before it can supply
semantic or animation authority. Otherwise the result remains an opaque
annotation or a typed capability gap.

## Existing Seams To Extend

- `src/math/latex-parser.ts` and `src/math/latex-tokenizer.ts`: retain the
  bounded-parser policy while adding concrete spans and elaboration.
- `src/math/expression.ts`: reuse bounded evaluation and differentiation
  behavior without treating the current untyped union as the final semantic
  model.
- `src/semantic/structured-expression.ts` and
  `src/semantic/expression-node-protocol.ts`: preserve immutable subtree IDs
  and exhaustive structural projection while adding typed constructs.
- `src/semantic/semantic-entity-provenance.ts` and
  `src/semantic/correspondence.ts`: preserve parsed and inferred provenance,
  identity, lineage, and transformation correspondence.
- `src/semantic/semantic-scene-protocol.ts`: recover resolved selections from
  semantic scenes rather than renderer state.
- `src/authoring/canonical-animation-public-api.ts`: compile accepted semantic
  material through the existing governed authoring entrance.

`src/domain-ir/equation-grammar-v2.ts` remains an animation-transition grammar;
it is not repurposed as the mathematical syntax parser.

## First Proof Boundary

The first future slice should prove the complete chain with one affine vector
function and its `2 x 2` Jacobian:

```text
typed function
-> inferred signature and Jacobian shape
-> compact and expanded semantic forms
-> generated row, column, and entry optics
-> immutable selected rewrite with correspondence
-> native KaTeX projection
-> bounded LaTeX parse to equivalent semantics
-> deterministic step-state recovery
```

A scalar quadratic Hessian is the required structurally different pressure
caller. Stop after those two proofs and decide which declarations and generated
artifacts are genuinely shared before expanding the catalogue.

## Proof Outcome

The approved proof is complete in three checkpoint commits:

- `d41524c1c` adds statically shaped scalar, vector, matrix, and function
  values; shape-safe composition; inferred signatures; Jacobian and Hessian
  macros; semantic correspondence; numeric evaluation; and KaTeX projection.
- `e6127e926` adds typed equation lenses, matrix lenses and traversals,
  serializable semantic paths, immutable selected rewrites, stable target
  references, and generated correspondence.
- `f8924b491` adds bounded scalar/function LaTeX elaboration with explicit
  symbol environments, source spans, existential runtime dimensions, and
  typed repair gaps, plus stable handles for direct object and selection
  recovery from any immutable scene-step snapshot.

The affine vector function elaborates from LaTeX and produces the same numeric
`2 x 2` Jacobian as the hand-authored function. A hand-authored quadratic
scalar function produces a symmetric typed Hessian. Invalid static matrix and
function composition are compile-time errors; unknown parsed symbols, invalid
signatures, and ragged matrices return repair-required results.

This proves the convergence seam without a general CAS, code generator,
domain facade, renderer integration, Article grammar change, or catalogue
rollout. Runtime-parsed dimensions remain honestly existential until a build
step emits a statically typed module.

Focused tests, repository-wide typechecks, and the production bundle pass.
The dirty-worktree `npm test` gate currently stops on the preserved untracked
Focus Deck caller's separate private-clock inventory gap; the proof neither
created nor modified that file.

## Promotion Decision

The user approved narrow promotion on 2026-09-02. The promoted boundary is the
proven typed value and function contracts, static composition guarantees,
Jacobian and Hessian macros, semantic optics and immutable rewrite results,
bounded-LaTeX result and diagnostic contracts, renderer-neutral projection,
and stable scene recovery handles.

Promotion means curating import-tiered public entrypoints and proving them from
a consumer fixture. It does not freeze internal file layout or authorize a
root namespace object, code generator, economics hierarchy, Article grammar,
renderer integration, general CAS, or catalogue rollout. See
`../reviews/2026-09-02-typed-semantic-authoring-next-step-review.md`.

## Public Facade Outcome

The promotion slice completed in three checkpoint commits:

- `e16697782` adds explicit core, calculus, optics, bounded-LaTeX, and scene
  entrypoints with exact runtime export inventories and declaration-only
  facade checks.
- `c23fcde35` adds the consumer fixture. It authors the affine Jacobian,
  quadratic Hessian, matrix selection rewrite, parsed-function narrowing, and
  scene recovery through only the promoted entrances, while retaining static
  failures for incompatible matrices and function signatures.
- `f936334e3` adds an in-memory production-bundle closure guard. Every pack is
  framework-neutral; the core excludes optional LaTeX, optics, and scene
  modules and tree-shakes the shared Hessian and Jacobian implementations.

The consumer proof justified exposing the existing expression constructors in
the core facade; without them authors could not construct typed expression
outputs through public imports. It did not demonstrate a repeated burden that
justifies aliases, a namespace object, or code generation. Runtime-elaborated
function shapes correctly require an explicit vector guard before Jacobian
construction.

Focused facade checks, repository-wide typechecks, dependency gates, and the
production bundle pass. The frozen repository-wide inference ceiling remains
red from pre-existing growth: this fixture adds 3,962 types and 6,258
instantiations over its library baseline, while the full repository measures
94,851 and 154,909 against stale 55,000 and 75,000 ceilings. The dirty-worktree
`npm test` preflight also stops on the separate untracked Focus Deck private
clock inventory gap. Neither ceiling nor unrelated caller was changed here.

## Current Ergonomics And Algebra Recommendation

The API review exposed a more useful next pressure than immediately building
the full economics pack. Keep matrices as compatible finite-dimensional
authoring values, but model a derivative internally as a semantic linear map
whose matrix depends on declared source and target bases. Higher derivatives
use the minimum multilinear structure required by the caller. A gradient
requires inner-product or duality authority and must not be inferred from
differentiability alone.

The public priority remains authoring convenience: deterministic semantic-path
IDs, canonical local defaults, inferred signatures, compact/operator/expanded
LaTeX templates, and descriptor-derived optics, correspondence, serialization,
and autocomplete documentation. Ordinary authors should not pass algebra,
basis, equality, or law dictionaries. Advanced callers may supply explicit
immutable dictionaries without global registration or import-order authority.

Algebraic laws belong to a carrier together with its operations and equality.
Evidence is recorded as `proved`, `tested`, or `assumed`, with an authority,
suite, or assumption ID; booleans such as `isMonoid` or `symmetric: true` are
not themselves proof. JavaScript numeric operations must not be advertised as
strict exact laws when their equality does not support that claim.

One bounded Jacobian/Hessian descriptor should drive only mechanical plumbing.
Mathematical rules, capability requirements, and repair behavior remain
hand-written. Missing basis or inner-product authority produces typed gaps,
not guessed matrices or gradients.

The proposed proof measures the current consumer fixture and requires at least
a 50 percent reduction in applicable manual IDs, low-level constructors, and
positive semantic setup while preserving inference and diagnostics. It then
pressures the abstraction with the same affine map in two bases and one
unit-tagged quantity-to-price derivative. The loop stops for API review before
public algebraic promotion, a full supply-demand pack, a broad generator,
Article integration, animation reparameterization, or CAS work.

## Ergonomics And Algebra Outcome

The approved 28-slice run is complete and stopped at its required human
checkpoint. The implementation now separates coordinate-free linear and
bounded bilinear derivatives from basis-dependent matrix representations,
keeps equality and law evidence explicit, and requires duality before a
covector is called a gradient. The existing matrix-first contracts remain
source- and runtime-compatible adapters.

Ordinary function authoring now receives deterministic semantic-path IDs,
inferred parameter environments and output shapes, authored provenance, and
default Jacobian/Hessian descriptors. The measured affine-Jacobian plus
quadratic-Hessian fixture fell from 10 manual identity literals, 11 low-level
constructor calls, and 49 authored setup lines to 0, 0, and 16 respectively.
Its inferred public closure is also cheaper than the compatibility fixture.

Mechanical Jacobian and Hessian child, optic, correspondence, serialization,
autocomplete, and conformance plumbing is generated deterministically from
two bounded descriptors. Mathematical rules, evidence, capability
requirements, and repair behavior remain authored. LaTeX elaboration exposes
typed gaps for space, basis, unit, and static-shape authority it cannot know.

Optional algebra and unit packs are imported explicitly, accept custom spaces,
bases, units, and evidence without registration, and do not enter the core
bundle. A two-basis affine proof and a unit-tagged quantity-to-price derivative
confirm that the shared seam is not a basis-specific matrix library or an
economics ontology.

The implementation and review recommendation are recorded in
`../reviews/2026-09-02-typed-semantic-authoring-ergonomics-closeout.md`.
No economics hierarchy, Article integration, renderer work, runtime animation
reparameterization, general CAS, public HKT/typeclass hierarchy, or broad
generator catalogue was authorized or implemented.

## Bounded Domain Pressure Outcome

The user accepted the checkpoint recommendation, and commit `189e14a9a`
implements one experimental, renderer-free linear supply-demand caller. A
single author declaration produces typed demand and supply curves, semantic
quantity and price spaces, coordinate-free `dP/dQ` maps, stable identities,
and immutable baseline, seller-tax, and price-floor snapshots. The snapshots
derive equilibrium quantity, buyer and seller prices, shortage or surplus,
consumer and producer surplus, government revenue, deadweight loss, and total
surplus. A binding floor must state its efficient-lowest-cost rationing
assumption; the implementation does not silently choose one.

The pressure supports the existing direction:

- the standard authoring context and unit descriptors keep the ordinary market
  declaration concise while preserving exact unit-ID inference;
- policy changes are immutable inputs whose full derived snapshots can be
  recovered directly without replaying animation;
- the domain formulas remain small, explicit, and independently testable, so
  no CAS or generic economics solver is justified; and
- no renderer, Graph2D, Article, animation, registry, or public facade import
  enters the experiment.

It also exposes two bounded friction points. A domain implementer still repeats
unit-tagged scalar-space construction, differentiable-map and linear-map
wrapping, law evidence, and runtime unit guards. The welfare unit must be
declared rather than derived from price and quantity. Do not solve either by
adding a universal unit algebra or public typeclass hierarchy. If a
structurally different domain caller repeats the first cluster, test one local
unit-aware scalar-map builder. Treat derived unit products as a separate,
explicitly scoped decision.

The current public names and pack split need no revision from this evidence.
The experiment reaches the internal differentiable-map constructor, but that
alone does not justify widening the authoring facade. A second caller must
demonstrate the same burden before promotion.

## Stop Conditions

- A feature requires a universal mutable registry or import-order authority.
- A parser silently guesses an unknown symbol, binder, shape, unit, or macro.
- A rewrite cannot identify its semantic authority and source-to-target
  correspondence.
- A selector relies on KaTeX or other renderer-node structure as canonical
  identity.
- Code generation begins deciding mathematical rules rather than emitting
  declared plumbing.
- The slice turns into arbitrary simplification, equation solving, integration,
  theorem proving, or special-function coverage.
- Framework work changes or generalizes the preserved Focus Deck checkpoint.

## Decision Reference

See
`../decisions/2026-09-02-typed-semantic-authoring-framework-goals.md`.
