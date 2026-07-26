# Canonical equation cross-family composition proof

Date: 2026-07-25  
Run contract: `run-contract.kp.canonical-equation-renderer-convergence-v1`  
Proposal: `docs/project/reviews/2026-07-25-canonical-equation-renderer-convergence-long-loop-proposal.md`

## Outcome

Slice 25 passes. Fraction merge, inverse fraction split, and radical
succession all run through the same ephemeral native-KaTeX renderer session,
the same five paint kinds, the same six lifecycles, and the same reversible
clock. No notation, operation, viewport, route, or card dispatch was added to
the scene runtime, and no additional family was enabled by default.

The approved consolidation also closes three generic defects found during the
proof:

- all material clone paths now use one recursive authority-stripping utility;
- lineage-backed merge and split tracks stay fully opaque while geometry
  fuses or bifurcates; and
- counter convergence preserves the whole source expression—including its
  operator—on one ordered inline band, with bounded opacity change and
  protected-continuant clearance.

The last rule corrects the retained solve-x `7 - 3 -> 4` readability issue
without routing that legacy transition through a second renderer.

## Programmatic guarantees

- Material clone roots are inert and descendants cannot retain IDs, links,
  form/interaction attributes, ARIA, event handlers, or `data-kp-*`
  authority.
- Every lineage-backed merge or split paint track has opacity `1` at every
  sampled frame. Introductions and eliminations retain their distinct
  lifecycle behavior.
- The successor readability evaluator checks baseline drift and expression
  order for all visible source marks.
- The successor continuity evaluator bounds adjacent-frame opacity changes.
- Browser evidence follows the visible owner across clone-to-native handoff,
  so endpoint settlement cannot masquerade as a disappearance in the gate.
- Direct seek and rewind reproduce the same scene state.

These checks make the observed defect categories rejectable in CI. They do not
claim that all future visual defects are impossible; a new category can still
require a new law after exemplar review.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/native-katex-rendered-scene.test.ts tests/successor-synthesis.test.ts`
- `node --disable-warning=ExperimentalWarning --test tests/canonical-equation-renderer-convergence.test.ts tests/semantic-reader-equation-scene-compositor-adapter.test.ts tests/semantic-glyph-reconciliation-radical.test.ts tests/kp-radical-material-continuity.test.ts tests/kp-radical-native-settlement.test.ts`
- Chromium clone-authority and reader material-layer suites: 6 passing checks.
- Chromium inverse fraction split: passing, including full-opacity split
  tracks.
- Chromium dense successor visual gate: 3 passing checks across desktop and
  phone, forward and rewind.
- `npm run visual:glyph-reconciliation-experiment`
- `npm run visual:reader-gold-parity`
- Production build and all TypeScript projects pass through the visual
  entrypoint.

Manual inspection confirms the corrected fraction handoff remains aligned,
the inverse split keeps both denominator rules visible, and the solve-x
convergence reads as `7 - 3` on one line before settling to `4`.

## Scope boundary

This is a composition proof, not family-wide rollout. Native settled DOM,
semantic assets, accessibility, static/export artifacts, and default routes
remain the authorities established at the reader checkpoint. The next slice
tests whether governed LLM-authored semantics can reach this same session
without acquiring fragment, geometry, timing, style, or mathematical
authority.
