# Linear-Map Placeholder Retirement Audit

Date: 2026-08-02
Asset: `animation.graph.vector.linear-map-scale`
Disposition: retain; reconsider only in approved slice 22

## Finding

The graph asset is not currently redundant with the generated matrix-vector
asset. Its metadata calls it a placeholder contract, but it remains the
canonical `family.linear-algebra.vector-add-scale` graph sample and owns
observable behavior that rank 6 has not yet replaced.

## Unique Evidence

| Role | Existing graph asset | Generated rank-6 asset before integration |
| --- | --- | --- |
| Mathematical example | diagonal scale `[[2,0],[0,3]]`, `[1,2] → [2,6]` | `[[2,1],[0,3]]`, `[4,5] → [13,15]` |
| Learner family | `vector-add-scale` | `matrix-vector` |
| Surface | Graph SVG | equation |
| Runtime | continuous path interpolation, exact rewind | row-ranked symbolic resolution |
| Semantic objects | Matrix, LinearMap, Graph2D, source/target Vector | expression objects |
| Duration | 1,600 ms | 2,400 ms |

The asset also remains a selected Graph SVG capability caller, has a stable
catalogue descriptor and URL, supplies a concrete renderer switch case, and
anchors exact asset, runtime, browser, family-registry, catalog, diagnostics,
and route tests.

## Retirement Gate

Slice 22 may reconsider this path only after the approved matrix-vector
exemplar has:

1. strict Matrix-to-LinearMap and basis provenance;
2. a graph target with exact vector interpolation and rewind;
3. a promoted catalogue descriptor and selected Graph SVG behavior;
4. replacement coverage for the `vector-add-scale` family or an explicit
   durable decision to retain that family as a distinct elementary example;
5. reference closure across the registry, generated catalog, renderer switch,
   capability host, browser checks, and review evidence; and
6. no unique semantic or conformance role remaining.

Until all six conditions pass, `placeholderContract: true` means “candidate
for later review,” not “safe to delete.”

## Rollback Unit

Any later retirement must be one independently reversible commit containing
the asset removal, registry/catalog regeneration, renderer/capability cleanup,
and replacement tests together. Rank-6 graph integration itself remains a
separate commit and must not delete this asset opportunistically.
