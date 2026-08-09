# KP Article V1

Date: 2026-08-09
Status: frozen v1 contract

## Purpose

`kp.article.v1` is a readable, portable Markdown profile for explanations
that coordinate prose with reusable semantic animations. It is deliberately
smaller than a page framework, layout language, or executable notebook.

The canonical authoring unit is one complete publishable article per Markdown
file. Passages and motion blocks are addressable regions inside that article,
not separate source files. Reusable animation behavior is imported.

## Ownership Model

```text
article Markdown
  owns prose, source order, sparse semantic associations
        |
        v
typed KpArticleDocument + source map
  owns validated derived structure
        |
        +--> plain Markdown/static checkpoint fallback
        +--> semantic HTML + KaTeX HTML/MathML + SVG
        +--> optional per-stage interaction manifests
        +--> stacked, split, deck, or future projections

vignette modules
  own objects, checkpoints, transitions, parameters, camera,
  attention defaults, static figures, and structural accessibility
```

The source Markdown and a dependency lockfile are canonical. Compiled IR,
HTML, figures, and manifests are reproducible build artifacts unless exported
as an intentional portable capsule or committed review fixture.

## Markdown Profile

KP Article v1 supports:

- CommonMark;
- GFM tables, task lists, strikethrough, and autolinks;
- fenced code blocks;
- inline `$...$` and display `$$...$$` TeX;
- YAML frontmatter containing one `kp` mapping;
- four closed KP container directives;
- standard Markdown links whose destination uses `kp-ref:`.

KP Article v1 does not permit MDX, Svelte components, raw executable HTML, runtime
JavaScript, or renderer/layout instructions. A future typed declarative `kp`
program and version-pinned prose inclusion remain separate proposals.

## Minimal Frontmatter

```markdown
---
kp:
  schema: kp.article.v1
  id: lesson.economics.demand-shift
  imports:
    demandShift: vignette.economics.demand-shift@1
---
```

Frontmatter contains machine-level identity and imports. Reader-visible title
and description remain ordinary Markdown. Human-readable major-version
imports resolve through the project lockfile to an exact version and content
hash; portable capsules embed that resolution. Upgrades are explicit and
editor-assisted.

## Stable Identity

Ordinary Markdown blocks need no IDs. A stage, motion, focus, navigable,
review-bearing, history-bearing, or externally referenced block receives an
explicit stable ID.

The editor proposes a readable slug from the first meaningful phrase or an
author label, then persists it. Moving or rewriting prose never regenerates the
ID. Collisions receive a deterministic document-local suffix. Full identity is
document-scoped:

```text
lesson.economics.demand-shift#follow-demand
```

Copying a block to another document may retain the local ID because the
document namespace changes. Renaming an ID is an atomic reference-aware
refactor. The readable name is an ergonomic handle, not semantic authority.

## The Four Directives

KP directive schemas are closed and typed. Unknown KP directives or attributes
are preserved in draft text but fail validation and publication.

### Stage

`kp-stage` creates one continuous article-local instance of a reusable
vignette. Its source position defines the inline/static fallback position and
the point where the stage enters explanatory context; it does not specify
layout.

```markdown
:::kp-stage{#market use=demandShift}
:::
```

A different independent copy requires a different alias. Later blocks refer
to the same instance. Simple instance parameters may appear on the stage;
complex configuration belongs in a named vignette preset.

### Passage

`kp-passage` identifies an ordinary explanatory region only when stable
identity or sparse editorial metadata is required.

```markdown
:::kp-passage{#interpret-shift intent=interpretation claims=econ.demand.ceteris-paribus}
The curve has moved; the axes and supply schedule have not.
:::
```

`intent` is optional editorial, review, or LLM metadata. It cannot change
layout or runtime behavior. `claims` optionally references an external
verified-claims registry; evidence records do not live in article prose.

### Focus

`kp-focus` explicitly declares passage-level attention. Inline references do
not silently become focus authority.

```markdown
:::kp-focus{#read-curves stage=market target="market/demand market/supply" context="market/axes"}
Compare the two schedules before anything moves.
:::
```

Targets receive primary attention and context remains structurally available.
The selected projection decides how to express that relationship.

### Motion

`kp-motion` runs one named vignette transition. The vignette normally owns its
checkpoint endpoints:

```markdown
:::kp-motion{#raise-demand stage=market run=market/shift-demand}
At the same price, buyers now demand a larger quantity.

::after

The new intersection occurs at a higher price and quantity.
:::
```

The body before `::after` stays visible for the transition. The optional after
slot appears once the settled checkpoint is reached. Both remain ordinary,
searchable Markdown rather than attribute strings. A partial transition may
declare an explicit checkpoint range; article blocks do not redefine a
vignette's choreography. Each motion block is a semantic unit and therefore
cannot be split by a deck projection.

## Inline Semantic References

Inline object references use standard Markdown links:

```markdown
Watch the [price axis](kp-ref:market/price-axis) while demand moves.
```

The compiler emits a real stable fragment link for static output. Hover or
keyboard focus previews attention; click or tap pins it. Ordinary `kp-ref:`
links never change timeline state. A deliberate checkpoint reference or a
`kp-motion` directive owns time changes.

## Vignettes And Reuse

Reuse has three levels:

1. An animation asset owns semantic objects and transformations.
2. A vignette owns a named reusable projection or preset: asset identity,
   checkpoint ranges, parameters, camera, salience defaults, static figures,
   and accessibility defaults, but no article prose.
3. An article instance supplies local prose and refers to the vignette through
   a stage alias.

An article may select a range, parameters, pacing, and attention within the
vignette contract. Materially different choreography receives a new vignette
identity. Re-explanation creates a new article with new document and passage
IDs, imports the same vignette, and records provenance. Share/extract produces
a compiled portable capsule, not a fourth mutable source.

Future prose transclusion, if added, must be explicit, version-pinned,
compile-time, statically rendered, searchable, and detachable. It is not part
of KP Article v1.

## Compilation And Portability

The framework-neutral preprocessor produces a typed `KpArticleDocument` and
source map, then may emit:

- ordinary Markdown with meaningful static checkpoint expansion;
- semantic searchable HTML;
- server-rendered KaTeX HTML plus MathML;
- static SVG or equivalent checkpoint figures;
- optional interaction manifests, one per stage.

Vignettes declare the small static checkpoint set required to explain each
motion, normally initial and settled. Plain Markdown and static HTML receive
those figures with before/after prose in source order. The article does not
repeat frame definitions.

Existing Hugo, Jekyll, Eleventy, Astro, Pandoc, unified, and similar pipelines
can run the KP preprocessor before their normal Markdown stage. A pipeline that
does not understand KP directives may display them literally; portability
requires the CLI or an adapter rather than pretending the extension is plain
CommonMark.

Static HTML is complete before enhancement. Interaction manifests activate
only when a stage is directly addressed or approaches the viewport. No article
requires a Svelte application shell, article-wide hydration, or a live KaTeX
runtime.

## Math

TeX source is canonical. Shared macros are versioned project configuration.
The preprocessor renders KaTeX HTML and MathML at build time, so ordinary pages
ship no KaTeX runtime. Interactive symbolic manipulation may separately load a
typed math-AST adapter without changing the article format.

## Accessibility

Every vignette supplies a reusable accessible name, semantic summary, and
static checkpoints. An article may override its contextual label without
duplicating the structural description. Internal drafts warn when required
fallbacks are absent; public builds fail. Reduced-motion projections seek
directly between checkpoints instead of replaying choreography.

## Projections

The article encodes semantic intervals and relationships, never viewport or
layout mechanics. A deck derives boundaries as follows:

- each `kp-motion` is one motion scene;
- contiguous ordinary prose is a reading scene;
- headings begin sections;
- a projection may merge adjacent reading scenes for fit;
- no projection may split a motion block or change its semantic checkpoints.

Stacked, split, deck, static, and future layouts consume the same IR and stage
manifests. Layout-specific source copies are forbidden.

## Editing And Validation

The CodeMirror editor operates on the complete canonical Markdown file. It may
fold a directive header into a readable summary while retaining one source
buffer, undo history, and Vim command history. Completion, diagnostics, hover,
go-to-definition, reference search, rename, formatting, and code actions live
in a framework-neutral language service with an LSP-capable boundary; editor
clients apply ordinary source-mapped text edits.

Every keystroke is recoverably preserved as a draft. `:w` validates and
promotes only a valid document; invalid source keeps the last-valid sidecar
preview and source-located diagnostics. `:wq` closes only after successful
promotion. `:q` warns when the draft differs, and `:q!` abandons it.

Formatting on valid save is intentionally narrow: it may canonicalize
frontmatter key order, directive attribute order and quoting, directive header
shape, and references affected by an explicit refactor. It never reflows
prose, rewrites TeX, or reorders lists.

Prompts, model output, confidence, review history, and invalid drafts remain in
sidecars keyed by stable IDs. Only approved prose and sparse authorial metadata
enter Markdown; public compilation never depends on an unpromoted sidecar.

## Source-Noise Budget

- Ordinary prose carries no KP markup.
- A typical interactive passage adds at most one opening and one closing
  directive.
- Complex configuration moves to a vignette or named preset.
- KP metadata should remain below roughly 25 percent of meaningful lines in a
  representative article; the frozen economics exemplar measures 24.4 percent.

## Versioning And Failure

KP Article v1 is a closed schema. Draft tooling preserves unknown syntax losslessly but
reports it as an error; canonical saves and publication accept only recognized
directives, attributes, references, and dependency resolutions. Future forms
require a schema update and explicit migration. Generated IR or HTML never
becomes a fallback authoring source.

## Golden Example

```markdown
---
kp:
  schema: kp.article.v1
  id: lesson.economics.demand-shift
  imports:
    demandShift: vignette.economics.demand-shift@1
---

### When demand changes

Price and quantity settle where the two schedules meet.

:::kp-stage{#market use=demandShift}
:::

:::kp-focus{#read-curves stage=market target="market/demand market/supply" context="market/axes"}
Watch the [demand schedule](kp-ref:market/demand) while supply stays fixed.
:::

:::kp-motion{#raise-demand stage=market run=market/shift-demand}
At the same price, buyers now demand a larger quantity.

::after

The intersection settles at a higher price and quantity.
:::

The picture does not say why demand changed; that explanation belongs in the
surrounding argument.
```

## Promotion Evidence

The economics exemplar passed human review and proved:

- readable raw source and source-noise compliance;
- deterministic parse, validation, IDs, source maps, and lock resolution;
- static Markdown and semantic HTML/MathML/SVG fallback;
- lazy interactive and deck projections from the same IR;
- direct links, text search, TOC, and accessible behavior;
- CodeMirror editing, diagnostics, completion, draft recovery, and valid save;
- no learner-visible regression against the current economics reference.

The schema was frozen as `kp.article.v1` on 2026-08-09. The temporary importer,
legacy Markdown/JSON authorities, compatibility compiler, passage-buffer draft
model, and legacy save endpoint were retired in the same promotion slice.
Future syntax changes require an explicit schema version and migration; they
must not silently broaden v1.
