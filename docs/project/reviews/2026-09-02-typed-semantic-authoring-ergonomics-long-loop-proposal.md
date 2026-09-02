# Typed Semantic Authoring Ergonomics Long-Loop Proposal

Date: 2026-09-02
Status: proposed; explicit approval required
Target: `priority-change.kp.typed-semantic-authoring-api-review`
Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Make authoring ergonomics, not an abstract algebra hierarchy, the next public
product of the typed semantic framework. Preserve the promoted matrix API as a
compatible finite-dimensional representation while introducing a small
internal capability layer in which derivatives are linear or multilinear maps
and matrices are basis-dependent projections.

The intended layering is:

```text
ergonomic TypeScript authoring API
-> semantic macros and construct descriptors
-> explicit algebraic capabilities and law evidence
-> matrix, KaTeX, graph, and future domain representations
```

Authors should receive deterministic IDs, standard scalar and Cartesian-space
defaults, inferred function signatures, automatic compact and expanded LaTeX,
generated semantic children and optics, and typed repair gaps without passing
`VectorSpace`, basis, equality, or law dictionaries at ordinary call sites.
Advanced callers may replace any default explicitly. There is no global
registry and no import-order authority.

## Why This Loop Is Current

The narrow public facade and its 195-line consumer fixture now expose the
actual hand-authoring cost. Moving directly to a full supply-demand model would
bake the current coordinate-first derivative representation and repeated ID,
wrapper, and LaTeX plumbing into the first domain pack. A bounded ergonomics
and representation-pressure loop can reduce that burden first while retaining
the already-proven facade, optics, bounded LaTeX, provenance, correspondence,
and scene-recovery contracts.

This is a long-mode change because it crosses the typed math kernel, public
authoring facade, derivative semantics, code-generated construct plumbing,
type-level diagnostics, and production import closure. It is expected to take
many hours and carries high TypeScript-inference and compatibility risk. It
does not contain subjective visual work.

## Candidate Comparison

Scores run from 1 (low) to 5 (high). Risk runs from 1 (bounded) to 5
(speculative).

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Ergonomic facade over algebraic capabilities | 5 | 5 | 5 | 4 | Do next |
| Immediate linear supply-demand pack | 4 | 4 | 4 | 4 | Wait for the ergonomic and basis boundary |
| Extend the matrix-first derivative API | 2 | 3 | 2 | 3 | Preserve only as compatibility |
| Public TypeScript `VectorSpace` hierarchy | 2 | 3 | 4 | 5 | Do not promote without caller evidence |
| General construct-generator catalogue | 4 | 3 | 5 | 5 | Wait for the bounded Jacobian/Hessian descriptor |
| Article/Markdown typed-math integration | 4 | 3 | 4 | 4 | Wait for measured file-switching friction |
| General CAS or theorem prover | 1 | 2 | 3 | 5 | Defer |

## Algebraic And Authoring Decisions To Test

- A derivative at a point is a semantic `LinearMap<A, B, S>`. A Jacobian is
  its representation after finite bases are supplied for the source and
  target spaces.
- A second derivative is a bilinear or equivalent curried-linear map. A
  Hessian is a basis-aware scalar-codomain representation. A gradient requires
  an inner product or duality witness and must not be inferred from
  differentiability alone.
- Matrices remain first-class authoring values and compatible public outputs;
  they are not treated as the coordinate-free essence of every linear map.
- Source and target semantic spaces are nominally distinct even when their
  dimensions match. Matrix multiplication and map composition must reject
  semantically incompatible intermediate spaces, not merely mismatched sizes.
- Algebraic structures are explicit immutable dictionaries rather than class
  inheritance, ambient instances, or mutable registration. The initial
  vocabulary is bounded to equality, additive structure, scalar structure,
  vector space, linear map, finite basis, and only the multilinear or
  inner-product capability demanded by the derivative projections.
- Laws belong to a carrier together with operations and equality. Evidence is
  `proved`, `tested`, or `assumed`, with an authority, suite, or assumption ID;
  booleans such as `isMonoid` or `symmetric: true` are not proof.
- Algorithms request the weakest sufficient capability. Domain objects remain
  concrete semantic objects; only their appropriate value, change, tangent,
  or coordinate carriers acquire algebraic capabilities.
- JavaScript `number` and approximate equality must not be advertised as an
  exact lawful field. The framework records the actual equality and evidence
  used by a check.
- One semantic construct descriptor should drive the bounded Jacobian and
  Hessian constructors, compact/operator/expanded LaTeX templates, semantic
  child inventory, optics, correspondence metadata, serialization metadata,
  autocomplete documentation, parser elaboration hooks, and conformance
  fixtures where those outputs are mechanical.
- Generated code emits declared plumbing only. Mathematical rules,
  differentiation, capability requirements, proof authority, and repair-gap
  behavior remain hand-written and reviewed.
- Missing capabilities remain honest. A derivative may render as `Df(x)`
  without a basis, while a requested Jacobian returns `basis-required`; a
  requested gradient without an inner product returns
  `inner-product-required`.

## Acceptance Contract

The loop is successful only if all of the following are true:

1. The existing public matrix, Jacobian, Hessian, optics, bounded-LaTeX, and
   scene-recovery callers retain source and runtime compatibility unless a
   separately reviewed compatibility adapter is unavoidable.
2. A checked-in ergonomics measurement excludes imports, assertions, negative
   fixtures, and generated output, then reports manual identity literals,
   low-level constructor calls, and authored semantic setup lines. The new
   positive Jacobian/Hessian fixture reduces each applicable burden by at
   least 50 percent without weakening inference or diagnostics.
3. Ordinary authoring requires no explicit capability dictionary, basis, law
   witness, or generated-file import. Advanced authoring can override the
   defaults without a registry.
4. The same affine linear map is represented in two bases. Its matrices
   differ, while applying the abstract map and applying either coordinate
   representation agree under the declared equality.
5. A unit-tagged quantity-to-price pressure caller produces a meaningful
   `dP/dQ` derivative and rejects a same-dimension but semantically invalid
   composition.
6. Jacobian and Hessian LaTeX, child identity, optics, correspondence, and
   serialization metadata originate from one bounded construct declaration or
   an explicitly documented non-mechanical seam.
7. Missing basis, equality, or inner-product authority produces a typed repair
   gap. No default silently manufactures proof or semantics.
8. Core and optional entrypoints remain framework-neutral and tree-shakable;
   the core does not retain optional LaTeX, optics, scene, domain, Article, or
   renderer modules.
9. TypeScript inference growth is attributed to the new fixtures and remains
   within a new local budget. The pre-existing repository-wide frozen ceiling
   is not raised or silently rebaselined.
10. The final result stops at an API checkpoint before a public `VectorSpace`
    hierarchy, full economics pack, broad generator catalogue, or Article
    integration.

## Preservation Boundary

- Preserve stable semantic identity, provenance, immutable correspondence,
  typed selection, source spans, dynamic LaTeX narrowing, and direct scene-step
  recovery.
- Preserve existing expression differentiation and matrix outputs as
  compatibility behavior while the new abstraction is proved beneath them.
- Preserve framework-neutral entrypoints, production bundle closure, and
  import-on-demand capability packs.
- Do not touch Focus Deck, animation timing, renderers, Article grammar,
  economics lessons, or the user's unrelated dirty-worktree changes.
- The rollback unit is one verified slice commit. The complete experimental
  layer can be reverted without reverting the previously promoted facade.

## Allowed Work

- Typed semantic math and authoring modules, narrow generated artifacts, and
  their focused tests and type fixtures
- Explicit immutable algebraic capability dictionaries and nominal semantic
  spaces
- Coordinate-free linear and bounded multilinear derivative contracts
- Finite-basis matrix representations and compatibility adapters
- Deterministic authoring context, semantic-path IDs, defaults, descriptors,
  LaTeX templates, optics, correspondence, and typed capability gaps
- One affine two-basis proof and one unit-tagged quantity/price pressure caller
- Import-closure, inference-attribution, architecture, bundle, and project
  memory evidence required by this boundary

## Disallowed Work

- A general CAS, theorem prover, arbitrary solver, broad simplifier, or broad
  symbolic integration engine
- A public or universal TypeScript typeclass/HKT framework
- A universal domain ontology or a complete supply-demand capability pack
- Article/Markdown grammar changes or automatic cross-file authoring
- Renderer, animation, stage, Focus Deck, Catalogue, or visual choreography
  changes
- Runtime reparameterization of animations beyond preserving the existing
  immutable semantic-object compatibility boundary
- A broad generated construct catalogue, global mutable registry, or
  import-order discovery
- Rebaselining global inference ceilings or fixing unrelated existing test
  failures

## Dependencies

- Promoted facade commits `e16697782`, `c23fcde35`, and `f936334e3`
- Existing typed math, calculus projection, optics, bounded-LaTeX, and scene
  contracts in `src/math/`
- Existing semantic provenance and correspondence authority
- Existing framework-neutral, import-closure, inference-attribution, typecheck,
  and production-bundle checks
- Approved plan revision `plan-revision.kp.v24`, whose stale supply-tax
  continuation must not be selected for this loop

## Verification Cadence

- `focused`: the named unit test, type fixture, generator check, or closure
  assertion for the slice.
- `standard`: focused proof plus `npm run typecheck` and
  `theseus workspace validate`.
- `broad`: standard proof plus affected public-facade, import-closure,
  dependency-direction, framework-neutral-entrypoint, inference-attribution,
  and production-bundle checks.
- Every passing slice is one focused commit containing implementation, tests,
  and completed Theseus slice evidence. No unrelated path is staged.
- Each slice starts from one brief Theseus context receipt. Escalate to working
  context only when the brief packet cannot support the change; retrieve at
  most the directly linked sources needed by that slice.

The dirty worktree has two known inherited red conditions: the global frozen
inference ceiling is stale, and repository-wide `npm test` currently stops on
the unrelated untracked Focus Deck private-clock inventory. The loop must run
focused equivalents plus the broad boundary set, must not worsen either
condition, and must stop on any new or differently shaped failure.

## Proposed Ordered Slices

Every row is an independently reversible commit boundary.

| Slice | Target and intended change | Risk | Verification level and expected checks | Commit boundary | Slice stop condition |
| --- | --- | --- | --- | --- | --- |
| s01 | **Ergonomics baseline.** Add a deterministic measurement for the current public consumer's manual IDs, low-level constructor calls, and positive semantic setup lines; freeze the 195-line fixture as the compatibility baseline. | Medium: a bad metric can reward cosmetic compression. | Focused: metric unit test and current public API fixture compile. | Commit the metric, rubric, and baseline only. | Stop if the measure cannot distinguish authored semantics from imports, assertions, negative cases, and generated output. |
| s02 | **Compatibility characterization.** Add contract tests for current matrix/Jacobian/Hessian shapes, IDs, LaTeX, optics, correspondence, and scene handles before introducing new internals. | Low: broad snapshots can overfreeze internals. | Standard: focused characterization tests, public fixture compile, `npm run typecheck`, Theseus validation. | Commit tests and only the narrow public invariants they name. | Stop if the tests require freezing private layout or incidental formatting. |
| s03 | **Nominal semantic spaces.** Introduce hidden-brand space descriptors that distinguish source and target meaning independently of equal dimensions. | High: structural typing can leak or destroy inference. | Focused: runtime descriptor tests and positive/negative type fixture. | Commit space contracts and tests. | Stop if callers must write brands manually or public declarations expose an unconstructible nominal type. |
| s04 | **Equality and law evidence.** Add explicit equality plus `proved`, `tested`, and `assumed` evidence records with authority IDs and no boolean proof shortcuts. | High: false law claims would become semantic authority. | Standard: evidence validation tests, rejection cases, typecheck, Theseus validation. | Commit evidence contracts and validators. | Stop if approximate equality is presented as an exact equivalence or evidence becomes an unaudited boolean. |
| s05 | **Bounded algebra dictionaries.** Add only the additive, scalar, and vector-space capabilities required by the proof, using immutable dictionaries and weakest-capability signatures. | High: this can grow into a typeclass framework. | Focused: operation and law-harness tests over exact symbolic/rational fixtures. | Commit the minimal dictionaries and fixtures. | Stop if implementation requires HKTs, inheritance, global instances, or capabilities unused by an approved caller. |
| s06 | **Linear-map kernel.** Add `apply`, identity, and composition for `LinearMap<A,B,S>` with explicit source and target space descriptors. | High: composition typing is core authority. | Standard: identity/composition law tests, negative type fixture, typecheck, Theseus validation. | Commit linear-map kernel and tests. | Stop if composition can join merely equal dimensions with incompatible semantic spaces. |
| s07 | **Product-space defaults.** Add canonical scalar and finite Cartesian product-space constructors that an authoring context can infer without ambient registration. | Medium: convenient defaults can become universal semantics. | Focused: deterministic construction, override, and no-registry tests. | Commit constructors and tests. | Stop if defaults depend on import order or prevent explicit replacement. |
| s08 | **Finite basis contract.** Add ordered basis descriptors, coordinate conversion, basis identity, and source/target association. | High: a basis can be mistaken for the space itself. | Standard: round-trip and invalid-basis tests, typecheck, Theseus validation. | Commit basis contracts and focused fixtures. | Stop if basis membership or ordering cannot be validated without silent assumptions. |
| s09 | **Basis-aware matrix representation.** Represent a linear map as a matrix carrying both domain and codomain bases and the originating map identity. | High: representation errors can look numerically plausible. | Focused: coordinate/application agreement and mismatch rejection. | Commit representation code and tests. | Stop if the representation loses source-map provenance or permits mismatched bases. |
| s10 | **Matrix compatibility adapter.** Adapt the current typed-matrix multiplication and derivative-matrix outputs to the new representation seam without changing promoted signatures. | High: public source or runtime compatibility may regress. | Broad: existing typed math tests, public fixture, facade inventory, import closure, typecheck. | Commit the adapter as one rollback unit. | Stop on an unavoidable public break; return for a compatibility decision. |
| s11 | **Abstract differentiable map.** Define `derivativeAt` as returning a linear map and keep evaluation separate from coordinate representation. | High: calculus contracts may overfit the current expression AST. | Standard: differentiable-map laws/fixtures, typecheck, Theseus validation. | Commit interface, typed gaps, and tests. | Stop if all domain functions must be converted into one universal expression tree. |
| s12 | **Expression-function adapter.** Make the existing affine typed function supply the abstract derivative through a bounded adapter over the current differentiator. | Medium: duplicate derivative authority could emerge. | Focused: affine values and derivative application match existing Jacobian entries. | Commit adapter and equivalence tests. | Stop if the adapter forks differentiation rules or changes existing expression semantics. |
| s13 | **Second-derivative map.** Add the minimal bilinear or curried-linear representation needed for scalar second derivatives. | High: higher-order generic machinery can explode inference. | Standard: scalar quadratic second-derivative tests, negative capability gaps, typecheck. | Commit only the bounded second-derivative contract. | Stop if the slice expands into arbitrary tensors, higher categories, or unused higher derivatives. |
| s14 | **Jacobian projection.** Derive a Jacobian only when finite source and target bases are available, while retaining compact `Df(x)` without them. | High: fallback could silently invent coordinates. | Focused: basis-present projection and `basis-required` gap tests. | Commit projection and compatibility tests. | Stop if absent bases produce a default matrix without declared authority. |
| s15 | **Hessian and symmetry evidence.** Project the scalar second derivative into a Hessian with explicit basis and replace raw symmetry truth with law evidence while preserving the compatibility field through an adapter if needed. | High: current `symmetric: true` overclaims proof. | Broad: quadratic Hessian values, evidence validation, public compatibility, typecheck, import closure. | Commit Hessian representation and compatibility boundary. | Stop if symmetry cannot be tied to a named derivation/test authority or the public adapter lies about evidence. |
| s16 | **Gradient capability gap.** Define the inner-product/duality requirement and return `inner-product-required` rather than equating a derivative covector with a gradient vector. | Medium: premature geometry can broaden the kernel. | Focused: missing-capability and one supplied Euclidean-inner-product fixture. | Commit requirement and gap only, not a general geometry library. | Stop if implementation requires normed spaces, manifolds, or unrelated geometry. |
| s17 | **Deterministic authoring context.** Add a local immutable context that derives semantic IDs from paths and carries explicit defaults and overrides. | High: ID changes can break recovery and correspondence. | Standard: determinism, collision, override, provenance, and no-global-state tests; typecheck. | Commit context and tests. | Stop if IDs depend on call order, renderer structure, mutable counters, or process-global state. |
| s18 | **Ergonomic scalar/function builders.** Add inferred parameter, scalar, vector, and function helpers over the context so normal callers omit repeated IDs and wrapper objects. | Medium: a DSL can obscure the semantic tree. | Focused: autocomplete/type fixture, inspectable output, free-variable diagnostics. | Commit helpers and tests. | Stop if helpers weaken literal inference, hide provenance, or require operator overloading/transpiler magic. |
| s19 | **Semantic construct descriptor.** Declare the bounded Jacobian/Hessian macro metadata, capability requirements, children, projection forms, and generation inputs once. | High: a descriptor can become a universal AST. | Standard: descriptor validation, duplicate/missing field failures, typecheck, Theseus validation. | Commit one bounded descriptor schema and two declarations. | Stop if it begins deciding differentiation rules, animation timing, renderer nodes, or arbitrary domain semantics. |
| s20 | **Automatic LaTeX templates.** Generate compact, operator, and expanded semantic LaTeX projections from the descriptors and actual parameter/basis metadata. | Medium: string templates can lose semantic identity. | Focused: Jacobian/Hessian snapshots, escaping, custom notation, and capability-gap tests. | Commit template projection and tests. | Stop if projection becomes the source of semantic truth or unknown notation is guessed. |
| s21 | **Generated semantic plumbing.** Deterministically emit or derive child inventory, optics registration, correspondence metadata, serialization metadata, autocomplete docs, and conformance fixtures from the same declarations where mechanical. | High: generated files can hide decisions or destabilize diffs. | Broad: generator idempotence, checked-in-output diff, optics/correspondence tests, public facade and closure checks. | Commit generator/declaration/output as one reversible unit. | Stop if mathematical rules enter generation or generated output is non-deterministic/untraceable. |
| s22 | **Honest elaboration gaps.** Connect bounded LaTeX elaboration and dynamic shapes to the new capability requirements without claiming static bases or semantic spaces it did not parse. | High: runtime material may acquire guessed type authority. | Standard: parsed affine success, unknown space/basis/unit gaps, source-span preservation, typecheck. | Commit elaboration adapter and diagnostics. | Stop on any guessed symbol, space, basis, unit, or static dimension. |
| s23 | **Ergonomic public consumer.** Add a consumer-only fixture that authors the affine Jacobian and quadratic Hessian through defaults and descriptors while retaining the original fixture and negative composition cases. | High: concise syntax may conceal weaker guarantees. | Broad: fixture compile, runtime equivalence, facade inventory, framework-neutral and import-closure checks, ergonomics metric at least 50 percent lower. | Commit the new fixture and any narrowly justified public exports. | Stop if any burden metric misses 50 percent or diagnostics/inference regress. |
| s24 | **Two-basis affine pressure.** Represent one affine derivative in two bases and prove matrix difference plus map-level behavioral agreement and reversible coordinate conversion. | High: this is the decisive matrix-versus-map proof. | Standard: exact two-basis unit/property fixtures, typecheck, Theseus validation. | Commit pressure caller and tests. | Stop if agreement needs ad hoc offsets, untracked coercion, or basis-free matrix claims. |
| s25 | **Unit-tagged economics pressure.** Add a test-owned or narrowly experimental quantity-to-price map and `dP/dQ` projection, with invalid same-dimension compositions rejected. | High: pressure code could become an accidental domain ontology. | Standard: unit/space type fixture, derivative label/value tests, typecheck. | Commit the bounded pressure caller only. | Stop if the slice expands into equilibrium, welfare, policy scenarios, Graph2D, or a shared economics hierarchy. |
| s26 | **Extension-pack closure.** Prove default packs are imported on demand, custom bases and unit spaces can extend the system without registration, and core closure excludes optional capabilities. | High: an ergonomic barrel can defeat tree shaking. | Broad: exact export inventory, custom-extension consumer, bundle closure, dependency-direction, framework-neutral entrypoints. | Commit closure guards and any minimal facade correction. | Stop if core retains optional calculus, LaTeX, optics, scene, domain, Article, or renderer code. |
| s27 | **Inference and diagnostics boundary.** Attribute compiler growth, add a local fixture budget, review error locality/autocomplete names, and remove only demonstrated incidental complexity. | High: recursive generics can make the API unusable. | Broad: inference attribution, local ceiling, public type fixtures, typecheck, production bundle. | Commit budgets, diagnostics, and bounded refinements. | Stop if local inference cannot be bounded without weakening types or raising the frozen global ceiling. |
| s28 | **Closeout and API checkpoint.** Run the complete boundary suite, document actual shared seams and rejected abstractions, update Theseus/project memory, and stop for human API review before economics or broader promotion. | High: passing tests cannot decide public taste or long-term abstraction value. | Broad plus manual API review packet: focused suite, public fixture, typecheck, architecture gates, import closure, inference attribution, bundle, `npm test` diagnostic, Theseus validation. | Commit closeout evidence and documentation; no post-checkpoint implementation. | Stop on any new broad failure, unresolved compatibility break, or the mandatory human checkpoint. |

## Contract-Level Stop Conditions

Stop the run immediately if:

- a public compatibility break cannot be contained in an explicit adapter;
- TypeScript requires a public HKT/typeclass framework or author-written
  brands, law witnesses, or basis dictionaries for the default path;
- a semantic space, basis, unit, equality, law, or proof is guessed;
- a same-dimension but semantically invalid composition typechecks;
- code generation begins deciding mathematical truth;
- generated output is non-deterministic or loses traceability;
- local inference cannot be bounded without weakening guarantees or raising
  the repository-wide frozen ceiling;
- the authoring fixture cannot reduce applicable burden measures by at least
  50 percent;
- any change reaches renderer, animation, Article, Focus Deck, full economics,
  broad CAS, or unrelated dirty-worktree scope; or
- a new broad verification failure appears or an inherited failure changes
  shape.

The final slice always ends at a human API checkpoint.

## Explicit Deferrals

- Full linear supply-demand semantics, equilibrium, taxes/subsidies, controls,
  surplus, government revenue, deadweight loss, and Graph2D projection
- Public promotion of `VectorSpace`, `LinearMap`, basis, or law-evidence types
  before the final checkpoint
- General macro/code-generation catalogues beyond Jacobian and Hessian
- Broad typed LaTeX, arbitrary notation inference, or Article integration
- Animation authoring, runtime reparameterization, motifs, and multi-object
  layout abstractions
- External CAS adapters, arbitrary symbolic solving, and theorem proving
- Repository-wide inference rebaselining or unrelated Focus Deck repairs

## Approval Boundary

This document records the recommendation and exact proposed slice order. It is
not an executable run contract. On explicit approval, create or activate one
Theseus contract containing these 28 slices, then execute s01 through s28 with
one verified commit per slice and the stated stop conditions. Until then, do
not select a refill candidate, resume the stale supply-tax action, or implement
any slice.
