# Linear-equation Visual Baseline Audit

Date: 2026-07-19  
Status: captured for exemplar implementation  
Command: `npm run visual:linear-equation`

## Purpose

This audit fixes the three-reference comparison before visual implementation.
The capture command writes disposable screenshots and a manifest under
`tmp/codex/linear-equation-visual-baseline/`; screenshots are evidence for human
inspection, not pixel goldens or a replacement for perceptual review.

## Reference Roles

| Surface | What it establishes | What it does not authorize |
|---|---|---|
| Current linear room | Route, content, semantic IDs, URL behavior, and the intentionally plain regression baseline | Browser-default typography, spacing, controls, or discrete equation replacement |
| FTC learner surface | Warm paper/ink/accent relationship, centered footprint, editorial hierarchy, and a wide visual/narrow explanation proportion | FTC's control count, conceptual density, gradients, or route architecture |
| `x + 3 = 7` `continuity-v1` | Persistent material continuity, causal cancellation/derivation, native KaTeX settlement, deterministic scrubbing and rewind | Its editor chrome, diagnostics, authoring controls, or one-step content shape |

## Phase-by-phase Gap

| Phase | Current linear room | Canonical behavior to retain | Proposed exemplar behavior |
|---|---|---|---|
| Establish the whole | Unstyled headings, ordered links, mode links, and a small equation appear in browser flow with no unified visual field. | FTC presents one bounded conceptual surface with an immediate visual/text hierarchy. | One quiet paper surface shows the equation and balance together, with the explanation visible but subordinate. |
| Orient attention | Checkpoint focus exists only as structural classes; browser-default links dominate. | Continuity motion focuses the causal material without hiding persistent context. | Prose, equation, and geometry share a typed focus treatment keyed by semantic correspondence. |
| Subtract three | The room jumps from one exact frame to the next; the balance renderer only labels the operation. | `continuity-v1` introduces the operation, preserves continuants, meets/collapses cancellation, derives the result, and settles natively. | `-3` appears on both symbolic sides while three geometric units leave each pan in the same sampled phases. |
| Divide by two | The room jumps from `2x = 5` to `x = 5/2`; no fraction-building or grouping motion exists. | Canonical motion preserves identity and native endpoints rather than crossfading whole equations. | Both sides acquire matched fraction structure while geometry partitions into two exact groups and selects `x = 5/2`. |
| Review and revisit | Checkpoints are linkable, but only the active explanation is shown in Explore and the page has no playback or scrub affordance. | The existing runtime proves deterministic seek/rewind and meaningful checkpoints. | All prose remains browser-findable in document order while scroll, controls, and URLs seek one shared clock. |

## Preservation Check

- The audit does not modify the provider, trace, content artifact, room state,
  URL schema, projections, renderers, or legacy surfaces.
- Capture selectors are semantic runtime hooks already covered by browser tests.
- Future slices may compare structure and named states; they must not turn these
  screenshots into brittle pixel-equality gates.

