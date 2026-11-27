# Editable inner product and projection

Date: 2026-11-27
Status: checked candidate; HUMAN_CHECKPOINT for the first editable presentation.
Execution: `run-contract.kp.inner-product-projection-20261127`.

## Outcome and boundary

An author edits two Euclidean R2 vectors and inspects linked notation and geometry:
component products, signed projection, and the perpendicular residual. Reuse
`compileKpVectorDotProjectionSemanticModel` and the existing eight-beat projection
sampler, rather than building another mathematical evaluator or timeline.
The existing catalogue artifact `animation.dot-projection.basic` remains intact.
Its graph labels and formulas are fixed to (4,2) and (1,1), so they cannot honestly
serve arbitrary inputs without a bounded new presentation adapter.

Canonical candidate: `/experiments/inner-product-projection/`, an independent
editable reference. Semantic authority is the existing vector projection compiler;
renderers are native KaTeX and the existing Graph2D/SVG coordinate projection.
The existing reader timeline clock owns play/pause/seek/reverse. The new adapter
formats the admitted model and reuses its sampled motion; it owns no math laws.
Coordinate inputs are integers from -1000 to 1000 in this first editor. Decimal,
nonfinite, empty and out-of-range drafts are explicit repair gaps. A zero target
is a meaningful undefined-projection state; a zero source is valid, with no angle.

Preserve all saved notebooks, accepted matrix/quadratic views, the old catalogue
fixture, shared styles and source contracts. No notebook schema migration, general
inner-product-space framework, arbitrary CAS, publication or model calls.
Rollback unit: the new route/adapter and additive shared sampler extraction.

## Explanation and medium choice

Assumed background: coordinate vectors and scalar multiplication. Question:
how much of a lies along b? A multiple p=alpha b should leave r=a-p perpendicular
to b. Substituting into r dot b=0 gives alpha=(a dot b)/(b dot b), for b nonzero.
The dot product is a scalar; p is a vector; neither should be mislabeled as the
other. Negative alpha reverses direction. Zero a is valid; zero b supplies no
direction. Numerical projection/residual coordinates are approximate.

Static baseline: both vectors, their projection and residual beside these formulas.
Motion's job is to track a's tip onto the target line and retain the perpendicular
remainder. Scrubbing reversibly exposes that correspondence, without moving the
original vector or pretending the moving point is a new mathematical result.
Component steps connect coordinate products to the scalar; text supplies the
orthogonality argument. Transfer question: reverse b—what changes? Alpha reverses
sign, but the projected vector stays fixed. Also compare perpendicular and zero
inputs. This is a review aid, not evidence of learning or retention.

## Packages and stopping rule

1. Source/model and sampling: admit editable bounded inputs, preserve domain
   diagnostics, reuse one pure sampler; test signs, zero cases, geometry laws,
   exact endpoints and reverse/direct-seek parity. Repair any demonstrated unsafe
   intermediate arithmetic at the compiler boundary, without changing its family.
2. One editable exemplar: shared theme/typography, local operation picker, native
   equations and graph, presets and one lifecycle-owned clock. Invalid drafts
   must never masquerade as newly admitted geometry. URL return carries inputs
   and a semantic beat, with strict parsing. No notebook persistence claims.
3. Verify and human review: focused unit/type tests, old sampler preservation,
   one Chromium visual command with desktop/phone/theme/seek checks, build and
   measured output size. Stop for presentation judgment before reusable promotion.

Budget: three hours, final 40 minutes reserved for verification and backup.
Commit coherent recoverable changes with evidence. Review checks whether signed
direction, scalar/vector distinction and perpendicular remainder are easy to see,
especially at narrow width. Promotion requires this acceptance and a separately
scoped second host; it is not part of this initial contract.

## Implemented candidate and review

Open `http://127.0.0.1:8000/experiments/inner-product-projection/`.

- Play or scrub: component products accumulate into a scalar, a moving point
  drops to the target line, then the residual rejoins the original tip.
  The source vector stays put. A dashed construction guide remains readable
  when paused or using reduced motion; guide and growing residual own disjoint
  portions of the same segment. The target's dashed arrow remains above its
  collinear multiple. No glyph motion or native compositor certification claimed.
- Choose Negative, Perpendicular, Zero a, and Zero b. Negative projection points
  opposite b; zero source is valid but has no angle; zero direction replaces the
  stage with an explicit explanation. Partial/unsupported drafts retain the last
  view and disable playback with an error message; they never enter the compiler.
- Open **Explore relationships**, M-x or C-x C-x. Search dot, projection or
  remainder. The existing floating row picker captures the current revision;
  stale commands cannot act on edited inputs. This is a local inspection list,
  not registration of a new notebook resource kind or generated concept library.
- Edit coordinates, select a step and reload. The URL retains admitted inputs
  and the semantic step, not an exact in-flight frame. No local-storage or
  cross-notebook subscription is implied. On narrow screens the content flows
  vertically; required content is not clipped to force viewport fit.

Review whether the scalar/vector distinction and perpendicular remainder are
clear, whether the compact graph is legible, and whether the eight existing
steps are useful at this scale. Presentation, pedagogical usefulness and wider
promotion remain human judgments.

## Verification and repaired invariants

The arithmetic owner now rejects unsafe integer products or squared lengths;
safe input components alone did not ensure exact intermediates. The model's
existing typed diagnostic result carries that failure. Property checks cover
484 signed input/direction combinations, reconstruction, collinearity,
perpendicularity and direction reversal. The sampler extraction preserves the
catalogue's eight phases and mirrored reverse samples; exact endpoints return
the original prepared values rather than re-interpolating them.

URL checks caught an ambiguous 3+1 coordinate split; each vector must now contain
exactly two values. Early browser checks caught phone select overflow and a
stale Pause label after visibility interruption. The host now bounds its control
width and repaints after the clock's non-publishing pause. The existing command
shortcut replaces an incomplete local prefix handler. The reduced-motion check
also caught an ambiguous test locator; it now targets the intended play control.
No failing check was suppressed or runtime error filtered out.

- `npm run test:inner-product-projection`: 17 passed, including the existing
  semantic, runtime, reverse and SVG catalogue checks.
- `npm run visual:inner-product-projection -- --project=firefox`: final six
  Chromium/Firefox checks passed without retries. Includes source edits,
  zero/negative cases, invalid-draft retention, stale command rejection, URL
  reload, 390px layout, both themes, reduced motion and simulated persisted-page
  events. Simulation does not certify real browser BFCache eligibility.
- `npm run typecheck`: full application/node/tests/Svelte/domains passed.
  Final `npm run typecheck:inner-product-projection` passed after the small
  control/guide repairs. `npm run check:architecture` passed with no exceptions
  added; `npm run test:project-vision`: 75 passed.
- `npm run build:inner-product-projection`: complete JS/CSS 102,065 gzip bytes;
  all 64 emitted files total 1,014,075 gzip bytes, including HTML and all bundled
  font formats. The build command emits this accounting reproducibly. These are
  per-file gzip estimates, not browser transfer, frame performance or memory.
  The isolated build transformed 38 modules. It adds no editor, model client,
  Three.js or new package dependency. The shared clock runs only during playback.

The new source route and presentation are a reversible exemplar, not a promoted
library API. Existing notebook schemas and catalogue source values are unchanged.
Resume with `theseus work context task.kp.inner-product-projection-20261127 --mode brief`.
