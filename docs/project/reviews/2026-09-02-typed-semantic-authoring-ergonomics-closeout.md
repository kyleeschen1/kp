# Typed Semantic Authoring Ergonomics Closeout

Date: 2026-09-02
Status: HUMAN_CHECKPOINT
Run: `run-contract.kp.typed-semantic-authoring-ergonomics-v2`
Source proposal:
`2026-09-02-typed-semantic-authoring-ergonomics-long-loop-proposal.md`
Active thread: `../threads/typed-semantic-authoring-framework.md`

## Recommendation

Accept the architecture and ergonomic direction for one bounded domain caller,
but review the public names and call shape before declaring the new algebraic
surface stable. The evidence supports map-first derivatives, basis-aware
matrix projections, explicit capability dictionaries, deterministic semantic
authoring contexts, bounded construct descriptors, and import-on-demand packs.
It does not support a public universal typeclass hierarchy, a full economics
ontology, a broad generator, Article syntax, or a CAS.

The smallest useful next step after human approval is a test-owned or
experimental linear supply-demand caller with one tax and one price-floor
scenario. That caller should decide whether any remaining authoring friction
justifies another helper and which domain protocols are genuinely shared.

## Outcome Against The Contract

| Requirement | Outcome |
| --- | --- |
| Existing public compatibility | Preserved by explicit matrix and derivative adapters; characterization, public-inventory, and import-closure tests pass. |
| At least 50% less authoring burden | Manual identity literals `10 -> 0`; low-level constructors `11 -> 0`; positive setup lines `49 -> 16` (67% reduction). |
| Ordinary defaults without ambient authority | Deterministic local context and inferred builders require no basis, law, or algebra dictionary; advanced overrides remain explicit. |
| Map versus matrix distinction | One affine map produces distinct standard and diagonal-basis matrices while both agree with map application. |
| Semantically safe domain pressure | A unit-tagged `dP/dQ` retains `USD/item` meaning; an equal-dimensional invalid composition fails. |
| One bounded declaration source | Jacobian and Hessian descriptors drive only mechanical children, optics, correspondence, serialization, autocomplete, and conformance plumbing. |
| Honest missing capability behavior | Basis, inner-product, space, unit, and static-shape omissions return typed repair gaps rather than manufactured authority. |
| Import-on-demand closure | Core excludes optional algebra implementations, LaTeX, optics, scene, domain, Article, and renderer modules. |
| Bounded TypeScript cost | Five representative fixtures pass at 32,313 types and 34,388 instantiations under local ceilings of 34,000 and 37,000. |
| Stop before broad promotion | This document is the required checkpoint; no post-checkpoint implementation occurred. |

The ergonomic consumer is cheaper than the compatibility consumer in isolated
inference: 3,336 versus 5,187 types above the library baseline, and 5,511
versus 8,648 instantiations above it. The stale repository-wide inference
ceiling was measured but not raised or rebaselined.

## Actual Shared Seams

The run found a compact shared core rather than a general algebra engine:

- nominal semantic spaces distinguish meaning even when dimensions match;
- immutable operations, equality, and `proved`, `tested`, or `assumed` law
  evidence travel together;
- coordinate-free linear maps own application and composition;
- finite bases project maps to provenance-bearing matrix representations;
- differentiable maps return linear derivatives, while bounded scalar second
  derivatives return bilinear maps;
- inner-product duality is a separate capability required to identify a
  gradient;
- semantic authoring contexts derive stable IDs and provenance solely from
  paths and visible local defaults;
- inferred builders construct the same inspectable typed values as the
  low-level API;
- two reviewed construct descriptors supply deterministic mechanical
  Jacobian/Hessian plumbing and LaTeX forms; and
- optional algebra and unit facades extend the system without a registry or
  import-order effects.

These seams are interoperable because they share semantic-space identity,
provenance, explicit evidence, and typed repair gaps—not because every domain
object inherits one base class or enters one universal expression tree.

## Rejected Or Deferred Abstractions

- No public HKT or `VectorSpace`-style universal hierarchy. TypeScript
  capability dictionaries are useful internally and for advanced callers,
  but ordinary authors do not pass them.
- No claim that a derivative is intrinsically a matrix. Matrices remain useful
  first-class values and compatibility outputs after bases are declared.
- No boolean-as-proof API. Compatibility booleans may project named evidence,
  but do not establish it.
- No automatic gradient from differentiability. A derivative remains a
  covector until explicit duality identifies a vector.
- No guessed basis, unit, semantic space, equality, law, or static dimension.
- No global registry, ambient instance lookup, or import-order authority.
- No general tensor tower, arbitrary higher derivatives, manifolds, normed
  spaces, theorem prover, general simplifier, solver, integrator, or CAS.
- No general construct catalogue. Generation is limited to deterministic
  plumbing declared by the Jacobian and Hessian descriptors; mathematical
  truth stays hand-authored.
- No economics object hierarchy, Article/Markdown grammar, renderer binding,
  scene animation, or runtime reparameterization in this run.

## Public API Review

The ordinary authored shape is now roughly:

```ts
const author = createKpMathAuthoringContext({ namespace: "lesson.example" });

const demand = defineKpAuthoredFunction(author, {
  path: ["functions", "demand"],
  name: "P_d",
  parameters: ["quantity"] as const,
  output: ({ quantity }, { scalar }) =>
    scalar(add(constant(100), negate(multiply(constant(2), quantity.expression))))
});

const jacobian = deriveKpAuthoredJacobian({ source: demand });
```

The checkpoint should answer these questions:

1. Are `createKpMathAuthoringContext`, `defineKpAuthoredFunction`,
   `deriveKpAuthoredJacobian`, and `deriveKpAuthoredHessian` understandable in
   autocomplete, or should a bounded naming revision happen before stability?
2. Is `{ path, name, parameters, output }` the right honest function shape?
   `path` owns stable identity while `name` owns notation, so the current
   recommendation is to retain both until a domain caller demonstrates a
   safe default.
3. Should ordinary calls continue omitting the optional construct descriptor,
   as above, while advanced calls can replace it? The recommendation is yes.
4. Is the current pack split legible: core authoring, calculus, optics,
   bounded LaTeX, scene recovery, algebra, and units? The recommendation is to
   preserve named entrypoints and avoid a root namespace object.
5. Are typed repair gaps and the local misspelling diagnostic sufficient for
   a first domain caller? The misspelled `quantit` case now produces one error
   at the author expression and suggests `quantity`.
6. Does the 16-line affine/quadratic fixture contain a repeated burden worth
   exactly one more helper? The current evidence says no; let the economics
   caller supply the next pressure.

Suggested dispositions are:

- **Accept:** keep the current names experimental, begin one bounded economics
  caller, and revisit promotion only after its tax and price-floor pressure.
- **Narrow revision:** name the specific confusing symbol or call field and
  change only that facade boundary before the domain caller.
- **Rollback:** revert the ergonomic facade as a unit while retaining the
  compatibility characterization and architectural findings.

## Verification

- 71 focused typed-math, optics, LaTeX, scene, facade, inference, and pressure
  tests pass.
- `tsconfig.inference.json` compiles with no diagnostics.
- The local typed-math authoring inference budget passes.
- Repository application, node, test, Svelte, and domain typechecks pass.
- Dependency-direction and framework-neutral entrypoint gates pass.
- Inference attribution completes for all 29 fixtures.
- The production bundle builds successfully.
- Theseus validates 1,078 nodes and 26,337 events before final closeout
  records.

The diagnostic `npm test` invocation stops at the preserved, unrelated
untracked Focus Deck private-clock inventory gap:

```text
private-clock: src/experiments/kinetic-figure-log-exponent-focus-card/
kinetic-figure-log-exponent-focus-card.ts: Uninventoried private clock path.
```

That is the previously documented failure shape. This run neither modified
nor waived it, and no new broad failure appeared.
