# Vector dot-projection exemplar contract

Date: 2026-08-02  
Status: implementation-ready; visual approval and promotion withheld

## Rank and canonical reference

`kp.promotion.vector-dot-projection` remains the sole rank-5 `next` item. This
slice does not mark it promoted and does not assign a canonical-format upgrade.
The existing `animation.dot-projection.basic` identity, graph capability pack,
family sample, catalogue URLs, shared clock, and native SVG host remain the
implementation base.

The current reference is mathematically valid but visually thin: it projects
`(3,4)` onto the x-axis vector `(4,0)`, uses raw SVG annotation text, inherits
the default flat graph profile, and exposes no indexed component-to-geometry
lineage. Those are bounded presentation/model gaps, not reasons to add a graph
engine or replace the asset identity.

## Exact semantic story

The exemplar uses

\[
\mathbf a=(4,2),\qquad \mathbf b=(1,1).
\]

The pair is deliberately non-axis-aligned, while every derived vector remains
integral:

1. pair components in index order: `4·1 = 4`, then `2·1 = 2`;
2. accumulate `a·b = 6`;
3. retain exact magnitudes `||a|| = 2√5` and `||b|| = √2`, so
   `cos θ = 3/√10`;
4. derive the projection scale `(a·b)/(b·b) = 6/2 = 3`;
5. form `proj_b(a) = 3b = (3,3)`;
6. retain the residual `a - proj_b(a) = (1,-1)` and prove
   `(1,-1)·b = 0`;
7. settle to the exact decomposition `a = (3,3) + (1,-1)`.

`src/animation/vector-dot-projection-exemplar-contract.ts` freezes those
values, exact LaTeX, eight beat identities, and six lineage obligations. The
renderer may format or position them but may not recompute the mathematics.

## Visual acceptance

- One synchronized symbolic/graph projection uses the existing shared clock
  and one native SVG paint owner.
- Component pairing is visibly indexed x then y and each pair remains linked
  to its vector geometry before accumulating into the scalar.
- Projection scale, projected vector, residual, perpendicular drop, and
  right-angle/orthogonality settlement stay explicit.
- The view adopts `kp.graph.dimensional-continuity.v1`: warm orthographic plane,
  sparse quiet-blue construction grid, role-based line hierarchy, and no fake
  depth residue.
- Every mathematical label is native inline KaTeX. Static values remain exact;
  any moving rounded display uses fixed two-decimal width, approximation
  notation, and exact semantic/accessibility truth.
- Direct seek, rewind, reduced motion, responsive density, static output, and a
  current nonvisual description preserve the same states.
- No WebGL request, second graph engine, universal scene graph, universal motif
  registry, or renderer-owned vector mathematics is introduced.

## Reference inventory and preservation

`src/architecture/vector-dot-projection-exemplar-inventory.ts` records the
seven exact implementation/reference paths and classifies each as preserve or
evolve. The protected boundary includes the animation and sample identities,
family definitions and laws, lazy graph pack, asset/runtime/clock contracts,
SVG host, persistent catalogue interaction, compact controls, URL selection,
Review capture, and rank-5 `next` status.

The smallest rollback unit is this semantic contract, inventory, conformance
test, and review document. Slice `s17` may evolve the existing asset/runtime
behind their stable identities. Slice `s18` is the separate reversible visual
exemplar. Promotion and generalization remain frozen until the consolidated
human checkpoint.
