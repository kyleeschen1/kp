# Derive And Representation Capability Design

Date: 2026-07-10
Project: kp
Status: approved implementation direction

## Summary

KP needs a first-class `derive` capability for moving between exact semantic
representations without confusing those representations with visual renderings,
computations, templates, or sampled approximations.

The capability answers:

```text
given a semantic object, what other semantic object or representation can KP
derive from it, and what provenance makes that derivation honest?
```

This is the bridge between the semantic object system, computation protocols,
graphs, matrices, LaTeX, dashboards, and future tutorial generation.

## Goals

- Let objects advertise exact derivations separately from visual renderers and
  numeric execution.
- Preserve provenance from source object, source selectors, operation, and
  assumptions to derived object.
- Distinguish exact semantic representations from sampled, approximate, or
  visual-only outputs.
- Support dashboard/API previews that show what an object can become.
- Keep object types small by using capabilities, traits, predicates, and
  constructors instead of new runtime subclasses for every special case.
- Give future animation transforms a reliable source of identity and
  correspondence when a view changes representation.

## Non-Goals

- Do not build a full CAS or theorem prover.
- Do not require every object to support derivation.
- Do not treat every rendered view as a semantic derivation.
- Do not pretend sampled graph data can recover an exact symbolic equation.
- Do not replace existing computation helpers in one step; migrate through a
  compatibility layer.

## Vocabulary

### Representation

A representation is a semantic form of an object or value. Examples:

- `Expression` as LaTeX;
- `Expression` as `Graph2D`;
- classifiable `Equation` as `Graph2D`;
- `Matrix` as `LinearMap` in a selected basis;
- `LinearMap` as `Matrix` in a selected basis;
- `Rotation` or `Scale` as a matrix;
- `Graph2D` as LaTeX only when it has exact symbolic provenance.

A representation is not automatically a renderer node. KaTeX spans, SVG paths,
WebGL meshes, and DOM nodes are visual materializations of a representation or
render plan.

### Derivation

A derivation is a provenance-bearing operation that produces a target semantic
object or semantic representation from a source semantic object.

```ts
interface SemanticDerivationRecord {
  readonly id: string;
  readonly kind: "derive";
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly relation: SemanticDerivationRelation;
  readonly status: SemanticDerivationStatus;
  readonly provenance: SemanticDerivationProvenance;
}
```

### Relation

The relation explains what is preserved.

```ts
type SemanticDerivationRelation =
  | "same-value"
  | "same-function"
  | "same-linear-map"
  | "same-solution-set"
  | "renderable-view"
  | "sampled-approximation"
  | "visual-only";
```

The relation is part of the contract. A sampled graph and an exact graph may
both produce something renderable, but only one can claim exact symbolic
identity.

### Status

```ts
type SemanticDerivationStatus =
  | "exact"
  | "lossy"
  | "sampled"
  | "partial"
  | "unsupported";
```

`unsupported` should be explicit and typed. Missing capability behavior should
produce inspectable diagnostics, not silent empty previews.

## Capability Shape

The object registry should eventually expose derivation metadata without loading
the full implementation:

```ts
interface SemanticDeriveCapabilityDescriptor {
  readonly id: string;
  readonly title: string;
  readonly sourceType: string;
  readonly targetType: string;
  readonly relation: SemanticDerivationRelation;
  readonly status: "active" | "planned" | "proposed";
  readonly summary: string;
  readonly requiredTraits?: readonly string[];
  readonly assumptions?: readonly string[];
}
```

The runtime implementation can then resolve a concrete derivation:

```ts
interface SemanticDeriveCapability<TSource> {
  readonly descriptor: SemanticDeriveCapabilityDescriptor;
  derive(
    source: TSource,
    options?: SemanticDeriveOptions
  ): SemanticDeriveResult;
}
```

```ts
type SemanticDeriveResult =
  | {
      readonly kind: "derived";
      readonly object: KpSemanticObject;
      readonly record: SemanticDerivationRecord;
    }
  | {
      readonly kind: "unsupported";
      readonly diagnostic: SemanticDerivationDiagnostic;
    };
```

## Provenance

Every successful derivation should record:

- source object id and revision;
- source selectors when only part of the object was used;
- target object id and generated selectors;
- derivation relation;
- assumptions, basis, coordinate system, domain, or units when relevant;
- whether the result is exact, sampled, partial, or lossy;
- the capability id and implementation version.

The provenance record should be stable enough for:

- dashboard previews;
- tutorial cards;
- animation correspondence;
- graph-to-equation honesty checks;
- later recomputation when the source object changes.

## Initial Derivation Matrix

| Source | Target | Relation | Status | Notes |
|---|---|---|---|---|
| `Expression` | LaTeX form | same-value | exact | Existing `expressionToLatex` behavior can become a derivation descriptor. |
| `Expression` | `Graph2D` | same-function | exact | Valid for one-variable expressions with explicit domain metadata. |
| `Expression` | `Graph3D` or surface | same-function | exact | Valid for two-variable expressions and explicit domains. |
| `Equation` | `Graph2D` | same-solution-set | exact | Only when classifier can prove an explicit 2D curve. |
| `Graph2D` | LaTeX form | same-function | exact | Only when graph stores symbolic source provenance. |
| sampled `Graph2D` | LaTeX form | sampled-approximation | sampled | May expose sample data or approximate fit, not exact source. |
| `Matrix` | `LinearMap` | same-linear-map | exact | Requires basis metadata, even if the default basis is implied in early UI. |
| `LinearMap` | `Matrix` | same-linear-map | exact | Requires selected basis. |
| `Rotation` | `Matrix` | same-linear-map | exact | Planned object family. |
| `Scale` | `Matrix` | same-linear-map | exact | Planned object family. |

## Dashboard Contract

Dashboard and API previews should show:

- available derivations;
- target type;
- relation;
- exact/lossy/sampled status;
- assumptions;
- sample action when a target view can be opened now;
- diagnostics when a requested derivation is unsupported.

Search should include target types and relations. For example, searching
`matrix linear map`, `graph latex`, or `same solution set` should surface the
relevant objects and capabilities.

## Animation Contract

Derivation is semantic. Animation is presentation.

When a derivation changes the visible form, the animation layer should receive:

- source object/view;
- target object/view;
- derivation record;
- correspondence map when selectors persist;
- artifact lifecycle records when visual-only structure enters or exits.

Examples:

- exponent form to radical form may be a notation transformation with a
  derivation-like relation only when semantic value is preserved;
- matrix to linear-map geometric view preserves the linear map, not the matrix
  grid artifacts;
- graph-to-LaTeX exact reveal is allowed only when symbolic provenance exists.

## Migration From Current Code

The current `semantic/computation-protocols.ts` file already exposes useful
pieces: `toLatex`, `graphForm`, `numericSample`, `matrixForm`, and
`differentiate`. The next code slices should not delete that work. They should:

1. add derive-specific descriptors and result types;
2. classify current helpers as `render`, `execute`, `derive`, or `sample`;
3. route exact `Expression -> Graph2D` and `Equation -> Graph2D` through the
   derive contract;
4. mark numeric samples as sampled outputs rather than exact symbolic
   derivations;
5. surface descriptors in the API catalog and dashboard.

## Acceptance Criteria

- Derive descriptors exist independently from execute/render descriptors.
- A derivation result records source, target, relation, status, assumptions,
  and implementation id.
- Existing expression, equation, graph, and matrix behavior can be mapped onto
  the contract without broad rewrites.
- Dashboard/API previews can display derive capability metadata.
- Graph-to-LaTeX exactness is impossible without symbolic provenance.

## First Implementation Slices

1. Add derive capability types and descriptors.
2. Add object registry metadata for capability advertisement.
3. Surface derive descriptors in API and dashboard previews.
4. Add graph-to-LaTeX provenance checks.
5. Route expression/equation graph derivation through the new contract.

## Source Refs

- `docs/project/roadmap.md`
- `docs/project/strategy.md`
- `src/semantic/computation-protocols.ts`
- `src/semantic/equation-graph.ts`
- `src/semantic/graph.ts`
- `src/editor/api-catalog.ts`
- `src/project-dashboard/render.ts`
