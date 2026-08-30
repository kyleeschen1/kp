# Portable Publication Platform Thread

Status: active
Last Updated: 2026-07-24
Current Next Action: Reconcile the existing reader and tutorial export
artifacts into one proposed publication-bundle envelope, then freeze an
`x + 3 = 7` fixture that a plain-HTML host and a SvelteKit route can consume
without importing editor internals.

## Goal

Let KP sites, semantic assets, authoring tools, and external publishing
integrations develop in parallel while preserving one framework-neutral asset
and runtime contract.

The outcome should let a user:

- export a tutorial from KP Studio;
- build a site from KP-aware Markdown through a CLI;
- embed the same figure in plain HTML or any major application framework;
- receive searchable SSR/static content before optional browser activation;
- share semantic figure state through stable URLs;
- inspect the same identity, dependencies, provenance, and verification from
  the dashboard.

## Current Decision

The accepted preliminary guidance is recorded in
`decisions/2026-07-24-kp-portable-artifact-and-host-joints.md`.

KP will use a framework-neutral publication bundle as an envelope over existing
lesson, semantic animation, tutorial manifest, projection, dependency, and
verification artifacts. It will not invent a third semantic model.

SvelteKit is the initial recommendation for Studio and the first-party
interactive site. Astro is the intended later reference integration for
content-first external publishing. Plain HTML is the mandatory portability
fixture. Framework adapters remain thin consumers of custom elements and
public compiler/runtime APIs.

This thread is parallel integration work. It does not change the active
semantic-animation exemplar order or authorize a broad package or UI migration.

## Parallel Lanes

### Asset and compiler lane

- stabilize source, semantic, tutorial, and compiled-document contracts;
- create the publication-bundle envelope;
- emit static fallbacks, hydration metadata, dependencies, and diagnostics;
- maintain deterministic fixtures for consumers.

### Embed and runtime lane

- define a small plain-HTML custom-element protocol;
- preserve static fallback content and geometry;
- lazily activate the real KP runtime;
- expose versioned semantic commands, properties, and composed events;
- suspend and dispose renderer work correctly.

### Markdown and CLI lane

- keep the Markdown AST build-only and private;
- expose a programmatic conversion API;
- make CLI commands thin orchestration over compiler/export APIs;
- produce machine-readable diagnostics and deterministic manifests.

### Studio and dashboard lane

- migrate application-shell UI toward declarative components;
- keep renderer-specific DOM behind adapters;
- make Studio invoke the same compiler used by CLI and CI;
- keep the dashboard a catalog of identity, dependencies, verification,
  maturity, and launch targets rather than a second editor.

### Website lane

- develop against a frozen bundle fixture and mock element before all real
  assets are ready;
- prerender or SSR prose, navigation, search, and meaningful fallbacks;
- let the host own routing and browser-history policy;
- integrate the real element only through its public protocol;
- measure production multi-figure pages rather than framework starter pages.

## Accepted Scope

- preliminary publication-bundle and custom-element contracts;
- a frozen representative algebra fixture;
- plain-HTML and one SvelteKit conformance host;
- static/no-JavaScript fallback, print, search, and accessibility metadata;
- programmatic Markdown conversion and CLI orchestration boundaries;
- headless URL-state ownership with host router integration;
- logical public entrypoints and import-direction checks;
- performance budgets for lazy activation, layout stability, runtime sharing,
  and renderer suspension;
- mapping existing editor/dashboard responsibilities onto the new joints.

## Out Of Scope

- a repository-wide package split;
- replacing current KaTeX, SVG, DOM, or WebGL renderer internals with framework
  components;
- choosing a final author-facing Markdown extension syntax;
- generating arbitrary framework applications from Studio;
- making SvelteKit, Astro, Lit, or any framework part of semantic truth;
- broad site design, curriculum expansion, authentication, classrooms, or
  learner modeling;
- generalizing a visual style from the infrastructure exemplar;
- changing the active Theseus animation run contract.

## Promotion Gate

The preliminary boundary becomes a promoted platform contract only after:

1. one immutable bundle passes schema and dependency closure;
2. useful static content renders without JavaScript;
3. plain HTML activates the figure and round-trips semantic URL state;
4. SvelteKit consumes the same bundle without private imports;
5. Studio and CLI produce equivalent compiled identity;
6. production checks show stable layout, lazy heavy dependencies, shared
   runtime packages, and offscreen suspension;
7. a second host, preferably Astro, consumes the bundle unchanged.

Until then, contract names and physical package boundaries remain provisional.

## Open Questions

- Should the outer bundle reference one lesson containing many figure entries,
  or support independently publishable figure bundles composed by a lesson
  bundle? Preliminary preference: support both by reference.
- Which tutorial export fields belong in the outer envelope, and which remain
  projection-specific?
- Does the first custom element need only `<kp-figure>`, or is a separate
  `<kp-tutorial>` lifecycle justified?
- Which URL parameters are common platform vocabulary and which are
  domain/projection-owned codecs?
- What is the smallest safe Markdown syntax before directives, MDX, or
  arbitrary HTML are considered?
- Should Lit implement the element shell, or is vanilla custom-element code
  sufficient until more element families exist?
- What is the initial production budget for many dormant figures and one
  active KaTeX/WebGL figure?
- When do independent consumers justify actual `@kp/*` package extraction?

## Links

- `docs/project/decisions/2026-07-24-kp-portable-artifact-and-host-joints.md`
- `docs/project/decisions/2026-07-19-kp-concept-room-architecture.md`
- `docs/project/reviews/2026-07-20-markdown-parser-selection.md`
- `docs/project/reviews/2026-07-10-tutorial-card-runtime-loop-closeout.md`
- `docs/project/reviews/2026-07-11-tutorial-card-export-embed-loop-closeout.md`
- `docs/project/threads/cross-domain-tutorial-platform.md`
- `docs/project/threads/semantic-runtime.md`
- `src/architecture/semantic-reader-boundaries.ts`
- `src/reader/document/artifacts.ts`
- `src/reader/compiler/public-api.ts`
- `src/reader/runtime/url-state-codec.ts`
- `src/tutorial/card-manifest.ts`
- `src/tutorial/export-artifact.ts`
