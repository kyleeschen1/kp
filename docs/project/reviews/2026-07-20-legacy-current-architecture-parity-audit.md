# Legacy/current architecture parity audit

Date: 2026-07-20

Status: review boundary; no migration authorized or performed

Current repository: `/Users/kyleeschen/Code/kp`

Legacy lineage: `/Users/kyleeschen/Code/kinetic-press`

## Executive recommendation

Do not choose one repository wholesale. Converge the legacy repository's document-first delivery model with the current repository's typed semantic kernel.

The legacy lineage is currently better at shipping readable, searchable, scrollable lessons with low route cost and unusually legible continuous symbolic motion. The current repository is better at semantic animation modeling, renderer independence, inferred TypeScript authoring, exact external providers, durable URLs, provenance, validation, and architecture enforcement. Kinetic Press needs both sets of strengths.

The smallest useful convergence proof is the `x + 3 = 7` story:

1. Author a compact lesson document.
2. Compile it to searchable HTML, static KaTeX/SVG, a table of contents, and a semantic hydration manifest.
3. Drive the existing canonical semantic animation through a lightweight learner runtime.
4. Let ordinary scrolling continuously control progress within each transformation while keyboard controls and URLs address stable checkpoints.
5. Keep the editor, Three.js, and unrelated animation families out of the learner route.

This is a convergence pilot, not a broad rewrite. Perfect and review this exemplar before generalizing.

## Scope and evidence limits

This was a read-only architectural audit of both repositories. It covered source topology, authoring, compilation, learner runtime, animation execution, routing, static output, styles, assets, existing build output, and test structure. No legacy files were changed, no dependencies were installed, and no builds were run.

The legacy worktree already contains user-owned edits, including active style and runtime changes. They were treated as evidence only and left untouched. Existing build artifacts are directional evidence rather than a clean benchmark: the current build is dated July 20 and the legacy build July 6, while the legacy source has newer uncommitted changes.

## What the two repositories actually are

The legacy repository is not a single clean architecture. Three generations coexist:

1. Stateful per-page SVG scenes with `init`, `update`, `resize`, and `destroy` lifecycles.
2. Markdown lessons compiled into beats, static HTML, a table of contents, specs, and hydration data.
3. Newer focus widgets and semantic code projections with continuous scroll scrubbing and semantic manifests.

The current repository is a semantic animation platform whose first serious learner surface is being assembled from editor and platform subsystems. It has a stronger model, but its delivery boundary has not yet become as lean or document-native as the legacy reader.

| Dimension | Legacy lineage | Current repository |
| --- | --- | --- |
| Primary authoring | Markdown directives plus page code | Inferred TypeScript concept and animation manifests |
| Compilation | Markdown to static lesson HTML, TOC, spec, and hydration JSON | Vite SPA plus a separate review HTML path |
| Initial document | Readable lesson and first frames | Empty SPA root on the interactive origin |
| Motion clock | Continuous local scroll progress in focus widgets | Discrete beat activation followed by a 620 ms seek in the current story |
| Semantic model | Runtime-validated entities, transitions, commands, and explanations | Typed assets, transformations, references, URLs, providers, integrity, and provenance |
| Rendering | DOM, KaTeX, SVG, and code projections | DOM, KaTeX, SVG, diagrams, matrices, graphs, programming, WebGL, and exports |
| Routing | Heading/beat hashes and selected query state | Typed concept, checkpoint, time, mode, projection, branch, provider, provenance, and focus state |
| Separation | Several generations and large runtime modules coexist | Explicit dependency graph, but the learner story imports editor machinery |
| Content maturity | Roughly 25 lesson documents across several subjects | One serious concept plus a broad library of samples and infrastructure |

## Matched symbolic exemplar

The matched `x + 3 = 7` comparison explains the missing motion more precisely than a visual-style diagnosis.

In the legacy focus-widget path, scroll position is the animation clock. The runtime measures semantically matched source and destination elements and continuously interpolates position, scale, and opacity. Symbols are preserved, spawned, consumed, or introduced according to the transition. Reversing the scroll exactly reverses the motion. The learner can inspect every intermediate instant without pressing play or waiting for a canned duration.

In the current story, an intersection observer selects a beat and a controller eases the canonical player to that beat's checkpoint over 620 ms. The policy intentionally says ordinary scrolling is not the animation clock. The story then dynamically imports the editor animation library, player shell, player controller, registry, and equation adapter. The semantic animation engine is capable; the learner integration collapses that capability into a nearly discrete seek.

The product implication is not “copy the old animation.” It is:

- Retain the current semantic animation asset as the source of truth.
- Add a small reader adapter that can sample it directly from local scroll progress.
- Preserve discrete buttons, keyboard operation, reduced-motion behavior, and stable URL checkpoints.
- Do not use the editor player as the learner runtime.

This hybrid makes “See concepts move” literal. It is also immediately distinct from a conventional interactive lesson: the algebraic object itself persists and moves under the reader's control.

## Existing-build evidence

These figures exclude fonts when comparing route-linked assets and should not be treated as a fresh performance baseline.

| Measure | Legacy lineage | Current repository |
| --- | ---: | ---: |
| `dist` size | 5.2 MB | 3.6 MB |
| `node_modules` size | 225 MB | 123 MB |
| Built JavaScript | 1,450,860 B raw / 218,115 B gzip | 2,348,545 B raw / 587,381 B gzip |
| Built CSS | 117,920 B raw / 30,389 B gzip | 71,417 B raw / 16,113 B gzip |
| Representative linear-equation route | 197,803 B raw / 56,875 B gzip | 1,076,596 B raw / 282,659 B gzip |
| Initial HTML | 90,930 B raw / 6,319 B gzip | 325 B raw / 234 B gzip |

The current symbolic route's immediately reached dependency set is about five times the gzip size of the legacy linear-equation route before fonts. Its large dependencies include Three.js, client KaTeX, the editor render stack, the equation surface adapter, animation player code, and broader animation-family machinery. Three.js is not needed for this lesson.

The smaller current `dist` is not contradictory. The legacy build emits many complete static pages and generated lesson artifacts; the current build emits one SPA and much less learner content.

Source scale tells the same story:

| Area | Legacy lineage | Current repository |
| --- | ---: | ---: |
| Source code | about 37k lines | about 132k lines |
| Tests | about 96 test files | about 419 test files |
| Lesson/page files | about 25 Markdown lessons and 245 page files | one principal concept and a large catalog/test surface |
| Generated lesson artifacts | 116 files / about 5.2 MB | 3 matched files / about 43 KB |

The current repository has paid for a general platform before achieving equivalent reader delivery. That investment is valuable, but the next work should expose it through a smaller boundary instead of adding another surface-specific framework.

## Asset and product parity

Legend: **strong** means a polished or architecturally credible capability exists; **partial** means infrastructure exists without equivalent learner proof; **absent** means no meaningful implementation was found.

| Capability | Legacy lineage | Current repository | Convergence decision |
| --- | --- | --- | --- |
| Searchable prose and TOC | **Strong** | **Partial** separate review endpoint | Port the document-first contract |
| Symbolic equation motion | **Strong** continuous scrubbing | **Strong engine, weak story integration** | Current semantics, lightweight scroll sampler |
| Fractions/division/distribution | **Strong** authored examples | **Strong model and canonical assets** | Use current assets in the pilot sequence |
| SVG diagrams and 2D graphs | **Strong** mature scenes | **Strong abstractions, partial lessons** | Adapt legacy exemplars to current semantic scenes |
| KaTeX in graphical labels | **Strong** through HTML/SVG integration | **Partial** by surface | Establish one cross-renderer typography contract |
| Code morphing/refactoring | **Strong** TS/Rust and semantic projection pages | **Partial** adapter and traces | Port one exemplar after equations |
| WebGL/3D | **Absent** | **Strong and unique** | Preserve, always lazy-load, limit live canvases |
| External problem providers | **Limited** | **Strong** exact rational protocol/provider split | Keep current boundary |
| URL-addressable state | **Useful but narrower** | **Strong** typed, versioned, provenance-aware | Keep current model; add document anchors |
| LLM explanation/correction | **Partial** semantic commands and export | **Strong foundation** typed state and provenance | Converge on current contract |
| No-JS and print reading | **Strong** | **Partial** separate raw review output | Make it the canonical route fallback |
| Inferred TypeScript APIs | **Limited** | **Strong** | Retain as the advanced authoring escape hatch |

The legacy repository already contains semantic commands and explanation export, so “LLM-aware” is not exclusive to the current code. The current advantage is deeper typed transformation data, stricter reference closure, renderer-independent assets, provider isolation, integrity checks, and stateful URLs suitable for correction links.

## Pros and liabilities

### Legacy strengths to preserve

- A lesson is a document first: readable, searchable, printable, linkable, and useful without hydration.
- Markdown makes content authoring compact and keeps prose adjacent to interactive intent.
- Continuous scroll scrubbing gives the learner direct temporal control over symbolic motion.
- Route-specific pages and lazy hydration keep unrelated asset families out of a lesson.
- The content library demonstrates equations, economics, calculus, graphs, game theory, and code.

### Legacy liabilities not to inherit wholesale

- Multiple architectural generations coexist and duplicate conventions.
- The compiler parser is a large custom directive parser, not a small or easily trusted core.
- Focus-widget and code-projection runtimes are large DOM-measurement monoliths.
- Old docs and current behavior disagree in places, including scroll handling and HTML mutation.
- Styling mixes old tokens, page CSS, newer variables, and active migration work.
- Semantic types are comparatively loose and rely more heavily on runtime validation.

### Current strengths to preserve

- Animation is modeled as semantic material and transformations rather than page-specific pixels.
- Authoring helpers infer types while still enforcing reference closure and domain contracts.
- Render targets include equations, diagrams, matrices, graphs, programming, dashboards, exports, SVG, and WebGL.
- Exact providers, core protocols, authoring, integrations, projections, and app adapters have explicit boundaries.
- URLs can represent a precise point of confusion, including checkpoint, time, mode, projection, provider, version, provenance, and focus.
- Tests and architecture gates are substantially deeper.

### Current liabilities to correct

- The learner story imports the editor player and a broad animation dependency closure.
- The interactive route has no meaningful static document at its canonical origin.
- The review HTML path is separate and does not currently emit the full visual theme.
- Authoring is TS-heavy and has no compact prose-first content format.
- Route-scoped CSS strings and hard-coded editor colors obstruct a shared SVG/WebGL/static theme.
- A small amount of compiler code directly imports editor rendering, violating the desired boundary.
- Platform breadth is more mature than the number of polished learner exemplars.

## Recommended target architecture

```text
Markdown lesson ─┐
                 ├─> authoring front end ─> semantic lesson IR
inferred TS API ─┘                              │
                                               ├─> static compiler
                                               │     HTML + TOC
                                               │     KaTeX/MathML
                                               │     SVG first frames
                                               │     hydration manifest
                                               │
                                               └─> lightweight reader runtime
                                                     scroll/router/focus core
                                                     lazy equation adapter
                                                     lazy SVG/graph adapter
                                                     lazy code adapter
                                                     lazy WebGL adapter

editor ─────────────────────────────── consumes the same IR and assets
external providers ────────────────── implement versioned core protocols
```

The key boundary rules are:

1. Core semantic IR contains no DOM, editor, compiler, or renderer imports.
2. The compiler is Node-only and produces a complete readable first representation.
3. The reader runtime cannot import editor packages.
4. Every adapter is independently lazy and depends only on core IR plus its renderer.
5. WebGL is never an initial dependency; only visible or near-visible 3D assets acquire a canvas, with a small explicit canvas budget.
6. The editor consumes production assets and manifests but is not a production dependency.
7. Providers implement versioned protocols and never leak application state into authored content.
8. Markdown is a compact front end, not the semantic source of truth after compilation.

## Presentation and interaction contract

Use a hybrid scrollytelling model:

- Text remains on the left and the visual remains sticky on the right at the current demo dimensions.
- A semantic beat defines a stable sentence, checkpoint, URL, and review target.
- Within a beat, local scroll progress continuously samples the transformation.
- Keyboard/buttons can step between checkpoints or scrub with accessible controls.
- Reduced motion resolves to discrete, comprehensible states without losing content.
- URLs update at stable checkpoints, not every scroll pixel. “Copy link here” may include a precise time value.
- Hover/focus links between prose, symbols, and geometry use the same semantic references and focus roles.
- Scale/balance views remain available but off by default for the symbolic-first exemplar.

This preserves text's search and review advantages while making temporal inspection easier than video. The reader can pause at any instant, reverse, follow a symbol, copy a confusion URL, ask an LLM about that exact state, and continue reading.

## Style contract

Create one renderer-neutral design-token package rather than copying either stylesheet:

- Semantic roles for surface, ink, muted ink, accent, source, destination, cancellation, geometry, grid, success, warning, and focus.
- One body family, one code family, and KaTeX for mathematical labels wherever HTML/SVG foreign content is practical.
- Equivalent font metrics and colors across DOM, SVG, canvas, WebGL sprites/materials, static review, and print.
- A single visible focus grammar for links, controls, symbols, diagram entities, and canvas proxies, including forced-colors support.
- No route-owned palette strings in TypeScript and no editor tokens leaking into reader output.

WebGL cannot literally share browser text rendering in all cases. It should consume the same font files, type scale, role colors, and focus semantics; use DOM/KaTeX overlays for mathematical labels where that produces the best parity.

## Convergence pilot

### Phase 0: freeze the preservation boundary

Canonical references:

- Current semantic `x + 3 = 7` asset and its tested transformations.
- Legacy focus-widget continuous symbolic movement and static-document behavior.
- Current concept URL, provider, provenance, focus, and accessibility contracts.

Do not alter the general animation model, editor player, legacy repository, or unrelated concept surfaces during the pilot.

### Phase 1: compile one document

Introduce the smallest Markdown front end necessary for prose, headings, equation-story references, focus links, and semantic beats. Reuse useful legacy syntax ideas, but do not transplant the legacy parser wholesale. Compile to the current semantic lesson IR, static HTML/TOC, KaTeX/MathML, an SVG/static first frame, and a hydration manifest.

### Phase 2: build the lightweight reader adapter

Render the existing canonical equation asset without editor imports. Map local scroll progress to the asset's neutral sampler. Preserve buttons, keyboard operation, reduced motion, focus affordances, and precise link generation.

### Phase 3: meet the exemplar gate

The pilot is ready for visual review only when:

- Symbol motion is unmistakable, reversible, and inspectable at arbitrary progress.
- Expressions do not wrap at the agreed viewport range.
- Prose and equation references share hover and keyboard focus behavior.
- The canonical URL opens the correct beat; a copied precise link can restore its time.
- The page is searchable, printable, and understandable with JavaScript disabled.
- The route imports no editor, WebGL, 3D, or unrelated animation-family chunks.
- Static and hydrated representations use the same color, typography, and focus roles.
- A measured build establishes budgets before any family-wide enforcement.

Initial budget hypotheses for the pilot, to validate rather than silently institutionalize:

- Zero JavaScript required to read the prose and static states.
- Reader/router/focus core at or below 20 KB gzip.
- Full equation exemplar at or below 100 KB gzip excluding fonts.
- No WebGL bytes and no live canvas.

### Phase 4: prove breadth one asset at a time

After the symbolic exemplar is approved, add one independently reviewable exemplar for each family:

1. Missing-middle algebra/geometry coordination.
2. One SVG graph or diagram.
3. One code morph/refactor.
4. One lazily mounted 3D/WebGL concept.

Each must use the same document, URL, semantic focus, theme, hydration, and adapter contracts. Econ and the larger FTC lesson stay parked until these primitives are credible.

### Phase 5: converge authoring and editor workflows

Only after reader parity, make the editor preview and export the same compiled manifests. Keep the inferred TypeScript API for complex assets and generated/provider-backed content. Markdown should reference those assets rather than attempt to encode every transformation inline.

## Retain, adapt, and avoid

| Action | Items |
| --- | --- |
| Retain directly | Current semantic assets, neutral sampling, typed URLs, provider protocols, provenance, reference validation, renderer interfaces, architecture gates |
| Adapt deliberately | Legacy Markdown vocabulary, static compilation, TOC/deep links, lazy hydration, continuous local scroll progress, code-anchor concepts, KaTeX/SVG labeling |
| Preserve as exemplars | Legacy equation, graph, FTC, economics, and code pages; current independent animation cards and visual theme direction |
| Avoid porting wholesale | Legacy parser, monolithic focus/code runtimes, page CSS matrix, stale build assumptions, current editor-player dependency in learner pages |
| Defer | Full FTC migration, econ tutorial, comprehensive programming authoring, family-wide style enforcement, general WebGL orchestration |

## Decisions after exemplar review

The pilot should produce evidence for three decisions instead of guessing now:

1. Whether continuous scrub is the default for every transformation or an asset-level presentation policy.
2. Whether generated static lesson artifacts are checked in, produced only at build time, or split between review fixtures and deploy output.
3. Which portions of the legacy Markdown vocabulary deserve compatibility and which should be replaced by a smaller schema.

None blocks the first document/compiler/reader walking skeleton.

## Bottom line

The legacy repository proves that Kinetic Press can feel like a document and still make symbols move with unusually direct learner control. The current repository proves that those moving objects can be semantic, renderer-independent, linkable, verifiable, provider-backed, and legible to an LLM. The next product milestone should join those proofs in one tiny route.

Success is not feature parity by accumulation. It is a page whose clarity is immediately striking, whose source remains readable and searchable, whose symbols can be followed more precisely than in video, and whose exact state can be shared with a teacher or LLM.
