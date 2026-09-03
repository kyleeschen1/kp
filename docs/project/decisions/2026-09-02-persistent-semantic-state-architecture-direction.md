# Persistent Semantic State Architecture Direction

Date: 2026-09-02
Status: accepted direction; execution requires loop-specific approval

## Decision

After the current test-ledger, unit-scalar helper, and economics-parity
checkpoints, develop KP's next semantic authoring boundary as a persistent
semantic object graph with a scoped typed transactional facade.

The semantic model distinguishes persistent entity identity from immutable
versions, aggregate snapshots, contextual role bindings, authored aliases,
display labels, state occurrences, equivalence, and representation. An applied
semantic transformation owns typed inputs, persistent `before` and `after`
snapshots, an explicit change set, correspondence, assumptions, and
provenance. Arbitrary `at(progress)` values are deterministic ephemeral
evaluations rather than an unbounded series of committed states.

Authoring properties expose explicit operations for update, shared binding,
copy with lineage, and derivation. A scoped facade may provide read-your-writes
ergonomics, but plain assignment, JavaScript object identity, proxy-observed
access, and import order do not become semantic authority.

Derived values are pure dependency-backed computations. They may be evaluated
lazily and cached by their derivation and complete dependency-version tuple.
Reads and cache materialization are not events. Interpolation changes declared
independent drivers and recomputes affected requested descendants; semantic,
presentation-only, and discrete interpolation remain distinct.

## Sequencing

1. Restore or classify the stale repository-wide test ledger.
2. Complete the accepted unit-scalar helper and its API checkpoint.
3. Establish parity with the canonical exact-rational supply-tax model.
4. Prove identity, aliasing, copying, snapshot, branch, and endpoint laws.
5. Implement an explicit nonvisual persistent snapshot and transaction kernel.
6. Add the scoped typed facade and lazy dependency graph.
7. Add applied transformation state families and incremental interpolation.
8. Pressure the result with the canonical supply-tax transformation.
9. Add aggregate composition and stable timeline addressing.
10. Project one exemplar through Graph2D and KaTeX and stop for human review.
11. Add bounded knowledge declarations, procedures, and semantic macros.
12. Add generated mechanical plumbing and fixed-corpus LLM pressure.

The detailed preservation boundaries, acceptance criteria, and stop conditions
are recorded in
`../reviews/2026-09-02-semantic-state-architecture-sequencing-review.md`.

## Long-Loop Envelope

- Three long loops should reach the decisive nonvisual semantic market proof.
- Five should reach one visible, production-shaped reviewed exemplar.
- Seven should cover the complete recorded horizon through bounded knowledge
  objects, compositional procedures, semantic macros, generation, and LLM
  pressure.

The stale-ledger and helper preflight should remain focused short work. Later
contracts must be proposed and approved one at a time because each API and
human checkpoint may change the following loop. The estimate is a risk and
checkpoint decomposition, not a promised duration.

## Consequences

- KP gains a coherent basis for runtime reparameterization, direct historical
  recovery, structural-sharing animation, multi-object steps, and semantic
  provenance without replaying from genesis.
- Domain declarations own reusable derived truth; transformations usually
  update only independent facts.
- Ordered transaction journals may support diagnostics and procedure traces,
  but statement order does not silently become animation choreography.
- Renderer nodes, visual equality, and layout remain downstream projections.
- Broad ontology, CAS, theorem-prover, unit-algebra, global proxy store, and
  automatic motif inference work remain out of scope.

