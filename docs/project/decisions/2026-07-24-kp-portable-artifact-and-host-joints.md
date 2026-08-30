# Decision 2026-07-24: Portable KP Artifact And Host Joints

Date: 2026-07-24  
Status: accepted preliminary design guidance

## Decision

KP will develop publication sites in parallel with semantic assets by making the
integration joints explicit and versioned. Semantic truth, compilation,
playback, rendering, publication packaging, authoring tools, and host websites
remain independently replaceable subsystems.

The durable distribution boundary is a framework-neutral KP publication bundle.
It references existing semantic and tutorial artifacts rather than introducing
a third competing semantic model. A host may be implemented in SvelteKit,
Astro, Nuxt, Next.js, plain HTML, or a future framework without changing the
published KP asset.

The first-party KP Studio and interactive site should initially favor
SvelteKit. A later Astro starter should be the reference content-first
publishing integration. Plain HTML remains the conformance host that proves
framework independence. Lit may be evaluated as an implementation aid for KP
custom elements, but no site or artifact contract depends on Lit.

This decision authorizes boundary design and bounded parallel exemplars. It
does not authorize a repository-wide package move, a broad UI rewrite, or a
change to the active semantic-animation execution contract.

## Reason

KP needs to support several workflows without coupling its core asset to any of
them:

- a user creates a tutorial in KP Studio and publishes it;
- an author embeds KP figures in Markdown and builds static HTML from a CLI;
- a framework application imports the same figure or tutorial;
- a content site server-renders searchable prose and static figure fallbacks,
  then upgrades selected figures in the browser;
- the dashboard discovers, inspects, verifies, and launches published assets;
- different sites use different routing, authentication, search, styling, and
  deployment systems.

The current repository already contains important parts of this architecture:

- `KpLessonDocument`, compiled lesson artifacts, static prose and math
  compilation, and hydration manifests under `src/reader`;
- `KpTutorialCardManifest`, export artifacts, dependency planning, iframe
  documents, static-step artifacts, and fallback readiness under `src/tutorial`;
- build-only CommonMark parsing whose vendor AST does not escape the compiler;
- headless composable URL-state codecs;
- framework-agnostic semantic/runtime boundaries and renderer-specific DOM,
  KaTeX, SVG, canvas, and WebGL adapters.

The missing design joint is an outer publication envelope that lets these
existing artifacts travel together while preserving their separate authority.
Without that envelope, each application is likely to grow its own route shape,
asset resolver, hydration convention, dependency loading, and fallback rules.

## Vocabulary

The word `asset` currently risks hiding several distinct lifecycles. Preliminary
guidance uses these terms:

| Term | Meaning | Mutability |
| --- | --- | --- |
| Authoring source | A lesson, figure, problem session, or tutorial being edited | Mutable draft |
| Semantic artifact | Validated objects, transformations, correspondence, checkpoints, and provenance | Immutable once published |
| Compiled lesson | Searchable static document HTML plus references and hydration metadata | Reproducible build output |
| Projection asset | Poster SVG, static math, step sequence, iframe document, frame sequence, transcript, or future media | Reproducible build output |
| Publication bundle | Versioned envelope that closes references among documents, semantic artifacts, projections, dependencies, URLs, and verification | Immutable published revision |
| Host site | A website or application that routes, lays out, searches, and progressively activates bundles | Independently deployed |

An authoring source is not an embed. A semantic artifact is not a generated web
page. A projection asset is not the source of semantic truth. A publication
bundle contains references and integrity information; it does not flatten all
of these layers into one large JSON object.

## Architectural Planes

```text
TRUTH PLANE
authoring source -> validators/compiler -> semantic and lesson artifacts

EXECUTION PLANE
semantic artifact -> runtime sampling -> projection frames -> renderers

DELIVERY PLANE
publication bundle -> CLI / Markdown / Studio / dashboard / host sites
                                  |
                                  -> static fallback + optional browser upgrade
```

Dependencies flow from delivery toward public truth and execution contracts.
The semantic core never imports a site framework, CLI, Markdown parser,
dashboard, editor, browser history API, or custom element.

## Program Joints

### 1. Authoring document joint

Owns versioned lesson and tutorial source structure, source locations and
diagnostics, stable semantic references, and draft versus published identity.
Current footholds include `KpLessonDocument`, inference-first document builders,
and tutorial/problem-session manifests.

It must not own DOM nodes, renderer geometry, framework components, browser
history, or arbitrary executable learner callbacks.

### 2. Compiler and validation joint

Owns parsing replaceable author syntax into KP-owned document IR; schema,
reference, semantic, dependency, and publication validation; deterministic
static and hydration compilation; source-positioned diagnostics; and compiler
compatibility metadata.

The Markdown AST remains private to this joint. Markdown is an authoring
adapter, not KP's semantic representation. This joint must not own interactive
playback, framework routing, editor UI state, or renderer timing.

### 3. Semantic animation and tutorial manifest joint

Owns semantic objects and transformations, stable selectors and
correspondence, layout and timeline references, checkpoints, checks,
provenance, capability requirements, and sampleable/reversible runtime intent.
Current footholds include the semantic animation contracts and
`KpTutorialCardManifest`.

This remains the executable truth consumed by runtimes and exporters. A website
must not reconstruct semantics from rendered HTML.

### 4. Publication bundle joint

This is the principal new outer seam. The provisional bundle should reference:

```text
bundle schema version
publication id and immutable revision
integrity/content-address information
lesson document and compiled-document refs
figure/tutorial/problem-session refs
static projection and transcript refs
hydration/activation manifest refs
dependency phases and capability package refs
canonical URL-state schema
search, accessibility, print, and fallback metadata
provenance, verification, and review status
compiler/runtime compatibility ranges
```

The bundle is an envelope over existing artifacts. It must not duplicate lesson
blocks, semantic graphs, timelines, or renderer frames merely for convenience.

Every reference must close locally or through an explicit immutable
package/version reference. Hosted readiness must reject development URLs,
missing fallbacks, unresolved capabilities, and incompatible runtime majors.

### 5. Static publication joint

Owns searchable and printable HTML, static KaTeX and SVG where available,
meaningful posters or step views, transcripts and checkpoint anchors, fixed
geometry needed to avoid layout shift, and links requesting an equivalent
interactive state.

Static output is a guaranteed projection, not a screenshot scraped from a
hydrated application. It remains useful when JavaScript fails or is disabled.

### 6. Runtime and renderer joint

Owns clocks, sampling, seek, exact rewind, lifecycle, renderer-neutral
presentation state, renderer interpretation, cleanup, suspension, and
reduced-motion behavior.

Direct DOM creation remains legitimate inside renderer adapters when identity,
measurement, retained layers, or exact motion require it. Framework migration
targets application shells first, not renderer DOM mechanically.

### 7. Custom-element joint

The first browser protocol should be a small family of elements rather than one
class per animation. A provisional `<kp-figure>` owns:

- resolving a published figure reference;
- reserving layout and preserving the static fallback;
- preparing and disposing the KP runtime;
- `play`, `pause`, `seek`, `rewind`, and readiness behavior;
- semantic property input for rich configuration;
- versioned composed events for checkpoints, focus, parameters, readiness, and
  errors;
- lazy activation and offscreen suspension.

It must not own site routing, global history, authentication, search,
navigation, surrounding prose, a second semantic state, or framework context.
Primitive values may be attributes; rich configuration uses DOM properties.
Event and method behavior must be testable from plain HTML.

### 8. URL-state joint

The headless URL codec owns parameter names, parsing, formatting, validation,
defaults, and semantic round trips. The host owns when to call `pushState`,
`replaceState`, or its framework router.

URLs encode publication, figure, checkpoint, projection, and meaningful
user-controlled parameters. They do not encode pixels, pointer position, raw
renderer state, or every frame. A server should be able to choose a meaningful
initial static projection from the URL before activation.

### 9. Markdown conversion joint

The Markdown converter is a build library with a programmatic API. It owns a
narrow KP embed syntax, source locations, bundle/figure reference resolution,
static fallback markup, activation metadata, dependency closure, and author
diagnostics.

It delegates semantic validation, compilation, static rendering, and bundle
resolution to their owning libraries. The CLI may expose it as `kp build` or
`kp markdown`, but Astro, SvelteKit, Eleventy, or another build system can call
it without spawning a process.

The accepted `mdast-util-from-markdown` boundary remains the current parser
choice. GFM, directives, MDX, arbitrary HTML, and plugins remain separate
security and product decisions.

### 10. CLI joint

The CLI is a thin orchestration surface over public programmatic APIs.
Provisional command families are:

```text
kp validate
kp compile
kp build
kp export
kp inspect
kp serve
```

The exact vocabulary is provisional. A command must call the same compiler,
validators, resolver, and exporters used by Studio and CI. Business rules must
not live only in command handlers. Output should include machine-readable
diagnostics and deterministic manifests.

### 11. KP Studio and semantic editor joint

Studio owns draft editing, semantic inspection, timeline/projection/narration
authoring, preview through the real runtime, diagnostics and repair,
publication review, and invocation of the same compiler/export APIs as CLI.

Studio stores authoring intent, not private renderer DOM. Saving from Studio
must produce the same artifact as compiling equivalent source through CLI.

The current editor combines durable authoring behavior with ad hoc shell DOM.
Declarative components should gradually replace shells, panels, controls,
forms, lists, dialogs, and navigation. Precision equation and WebGL adapters
remain behind runtime/renderer interfaces.

### 12. Dashboard and catalog joint

The dashboard is an operational catalog, not the semantic editor or publication
host. It owns indexing bundle/capability metadata; search; maturity, provenance,
dependency, and verification views; launch targets; previews; diagnostics; and
project-control linkage.

It reads manifests and compiler diagnostics through public catalog adapters. It
must not deep-import site components or become the only registry from which
published assets resolve.

### 13. Host-site joint

A host owns SSR/prerendering, routes, deployment, prose, navigation, search,
authentication, classrooms, host persistence, theater/presenter layout,
activation policy, mapping element events to URL/application state, and
site-level accessibility and performance policy.

It must not implement semantic transformations, renderer timing, asset
verification, or private runtime state. Framework adapters such as
`@kp/svelte` or `@kp/react` may add types and ergonomic wrappers, but deleting
them must leave the custom-element protocol intact.

## Logical Boundaries Before Package Boundaries

The repository should strengthen public entrypoints and import rules before a
broad monorepo split. The existing reader layering is the model:

```text
document -> compiler
document -> runtime
document + runtime -> renderers
document + runtime + renderers -> app
```

The tutorial manifest/export line should converge with this reader pipeline
through the publication bundle, not cross-directory deep imports.

Possible future distribution entrypoints are illustrative, not approved
directories:

```text
@kp/schema
@kp/compiler
@kp/runtime
@kp/elements
@kp/markdown
@kp/cli
@kp/svelte
```

Physical extraction is justified only after a public entrypoint has two
independent consumers or needs independent release/version behavior.

## Parallel Development Model

Parallel work proceeds against frozen, versioned fixtures rather than shared
implementation internals.

| Lane | Can proceed independently with | Produces at its joint |
| --- | --- | --- |
| Semantic assets | Current runtime and plain diagnostic renderers | Valid semantic/tutorial manifest fixture |
| Publication/compiler | Frozen source and asset fixtures | Compiled lesson, static projections, bundle |
| Custom elements | Frozen bundle and mock runtime adapter | Plain-HTML element conformance fixture |
| Markdown and CLI | Frozen bundle and compiler API | Deterministic site output and diagnostics |
| Studio/editor | Compiler client and element fixture | Draft/export workflow |
| First-party site | Frozen bundle, fallback, and element mock | SSR route, layout, search, URL coordination |
| Astro integration | Same bundle and element protocol | External content-first starter |
| Performance/accessibility | Hosted fixtures from each lane | Shared budgets and conformance evidence |

The first site does not wait for a large animation library; it uses one frozen,
reviewed artifact. The compiler does not wait for the site; it uses the
plain-HTML conformance host. Mock and real producers pass the same schema and
consumer-contract tests.

Integration happens at explicit promotion points:

1. source schema fixture accepted;
2. publication bundle fixture accepted;
3. plain-HTML custom-element behavior accepted;
4. SSR/static fallback accepted;
5. URL round trip accepted;
6. Studio and CLI output equivalence accepted;
7. first framework host accepted;
8. second independent host proves portability.

## First Exemplar Contract

Canonical references:

- the accepted searchable semantic reader and its `x + 3 = 7` lesson contract;
- existing tutorial-card manifest, dependency, iframe, and static-step work;
- the concept-room rule that kernel and controllers are UI-framework agnostic.

Observable acceptance criteria:

- one immutable bundle is consumed by plain HTML and one SvelteKit route;
- both hosts show useful searchable content and stable fallback before JS;
- the same figure upgrades lazily through the public element protocol;
- checkpoint and parameters survive a URL encode/decode round trip;
- Studio/fixture and CLI compilation produce equivalent bundle identity and
  dependency closure;
- the host imports no editor internals and the element imports no framework;
- activation avoids material layout shift and unrelated eager renderers;
- print, reduced-motion, keyboard, and no-JS projections remain useful.

Preservation boundary:

- preserve current semantic assets, transformation identity, runtime sampling,
  URL codecs, renderer behavior, and active animation priorities;
- do not redesign KaTeX/WebGL internals for a site framework;
- do not generalize visual presentation from this infrastructure exemplar.

Smallest rollback units:

- remove the framework host without removing the bundle or element;
- remove the element adapter without removing runtime/publication APIs;
- remove a CLI command without removing its compiler API;
- remove Markdown syntax without removing lesson documents;
- remove the envelope without mutating underlying semantic artifacts.

## Performance And SSR Guidance

Framework choice does not guarantee good Core Web Vitals. Enforce that:

- static prose and a meaningful figure arrive in initial HTML;
- geometry is known before activation;
- KP runtime code is absent from pages without KP figures;
- heavy renderer families load only when required;
- below-fold figures activate on visibility or interaction;
- offscreen animation and WebGL work suspend;
- a URL-targeted figure may receive activation priority;
- a page shares runtime packages rather than bundling one runtime per figure;
- checks use production multi-figure pages, not empty framework starters.

Lighthouse is a regression signal. Durable gates should also measure bundle
composition, layout stability, activation latency, long tasks, runtime reuse,
and renderer suspension.

## Consequences

Benefits:

- sites and assets can proceed in parallel against stable fixtures;
- assets remain importable across current and future frameworks;
- Studio, CLI, CI, and site builds share compiler truth;
- static publication, accessibility, search, and print are first-class;
- frameworks improve application ergonomics without rewriting renderers;
- a second host is a conformance test, not a second KP implementation.

Costs:

- schemas and compatibility policy require discipline;
- the bundle adds a delivery artifact, though not a semantic model;
- mock fixtures and consumer-contract tests must be maintained;
- thin framework adapters may duplicate small ergonomic glue;
- publication cannot rely on convenient editor deep imports.

## Alternatives Considered

### Generate a complete framework project from Studio

Rejected as canonical output. It couples tutorials to generator templates.
Studio may later generate optional starters around a portable bundle.

### Make Markdown or MDX canonical KP source

Rejected. Markdown is valuable authoring syntax but not the runtime contract.
Vendor ASTs remain behind a build adapter.

### Make the custom element the entire application

Rejected. Routing, search, prose, classrooms, authentication, and layout belong
to replaceable hosts. The element is an executable figure boundary.

### Move all DOM rendering into Svelte

Rejected. Declarative components suit shells; direct DOM and retained renderer
structures remain appropriate for exact equation and WebGL animation.

### Use only Astro for publication and Studio

Not selected initially. Astro is the strongest reference publishing host;
SvelteKit is the better single-framework compromise for a rich editor.

### Split the repository into packages immediately

Rejected. First enforce logical APIs and prove independent consumers. Physical
extraction follows demonstrated release and dependency needs.

## Follow-ups

1. Reconcile reader artifacts and tutorial exports into a proposed bundle
   envelope without changing either semantic source model.
2. Freeze one `x + 3 = 7` bundle fixture with fallback, hydration, dependency,
   URL, accessibility, and verification metadata.
3. Define the plain-HTML `<kp-figure>` conformance protocol.
4. Specify programmatic compiler, Markdown, and CLI boundaries before final
   command syntax.
5. Map editor and dashboard modules onto distinct Studio/catalog roles.
6. Build one SvelteKit SSR/prerender exemplar and stop for architecture and
   performance review.
7. After the element protocol stabilizes, prove the bundle through Astro.
8. Extract packages only when independent consumption or release cadence makes
   the move pay for itself.

