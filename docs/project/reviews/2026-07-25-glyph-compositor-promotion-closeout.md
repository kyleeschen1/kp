# Glyph compositor promotion closeout

Date: 2026-07-25
Run contract: `run-contract.kp.glyph-compositor-promotion-v1`
Proposal: `docs/project/reviews/2026-07-25-glyph-compositor-promotion-long-loop-proposal.md`

## Outcome

The approved 28-slice run is complete. The generic native-KaTeX scene
compositor now has evidence across:

- the original fraction merge and its inverse split;
- structurally different rational-exponent-to-radical notation;
- one query-selected gold reader card; and
- one compressed ten-operation completing-square presentation.

All promoted paths retain native KaTeX at settled endpoints. Interior material
is renderer-session-only cloned paint with no accessibility, annotation,
focus, link, Cloze, serialization, or export authority. The work added no
fraction-, radical-, operation-, viewport-, expression-, or card-specific
lifecycle or scheduler.

## Promotion decisions

| Area | Decision | Evidence boundary |
| --- | --- | --- |
| Endpoint handoff | Retain as a bounded known defect | Atomic ownership and track sampling are correct. The fraction plus clone keeps a repeatable source/target font-size mismatch; a common translation cannot correct it. |
| Inverse fraction split | Promote as experiment exemplar | Existing split, introduction, elimination, and structural rule tracks cover total paint with exact native settlement. |
| Radical succession | Promote as experiment exemplar | Existing glyph, rule, and path paint kinds plus existing lifecycles cover the complete structural change without path mutation or notation-specific timing. |
| Reader seam | Promote for one query-selected gold card | Canonical reader plans remain authoritative; compositor state is dynamically loaded, renderer-session-only, and absent from static and export artifacts. |
| Compound presentation | Promote as experiment exemplar | Ten canonical operations bind in order to ten generic scenes on one contiguous compressed clock with exact seek, rewind, and drill-down restoration. |
| Global rollout | Defer | The run intentionally proves exemplars and boundaries; it does not authorize family-wide reader routing. |

## Preserved boundaries

- Semantic assets and reader artifacts contain no DOM nodes, computed style,
  geometry, tracks, keyframes, or backend plans.
- Canonical lineage, not glyph equality or DOM order, determines identity.
- Native source or target DOM owns every settled frame.
- At most one inert material scene owns visible transit paint.
- The compositor retains five generic paint kinds and six existing atom
  lifecycles.
- Optional radical, compound, and reader integrations remain behind dynamic,
  query-selected seams.
- The static experiment controller remains under its frozen 40 KB source
  ceiling.

## Residual risks

1. The original `(x+y)/2` endpoint jerk is bounded but not eliminated. At
   `99.9%`, glyph and rule rectangles remain subpixel-close and the baseline
   residual remains within the recorded bound, but the persistent plus clone
   retains a roughly `1.43×` computed font-size mismatch. No generic correction
   was safe enough to apply.
2. Absolute reader route budget baselines were already stale before the
   one-card integration. A build of pre-integration commit `aa92d7f8`
   reproduces the failures. The integration delta remains below two percent
   and no compositor asset enters an ordinary reader route closure.
3. The promoted reader and compound paths are exemplars, not authorization for
   global routing. A broader rollout still needs a separately reviewed
   exemplar-to-family promotion.
4. The optional local dev-review API may log `502` noise when it is not
   running. Review-source audit remains byte-stable and this does not alter
   compositor assertions.

## Release evidence

- Full deterministic repository suite: 2,406 checks after the controller
  ceiling correction.
- Real-KaTeX Chromium compositor suite: 40 checks.
- Shared reader Chromium conformance: 9 routes.
- Stable glyph visual entrypoint: overview, dense endpoint, inverse split,
  radical, and compound wide/phone captures.
- Reader compositor visual entrypoint: wide/phone, full/reduced captures with
  nine owners and zero overflow.
- Reader gold parity: eight editor and eight reader named frames.
- Production build and all TypeScript projects.
- Glyph performance budgets, reader production closure, architecture gates,
  review-log audit, and Theseus workspace validation.

The absolute reader budget failure is recorded separately as pre-existing
debt and is not represented as a passing release gate.

## Recommended next work

1. Investigate the clone/native typography mismatch at the computed-style
   cloning boundary. Accept only one bounded scene-level model; do not add a
   fraction or plus-glyph exception.
2. Rebaseline reader route budgets in a separate audited maintenance change
   that explains the pre-existing growth across all affected routes.
3. If product rollout is desired, select one additional real reader family as
   the next exemplar and repeat the native-authority, static/export, responsive,
   and payload gates before generalizing.
4. Keep the current lifecycle and paint-kind vocabularies frozen unless a new
   structural exemplar proves that an existing category is semantically
   insufficient.
