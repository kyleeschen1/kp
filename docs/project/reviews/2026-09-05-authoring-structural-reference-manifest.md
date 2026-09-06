# Structural authoring reference and preservation manifest

This is source/reference evidence for the approved structural-authoring loop,
not executed certification of the new integration. The focused assertions are
`tests/authoring-structural-references.test.ts`.

## First caller: distribution

- Canonical host: `/reader/fraction-composition/`, declared in
  `src/reader/app/equation-lesson-descriptors/fraction-composition-host-provenance.ts`.
- Asset: `animation.fraction-composition.two-thirds-solve`, constructed by
  `src/animation/fraction-composition-equation-adapter.ts`.
- Semantic truth: `createKpLawfulFractionSolveMacro`, with its existing verified
  fraction-distribution composition. Preserve structured `left`/`right` trees;
  rendered LaTeX is not a replacement semantic tree.
- Exact step: `fraction-solve.step.distribute`, from
  `fraction-solve.state.factored` to `fraction-solve.state.distributed`.
- Expression: two thirds times the grouped x-plus-six sum equals ten, to the
  two distributed products equals ten. This is not the later fraction-numerator
  normalization or an arithmetic simplification.
- Authored lifecycle/correspondence: three fan-outs (numerator, denominator,
  fraction rule), retained operands/context and two removed parentheses in
  `src/semantic/fraction-composition-equation-asset.ts`.
- Presentation: existing copy-fan-out and opaque structural fraction paint.
  Native endpoints own settled typography; only the canonical material session
  owns active transition paint. Preserve stage layout and the reader clock.
- Host descriptor: `src/reader/app/equation-lesson-descriptors/fraction-composition.ts`.
  It binds existing annotated structural anchors and the certified stage layout.
- Prior machine evidence: fraction-composition canonical-session dry-run and
  semantic-reader fraction-composition browser suites. Dry-run totality does
  not certify realized paint continuity for the new integration.

Phase comparison: source is the canonical factored native endpoint; transition
uses the existing copy fan-out with declared lineage; target is the canonical
distributed native endpoint. Proposed behavior is identical presentation fed
by aggregate-backed authored state. Any visual deviation needs explanation
and, if subjective, a new decision rather than a hidden tolerance change.

## Second caller: carrier-preserving simplification

- Reference: `operation-evaluation.two-times-one-carrier`, `2 × 1 -> 2`.
- Semantic source: `src/semantic/carrier-preserving-simplification-exemplar.ts`;
  explicit multiplicative-identity evidence is verified by the existing
  carrier-preserving evidence verifier before recipe construction.
- Canonical registered surface:
  `editor-animation-surface.operation-evaluation.carrier-preserving-simplification`.
- Host adapter: `src/editor/carrier-preserving-simplification-surface-adapter.ts`.
  Native binding, motion and settlement stay with the existing
  `src/rendering/native-katex-carrier-preserving-simplification-*` owners.
- Source and target carriers intentionally have different occurrence IDs.
  The identity record, not glyph equality, establishes continuity; the operator
  and identity witness have explicit removal records.
- Release authority: `src/architecture/carrier-preserving-simplification-release-approval.ts`.
  Its two-caller approval is bounded; it is not permission to support a third
  identity operation or replace the renderer.
- Executable preservation command: `npm run test:carrier-preserving-simplification`;
  runtime command: `npm run visual:carrier-preserving-simplification`.

Phase comparison: native source, surviving carrier with removed-syntax motion,
then native target. Proposed integration must retain these phases and their
exclusive ownership. Distribution success does not certify this different
ownership topology.

## Shared preservation and rollback

Keep semantic trees, proof/capability authority, state-local occurrences,
correspondence, persistent history, and presentation owners distinct. No new
parser, universal AST, global registry, clock, compositor, glyph-specific
offset, or same-cardinality safety bypass is authorized. A selection path is
not entity identity. Unsupported correspondence returns a typed repair gap.

The existing canonical pages remain untouched while the new integration is
proved. The rollback unit is each new adapter or caller commit, not the semantic
kernel or canonical renderer. G1 reviews the distribution integration before
the second caller. G2 precedes economics migration.
