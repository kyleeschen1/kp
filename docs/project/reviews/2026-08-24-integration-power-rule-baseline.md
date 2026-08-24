# Integration power-rule exemplar baseline

Date: 2026-08-24  
Status: Frozen pre-change evidence for approved run slice 01

## Canonical path

- Artifact: `animation.generated.calculus.integral.power-rule-quadratic`
- Host: Internal Studio Catalogue equation session
- Renderer: Native KaTeX equation adapter on the shared semantic playhead
- Semantic source: `src/semantic/generated-calculus-problem-fixture.ts` and
  `src/semantic/antiderivative-power-rule-semantics.ts`
- Approved target sequence: `\int x^2\,dx` to
  `\frac{x^{2+1}}{2+1}+C` to `\frac{x^3}{3}+C`

The existing row is the exemplar under revision. A matching asset ID in a
generated projection does not create a second canonical host.

## Pre-change behavior

The unreviewed implementation currently renders
`\int 6x^2\,dx` to `\frac{6}{2+1}x^{2+1}` to `2x^3+C`. Its first transition
uses generic copy fan-out, its second uses generic merge fan-in, and `+C` is
introduced only at the terminal state. The renderer has no explicit
integration operator-scope policy.

This snapshot records what the run is replacing; it is not a compatibility
contract. The stable compatibility boundaries are the asset ID, canonical
Catalogue host, shared clock, semantic authority path, and native KaTeX
ownership.

## Preservation fence

The approved derivative reference remains
`animation.generated.calculus.derivative.power-rule-x-cubed`. Its semantic
selectors, renderer-owned outline, timing, migration, and native endpoints are
protected. The singular evaluation-authority callers and certificates are
also protected while the integration exemplar adds two bounded evaluation
cohorts.

User-owned economics edits, `tests/editor-animation-visuals.browser.spec.ts`,
unrelated documents, gallery behavior, Scheme, and the global application
theme are outside this run.

## Baseline verification

- `npm run test:integration-power-rule`
- `npm run test:differentiation-exemplar`
- `npm run test:evaluation-authority-convergence`

The integration command is deliberately scoped to the existing fixture,
semantic map, selector-annotated KaTeX, imported animation, and terminal
migration seams. Later slices may extend it, but must not replace these checks
with a visual-only assertion.
