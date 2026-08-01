# Animation Catalogue Related-Context Inventory

Date: 2026-07-31
Status: frozen baseline for catalogue simplification slice s05

## Purpose

This inventory measures how one concrete animation identity expands across
editor descriptors, Workbench relationships, learner surfaces, display
representations, diagnostics, review, and project-control evidence. It fixes
the boundary between a catalogue row and its related context before the
asset-first projection is built.

Related context remains useful and addressable under Details. It cannot create
a catalogue row, choose a host, imply review, or override derived health.

## Measured Baseline

The 33 concrete loadable animation IDs currently expand into:

- 50 editor descriptors: 33 required asset descriptors plus 17 family/sample
  discovery descriptors;
- 69 Workbench representation relationships;
- 74 display representations attached to those concrete IDs; and
- 7 additional display entries labelled playable that do not resolve to a
  concrete loadable asset ID.

The 74 concrete display representations break down as follows:

| Kind | Count | Current meaning |
| --- | ---: | --- |
| Editor | 52 | 50 descriptor routes plus two focused editor hosts |
| Card | 17 | Family/sample projections over concrete assets |
| Reader | 3 | Solve-x, distribution-area, and radical reader contexts |
| Diagnostic | 2 | Solve-x and radical reconciliation contexts |
| Concept room | 0 | No concrete display relationship in the current projection |
| Static | 0 | No concrete display relationship in the current projection |
| Export | 0 | No concrete display relationship in the current projection |

Every concrete asset has at least one display context, but the distribution is
uneven: 15 assets have one, 2 have two, 13 have three, distribution expansion
has four, radical rewrite has five, and solve-x has seven.

## Solve-x Exemplar

`animation.linear-solve.solve-x` has the widest current context fan-out:

- 3 descriptors, including 2 family/sample descriptors;
- 6 Workbench representation relationships; and
- 7 display contexts: 3 editor, 2 card, 1 reader, and 1 diagnostic.

This is context sprawl around one animation, not seven animation choices. The
new shell should select the asset once and expose these routes only as linear
Details. Its primary stage continues to use the existing equation adapter.

## Display-only Playability

The following display entries are labelled playable but are absent from the
concrete lazy-loadable registry:

- `animation.divide-both-sides.solve-3x-equals-12`
- `animation.foldable-distribution.collect-like-terms`
- `animation.fraction-composition.two-thirds-solve`
- `animation.fractional-linear.solve-x-over-2`
- `animation.fractional-linear.x-over-2.balanced-proof`
- `animation.fractional-linear.x-over-2.fluent-projection`
- `animation.numerator-split-merge.round-trip`

These identities remain useful reader and compatibility evidence. They do not
become catalogue rows, and this tranche does not silently reparent them to a
different concrete asset. Their existing routes remain available until a human
audit decides whether to preserve, merge, port, or retire them.

## Ownership Boundary

The asset-first projection will use these authorities:

1. The loadable registry exclusively owns catalogue membership and the
   primary descriptor ID.
2. Primary descriptor metadata supplies title, summary, domain, tags, and
   fuzzy-search material. Family IDs, sample IDs, motifs, transformations, and
   capabilities are metadata, not peer representations.
3. The generated display catalogue supplies lightweight addressable contexts
   for an exact concrete animation ID. It cannot assert native hostability.
4. Surface-adapter resolution separately owns hostability.
5. Review notes, human disposition, roadmap state, promotion, and Theseus
   control remain separate evidence facets. The current default Workbench
   projection contains no review notes, so absence there must not be rendered
   as a review conclusion.

The production catalogue must not import the source-rich Workbench builder to
recover context already present in generated metadata. That would pull project
control records and promotion machinery back into the default browsing path.

## Projection Rule

A catalogue row will contain only one concrete asset identity. Related contexts
are grouped by exact `animationId`, deduplicated by context ID, and shown under
Details. Empty context groups disappear. Context labels or availability cannot
be promoted into top-level playability, health, review, or disposition.

This inventory changes no route, renderer, runtime, review record, or visual
behavior.
