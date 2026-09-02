# Semantic Topology Explanations Design

Date: 2026-07-21  
Status: exploratory design; implementation not yet authorized

## Summary

Topology is a strong pressure test for KP because its central lesson is a
change in what counts as meaningful. Metric measurements, angles, curvature,
and ambient appearance may vary while continuity, neighborhood structure,
connectedness, enclosure, and identification persist.

The design must distinguish rigorously between:

1. changing a topological space;
2. changing an embedding or geometric representation of the same space;
3. changing only the learner's projection or focus;
4. animating a proof or explanatory path through fixed semantic facts.

A visually smooth morph is not evidence of a homeomorphism. KP should treat
the difference between illustration, exact construction, provider-verified
claim, and proof obligation as first-class provenance.

## Explanatory Thesis

A topology explanation should teach the learner to stop asking primarily
about distance and shape and begin asking:

- which points are near each other in the topological sense;
- which subsets are open, closed, connected, or separated;
- which points or boundaries are identified;
- which maps preserve neighborhood structure;
- which loops or cycles can be deformed into one another;
- which invariants survive continuous change;
- where a purported transformation requires a cut, glue, pinch, tear, or
  singular event.

The recurring interpretive cycle is:

```text
show a familiar geometric object
-> vary irrelevant metric features
-> expose the preserved topological relation
-> perform one topology-changing operation explicitly
-> derive or inspect an invariant
-> return to the geometric object with a new criterion of sameness
```

## Semantic Objects

The initial topology pack should remain small and capability-based.

### Spaces and structure

- `TopologicalSpace`: carrier ref plus topology, basis, or construction
  provenance;
- `PointRef`: stable point or symbolic point family;
- `Subset`: point-set predicate or finite membership;
- `OpenSet`, `ClosedSet`, `BasisElement`, and `Neighborhood`;
- `Subspace`, `ProductSpace`, `QuotientSpace`, and `CoveringSpace`;
- `EquivalenceRelation` and `EquivalenceClass`;
- `Boundary`, `Interior`, `Closure`, and `LimitPoint`;
- `ConnectedComponent` and `PathComponent`.

### Maps and deformation

- `ContinuousMap` with domain, codomain, provider evidence, and caveats;
- `Homeomorphism` as a map, inverse, and continuity evidence in both
  directions;
- `Embedding` separated from the underlying space;
- `Path`, `Loop`, `Homotopy`, `Isotopy`, and `DeformationRetract`;
- `ProjectionMap`, `QuotientMap`, and `CoveringMap`.

### Combinatorial models and invariants

- `SimplicialComplex` or `CellComplex`;
- vertices, oriented edges, faces, cells, chains, cycles, and boundaries;
- Euler characteristic;
- connected-component count;
- winding number where defined;
- fundamental-group or homology result refs supplied by a verified provider;
- proof claims and counterexample refs.

KP should not become a general topology theorem prover. Exact finite models,
curated analytic constructions, and provider-backed invariants enter through
explicit preservation and evidence contracts.

## State And Representation Boundaries

The topology pack needs a strict separation among four records:

```text
TopologicalObjectState
  topology, identifications, maps, paths, invariants

EmbeddingState
  2D or 3D coordinates, camera, mesh, chart placement

ProjectionState
  visible subsets, neighborhoods, labels, quotient classes, proof focus

NarrativeFrame
  sampled attention, correspondence, annotations, layout, diagnostics
```

Moving a circle in 3D changes only its embedding. Stretching an interval while
preserving its order and neighborhoods may change only its representation.
Identifying interval endpoints changes the constructed space. Cutting a torus
changes the space unless the cut is explicitly a temporary representation of
a quotient polygon. The runtime and renderer must not infer these distinctions
from pixels.

## Topology-Native Relations

Candidate relations include:

- `is-open-in`, `is-closed-in`, and `is-neighborhood-of`;
- `contains`, `intersects`, `separates`, and `accumulates-at`;
- `identified-with` and `belongs-to-equivalence-class`;
- `maps-to` and `pulls-back-to`;
- `homeomorphic-to` and `homotopic-to`;
- `embedded-as` and `represented-by`;
- `lifts-to` and `projects-to`;
- `retracts-to` and `deformation-retracts-to`;
- `bounds`, `is-cycle`, and `represents-homology-class`;
- `preserves-invariant` and `changes-invariant`.

These relations own meaning. Highlight lines, deforming meshes, seams, trails,
and particles are renderer projections.

## Semantic Operations

Operations should distinguish representation changes from changes to the
space:

### Structure-preserving or representational

- `changeEmbedding(space, embedding)`;
- `applyHomeomorphism(space, map)`;
- `deformByIsotopy(embedding, isotopy)`;
- `showNeighborhood(point, basisElement)`;
- `pullBackOpenSet(map, targetOpenSet)`;
- `liftPath(path, coveringMap, startPoint)`;
- `retract(space, subspace, deformation)`;
- `subdivide(complex)`.

### Space-constructing or topology-changing

- `identify(pointsOrSubsets, equivalenceRelation)`;
- `formQuotient(space, equivalenceRelation)`;
- `attachCell(space, attachingMap)`;
- `glue(boundaryA, boundaryB, map)`;
- `puncture(space, pointOrSubset)`;
- `cut(space, subset)`;
- `collapse(subspace, targetClass)`;
- `addHandle(surface, attachmentData)`.

Any animated topology change should expose the operation and the instant or
region where ordinary homeomorphic deformation ceases to apply. A handle must
not appear through an apparently smooth deformation with no singularity,
attachment, or diagnostic.

## Views And Explanatory Projections

The same topology object can support synchronized views:

- ambient 2D or 3D embedding;
- neighborhood or basis view;
- quotient polygon and identification view;
- charts and overlap view;
- path and loop view;
- covering-space sheet view;
- simplicial or cellular complex;
- chain, cycle, and boundary ledger;
- invariant inspector;
- proof-claim and counterexample comparison.

The key value of synchronization is correspondence. A point selected on a
quotient polygon, torus embedding, covering space, or fundamental-domain view
should resolve through the same semantic point or equivalence class when that
claim is exact.

## Motion And Visual Motifs

Topology should have an elastic but disciplined visual grammar.

- `neighborhood-bloom`: a basis neighborhood opens around a point and remains
  linked through representation changes;
- `inverse-image-wash`: an open target region pulls back through a continuous
  map to an open source region;
- `boundary-zip`: identified boundaries approach and reconcile by declared
  equivalence classes;
- `seam-settlement`: a quotient seam loses special visual authority after the
  local neighborhood is shown to be ordinary;
- `loop-tighten`: a loop contracts while its basepoint and homotopy class stay
  inspectable;
- `obstruction-hold`: contraction stops because a puncture or excluded region
  blocks the homotopy;
- `cover-lift`: a path on the base traces simultaneously through a selected
  sheet of a covering space;
- `fiber-retract`: points travel along declared deformation-retract fibers;
- `chain-cancel`: oppositely oriented boundary contributions reconcile and
  cancel;
- `singularity-reveal`: a topology-changing event pauses and names the exact
  failure of ordinary deformation.

Geometric fluidity may support intuition, but settled diagrams, semantic
labels, exact correspondences, and provenance remain authoritative.

## Ergonomic Authoring

Authors should construct familiar spaces and state exact relationships rather
than enumerate points, mesh vertices, or animation paths.

```text
space I = interval(0, 1)
relation seam = identify(I.leftEndpoint, I.rightEndpoint)
space S1 = quotient(I, seam)

beat "make-the-circle" {
  focus: seam.equivalenceClass
  show: neighborhoods(seam.equivalenceClass)
  construct: S1
  preserve: interiorPoints(I)
  notice: "The two endpoint half-neighborhoods become one ordinary neighborhood."
}
```

KP derives the quotient map, equivalence-class correspondence, embedding
samples, seam motion, and accessible static diagrams. An author can override a
provider claim or layout, but should not place individual mesh vertices for an
ordinary explanation.

## Candidate Concept Rooms

### 1. Interval endpoints become a circle

Use a quotient construction, not an unexplained bend. Track interior points,
identify the endpoints, combine their half-neighborhoods, settle the quotient
seam, and compare interval versus circle invariants. This is the recommended
first exemplar.

### 2. Continuity through inverse images

Choose an open region in the codomain and reveal its inverse image in the
domain. Compare a continuous and discontinuous map. The explanation should
make the open-set criterion visible rather than merely showing a smooth graph.

### 3. Square boundary identifications

Use one square with typed, oriented boundary edges to construct a cylinder,
Möbius band, torus, or Klein bottle. Boundary arrows and equivalence classes
own identity; the 3D embedding is one projection and may be incomplete or
self-intersecting.

### 4. Loops around a puncture

Contract loops in the plane and punctured plane. Reveal why a loop around the
missing point cannot contract without crossing excluded material. Track
winding as a derived invariant where appropriate.

### 5. The circle's covering line

Synchronize a loop on the circle with its lifted path on the real line. Winding
becomes endpoint displacement. Repeated turns on the base remain distinct on
the cover.

### 6. Deformation retract

Retract an annulus to its core circle along declared fibers. Preserve the
subspace pointwise and expose the homotopy parameter and endpoint laws.

### 7. Homology as cycles modulo boundaries

Triangulate a small surface, orient cells, cancel shared boundary edges, and
compare cycles that are or are not boundaries. Keep the algebraic ledger
synchronized with the geometric complex.

### 8. Compactness, connectedness, and separation

Use finite covers, components, and separation witnesses rather than relying
only on surface deformation. These subjects will pressure-test set-family,
quantifier, and proof-witness projections.

## First Exemplar Contract

### Canonical reference

The closed interval with its two endpoints identified, producing a quotient
homeomorphic to the circle.

### Observable acceptance criteria

- The interval remains a valid searchable mathematical description before and
  after the animation.
- Endpoint identity changes only through the declared equivalence relation.
- Interior point identities persist through the quotient projection.
- The endpoint half-neighborhoods visibly reconcile into one quotient
  neighborhood.
- Bending the interval is labeled as embedding choreography; endpoint
  identification is labeled as the space-constructing operation.
- Seek, rewind, reduced motion, static steps, keyboard inspection, and screen
  reader narration preserve the same explanation.
- The final circle view links each displayed point back to its quotient class.
- No visual smoothness is presented as proof of homeomorphism.

### Preservation boundary

Preserve the current KP semantic object, transformation, shared-clock,
renderer-neutral frame, layout, provenance, diagnostic, and export contracts.
Do not introduce a topology-specific runtime or make a WebGL mesh canonical
semantic state.

### Rollback unit

Keep the initial topology fixture, quotient adapter, semantic frame, and one
renderer binding independently removable. Do not promote a universal topology
scene graph, motif family, or authoring schema before human review.

## Epistemic And Accessibility Requirements

- Label examples as illustration, exact construction, checked computation,
  theorem claim, or proof.
- Record assumptions and provider provenance for invariants and maps.
- Never use color, motion, depth, or ambient embedding as the only carrier of
  equivalence or obstruction.
- Provide static quotient diagrams, relation tables, and textual descriptions.
- Reduced motion should preserve operation order and semantic correspondence.
- A self-intersecting 3D projection must not silently imply a self-intersecting
  abstract surface.
- Sampled meshes must not pretend to establish global topological facts.

## Open Questions

1. Should the first topology provider use curated exact constructions only, or
   also a finite-complex computation library behind an explicit port?
2. How much set-family notation belongs in the learner view versus the
   inspector and proof view?
3. Should quotient classes be rendered persistently, or only during the gluing
   and neighborhood explanation?
4. Which topology concepts need WebGL, and which are clearer as SVG diagrams
   with exact selectable structure?
5. Can the material-continuity vocabulary used for symbolic expressions be
   reused for quotient settlement without implying that points are physical
   material?

