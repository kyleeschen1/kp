# Adopt The KP Concept-room And Library Architecture

Date: 2026-07-19  
Status: accepted

## Decision

KP will scale through independently versioned concept rooms built from a
headless semantic runtime, versioned capabilities, domain packs, neutral
external protocols, independently compiled providers, declarative content, and
renderer adapters. The first architectural proof is a deliberately plain
walking skeleton for `2x + 3 = 8`; visual polish begins only after that skeleton
passes an architecture review.

The dependency direction is:

```text
neutral protocols -> provider implementations
neutral protocols -> KP anti-corruption integrations

KP headless kernel -> domain packs -> content authoring
KP headless kernel -> pure projection IRs -> renderer adapters

compiled content + capabilities + integrations -> application shell
```

Dependencies may point only in the directions shown. The KP kernel never
imports content or a particular provider. Providers never import KP. Content
never imports renderer internals. The application shell is the composition
root.

## Repository Boundaries

New work will establish these logical boundaries without broadly moving legacy
files:

```text
content/       first-party concept sources and curated fixtures
protocols/     environment-neutral runtime schemas and conformance contracts
providers/     independently compiled deterministic or external programs
domains/       reusable subject semantics and typed capability handles
src/           KP kernel, integrations, projection contracts, renderers, apps
server/        transport adapters and server composition
```

Each subsystem exposes a narrow `public-api.ts`. Cross-subsystem deep imports
are forbidden. Logical boundaries and independent TypeScript targets come
before any broad npm-package or microservice split.

## Content Contract

- Promoted content is a declarative, versioned manifest.
- TypeScript authoring uses inference-first builders and typed handles; it
  compiles to stable declarative capability and provider references.
- Published concept versions are immutable. Drafts remain mutable.
- Publication emits content-addressed manifests, Review HTML/static SVG,
  inspection capsules, route metadata, dependency manifests, and provenance.
- Learner runtimes never execute content-authored callbacks or code.
- Catalogs, routes, lazy-loading metadata, and search indexes are generated
  from validated manifests rather than maintained through central switches.
- LLM-authored and human-authored content use the same compiler and gates;
  provenance changes review policy, not runtime structure.

Executable exemplar code may live in a content-local `incubating/` boundary.
Visual, motion, interaction, and subject-facing capabilities normally require
one approved canonical exemplar plus a second independent proving use before
platform promotion.

## Runtime And State Contract

- Watch, Touch, Ask, Review, symbolic, and balance modes are projections over
  one concept-room state machine, not content forks.
- Canonical state changes pass through a pure typed command/reducer boundary.
- Provider calls, LLM calls, URL synchronization, persistence, and lazy loading
  are effects interpreted by one disposable room-scoped coordinator.
- Asynchronous results carry the originating state revision or immutable
  snapshot identity and cannot silently apply to a changed room.
- Canonical URL parsing and formatting is a headless schema shared by browser,
  server, Review rendering, and LLM inspection.
- Runtime registries are immutable, explicitly constructed, and injected. New
  architecture does not depend on mutable module-level singletons.
- The kernel and controllers are UI-framework agnostic; the DOM is the first
  adapter, not the semantic runtime.

Published content pins major capability contracts. Breaking changes introduce
parallel majors; referenced implementations remain available until published
content has migrated through a new immutable version.

## Protocols, Providers, And Domain Packs

Serialized boundaries are runtime-schema-first, with TypeScript types inferred
from schemas. In-process composition is inference-first through literal-
preserving builders and typed handles.

Neutral protocol projects own wire schemas, exact DTOs, versioning, and
provider conformance tests. Provider projects implement those protocols with no
DOM or KP dependency. KP anti-corruption integrations translate validated
protocol results into KP semantic objects, transformations, provenance, and
diagnostics.

Reusable subject semantics live in versioned domain packs rather than in the
generic kernel or individual lessons. The algebra pack may own algebra identity
roles, operation handles, notation policy, equality correspondences, and pure
projection mappings; it does not own a solver, lesson prose, or renderer.

## Projection And Style Contract

Promoted visual capabilities separate pure semantic projection from renderer
interpretation. KP uses a small family of typed projection IRs—equation,
diagram, graph, code, table, and composite layout—rather than one universal
scene graph. They share stable identities, correspondences, semantic style
roles, focus state, sampled causal phase, accessibility metadata, provenance,
and diagnostics.

The house style is a versioned typed capability. One theme source generates
DOM/KaTeX CSS variables, SVG tokens, WebGL material values, Review/print rules,
and accessibility variants. Content requests semantic roles; it cannot own raw
colors, fonts, focus rings, materials, or arbitrary motion values. Initial
products use one locked house style with accessibility variants, not aesthetic
theme selection.

## Trust And Failure Boundaries

- Content, LLM operations, and provider responses are untrusted declarative
  data until schema and semantic validation pass.
- Capabilities, renderers, provider adapters, and incubating exemplar code are
  trusted reviewed executable code.
- KP does not evaluate author or LLM JavaScript in the learner runtime.
- A failed provider or interactive capability is isolated to its room.
- Validated static Review content is the guaranteed fallback and cannot be
  replaced by a blank interactive error surface.

## Architecture Fitness Rules

Objective rules become merge-blocking for new architecture. Existing
violations are captured in an explicit baseline that may shrink but not grow.
Required checks include dependency direction, headless compilation, schemas,
public entrypoints, inference behavior, provider conformance, deterministic
state and URL restoration, capability resolution, and absence of promoted
content-owned raw styling.

Type inference is public API behavior. Positive and negative type fixtures must
prove ergonomic call sites, narrow IDs, propagated provider types, exhaustive
commands, local invalid-reference errors, and absence of leaked `any` or
internal implementation types.

Subjective clarity, motion, and visual character remain human exemplar gates.

## Migration Strategy

Use a strangler migration. The new concept-room shell grows beside the current
editor/dashboard/FTC application. New rooms cannot add branches to the legacy
`src/main.ts` event architecture. Legacy surfaces may consume new public APIs,
but the new architecture cannot import legacy internals. Existing content moves
only when touched or deliberately promoted.

Do not begin a repository-wide move, universal renderer, package split, or
microservice program during the stabilization tranche.

## Product Ordering

The initial product sequence is now:

1. architecture stabilization through the plain linear-equation walking
   skeleton;
2. polished traditional symbolic manipulation for `2x + 3 = 8`;
3. the optional synchronized abstract balance projection;
4. the missing-middle `(a+b)^2` area-model demo;
5. later breadth through dot product, FTC, economics, and programming.

FTC remains valuable reviewable evidence but is no longer the front-door demo.
BFS, economics, and programming are parked until the simple algebraic and
geometric product language is clear.

## Consequences

- Architecture work has a bounded end-to-end exit rather than an open-ended
  refactor mandate.
- The content library, KP platform, and auxiliary programs can evolve without
  circular ownership.
- Exact URLs, Review projections, LLM inspection, and multiple visual modes
  share one state and publication model.
- Reusable capability promotion is slower than copying a demo once, but avoids
  large later migrations and speculative universal abstractions.

## Superseded Priority

This decision supersedes the immediate ordering—not the retained evidence—of
`2026-07-17-kp-cross-domain-tutorial-platform-roadmap.md`. Human FTC review and
BFS remain parked follow-ups. They no longer precede the concept-room
architecture skeleton and linear-equation exemplar.
