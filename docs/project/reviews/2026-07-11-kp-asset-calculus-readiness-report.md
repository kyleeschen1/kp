# KP Asset Calculus Readiness Report

Date: 2026-07-11
Grade: B
Status: active

## Scope

This report assesses whether KP Asset Calculus is ready to guide near-term
semantic authoring across math, external traces, programming traces, flashcards,
dashboard search, and future renderer integrations.

## Findings

KP now has a usable first vertical slice. The core interfaces cover semantic
objects, transformations, diagrams, behaviors, interpreters, ports, flashcards,
law helpers, pause-time inspection, drill-down hooks, and deterministic external
ports. The canonical linear-solve asset proves that one authored equation
sequence can expose object state, transformation provenance, behavior sampling,
drill-down explanation hooks, and flashcards without handing identity ownership
to the renderer.

The framework is strong enough for LLM and human authors to start creating
small semantic assets under tests. The best evidence is that the same protocol
now wraps three different sources: the live linear equation tutorial sampler, a
deterministic algebra-trace fixture, and the existing programming execution
trace fixture.

It is not yet a public SDK. Contracts are still local modules rather than a
stabilized package API. Renderer interpretation remains mostly documented
rather than implemented through a shared interpreter registry. The algebra and
programming ports are fixtures, not live CAS, LSP, or runtime adapters.

## Evidence

- `src/semantic/asset.ts`
- `src/semantic/asset-transformation.ts`
- `src/semantic/asset-diagram.ts`
- `src/semantic/asset-behavior.ts`
- `src/semantic/asset-inspection.ts`
- `src/semantic/asset-decomposition.ts`
- `src/semantic/asset-flashcard.ts`
- `src/semantic/asset-port.ts`
- `src/semantic/asset-laws.ts`
- `src/semantic/linear-solve-asset.ts`
- `src/semantic/algebra-trace-port-fixture.ts`
- `src/semantic/program-trace-asset.ts`
- `tests/kp-linear-solve-asset.test.ts`
- `tests/kp-algebra-trace-port-fixture.test.ts`
- `tests/kp-program-trace-asset.test.ts`
- `tests/project-dashboard.test.ts`

## Risks

- The renderer bridge is still thin. Semantic assets can be sampled and
  inspected, but most KaTeX/WebGL/programming renderers do not yet consume the
  new asset protocol directly.
- Composition laws are useful but incomplete. We have deterministic behavior,
  rewind, and port law checks, but not full associativity, selector
  correspondence, interpreter composition, or flashcard generation laws.
- The external-port story is fixture-backed. Live CAS/LSP/runtime adapters may
  expose ambiguity that the current fixture path does not yet model.
- The public API boundary is not stable. Interfaces are useful internally, but
  names and module boundaries may still change as renderer integrations begin.

## Recommended Next Actions

1. Promote the linear-solve renderer path so it consumes the asset bundle,
   inspection API, drill-down hooks, and flashcards from one source of truth.
2. Add interpreter contracts for KaTeX frame sampling and dashboard previews
   before widening the math catalog.
3. Add law tests for selector correspondence, diagram associativity, flashcard
   reference closure, and interpreter loss diagnostics.
4. Keep external ports fixture-first until the diagnostics vocabulary can handle
   opaque, ambiguous, and lossy live systems.
5. Use the dashboard rows as the working index for new assets so Codex sessions
   can discover examples without re-reading the entire design history.
