# Typed Semantic Authoring Framework Goals

Date: 2026-09-02
Status: accepted; narrow public authoring facade approved

## Decision

Accept a typed semantic authoring framework as a long-term KP goal. TypeScript
constructors, hygienic semantic macros, deterministic generated authoring
code, and a bounded LaTeX frontend should converge on the same immutable,
stably identified mathematical and domain objects.

The accepted goals are:

- composable mathematical and domain objects with inferred function
  signatures, shapes, units where declared, and capability requirements;
- compile-time rejection of invalid statically known compositions, including
  incompatible matrix multiplication and function composition, with runtime
  verification and typed diagnostics for dynamically parsed material;
- typed semantic macros for constructs such as gradients, Jacobians, and
  Hessians, including compact and expanded forms, parameter-derived labels,
  hygienic binding, provenance, and source-to-result correspondence;
- deterministic generation of repetitive construct plumbing such as node
  declarations, visitors, serializers, optics, parser/printer registration,
  authoring catalogue entries, and conformance fixtures;
- typed, composable, Specter-like optics over semantic structure, with
  explicit cardinality and immutable transformations that emit stable target
  references, lineage, correspondence, and repair gaps;
- a finite LaTeX subset that parses through concrete syntax and source spans,
  resolves names and binders in an explicit environment, infers types and
  shapes, and elaborates into the same semantic objects as the TypeScript API;
- deterministic recovery of an object or resolved semantic selection at any
  authored scene step, independent of renderer nodes or replay history; and
- domain-owned, importable capability packs rather than a universal mutable
  registry or an always-loaded mathematics bundle.

This direction does not replace the current Focus Deck lane, reopen Article
v1, or authorize a universal semantic model across equations, economics,
graphs, diagrams, code, and 3D. Domain frontends remain responsible for their
own truth and compile through existing shared semantic, runtime, publication,
and renderer-neutral seams.

## Algebra Boundary

KP needs a small symbolic kernel, but it should not become a general-purpose
computer algebra system or theorem prover.

The owned kernel should provide only the machinery needed to construct and
verify supported explanations:

- typed expression, relation, function, vector, matrix, and tensor shapes;
- exact scalar values where a domain requires them;
- binder resolution, substitution, evaluation, and declared assumptions;
- local, registered rewrite and normalization capabilities;
- bounded symbolic differentiation and derivative composition;
- shape-safe linear-algebra composition; and
- explicit capability discovery, proof or authority records, and typed gaps.

General symbolic solving, arbitrary simplification, broad integration,
Groebner-basis methods, unrestricted assumptions, special-function coverage,
and theorem search are non-goals. A future external algebra backend may propose
or verify a result behind a typed adapter, but KP must still translate the
result into supported semantic operations with stable identity and provenance.
An opaque external answer cannot become animation authority.

## Architectural Consequences

- The typed semantic tree is the convergence point. LaTeX, TypeScript,
  generated macros, and domain facades are frontends, not competing sources of
  truth.
- Macro expansion produces semantic transformations and correspondence, not
  string substitution. Compact formal objects may remain unexpanded when an
  expansion capability is unavailable.
- Public optics resolve semantic entities. KaTeX, SVG, Canvas, WebGL, DOM, and
  code adapters project those resolved identities into medium-specific
  fragments; optics never select renderer DOM as canonical structure.
- Code generation owns repetitive closed-world plumbing only. Mathematical
  algorithms, inference rules, capability boundaries, and failure semantics
  remain hand-written and reviewed.
- Static TypeScript guarantees apply when literal dimensions and signatures
  are known during construction. Runtime LaTeX and dynamic data return
  verified existential values or typed diagnostics unless a build step emits
  a statically typed module.
- New algebra capabilities enter through one bounded exemplar and one
  structurally different pressure caller. The framework grows by demonstrated
  need rather than attempting completeness.

## Risks And Controls

- **Universal-AST risk:** keep domain-specific concepts in domain-owned models
  and share mathematical protocols only where callers demonstrate the seam.
- **CAS scope creep:** reject the goal of simplifying or solving arbitrary
  expressions; add capabilities by named operation and evidence.
- **Code-generation opacity:** generated files must be deterministic,
  inspectable, and traceable to small declarations; generation must not hide
  semantic decisions.
- **Selector instability:** paths are typed queries, not entity identity.
  Resolved selections materialize stable entity references before
  transformation or playback.
- **LaTeX ambiguity:** require an explicit symbol, binder, unit, and notation
  environment; unsupported or ambiguous notation returns a typed repair gap.
- **Premature framework breadth:** prove one complete vertical slice before
  generating a calculus or domain catalogue.

## First Future Proof Slice

The active proof begins with one affine
`R^2 -> R^2` function whose typed Jacobian can be constructed, expanded,
rendered through the existing KaTeX path, selected by generated row/column
optics, transformed immutably with correspondence, parsed from the bounded
LaTeX frontend, and recovered at every scene step. Pressure the result with one
scalar quadratic Hessian before promoting the construct or generator boundary.

The user selected this slice on 2026-09-02. The Focus Deck human checkpoint is
preserved while this bounded proof proceeds to promotion review.

## Bounded Proof Result

The first proof completed on 2026-09-02. It demonstrates one shared typed tree
across hand-authored functions, derivative macros, semantic optics, bounded
LaTeX elaboration, KaTeX projection, and immutable scene-step recovery. It also
confirms the intended static/dynamic boundary: literal TypeScript dimensions
participate in compile-time shape checking, while arbitrary parsed LaTeX
returns runtime-verified existential dimensions or a typed repair gap.

The result supports continuing the framework, but it does not yet justify a
generated construct catalogue, economics facade, Article grammar extension,
renderer-wide integration, or broader symbolic algebra. Those remain separate
promotion decisions.

## Promotion Decision

On 2026-09-02 the user approved promoting the proof contracts through a narrow
public authoring facade. The facade will expose a small core plus optional
calculus, optics, bounded-LaTeX, and scene-recovery entrypoints. It will be
validated from a consumer-style TypeScript fixture and must not pull optional
capabilities, renderers, domains, Article code, or runtime hosts into the core
import closure.

The first economics capability pack follows only after this API checkpoint.
Code generation and mixed Markdown/TypeScript integration follow only after a
real domain caller demonstrates repeated plumbing or file-switching friction.
