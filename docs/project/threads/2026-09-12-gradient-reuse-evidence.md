# Gradient reuse: author and reviewer notes

Canonical host: <http://localhost:8000/experiments/kinetic-figure/gradient-contour/>.
Preserved reference: <http://localhost:8000/experiments/kinetic-figure/surface-contour/>.
Execution: `run-contract.kp.gradient-contour-intuition-v1`; this note records
delivered boundaries, not a second slice-status tracker.

## Source-only authoring

Open **Edit the bounded source** below the lesson. Load the unequal-slope draft,
then choose **Apply source**. Editing alone does not replace the live lesson.
The example is `2x²+y²` at `(0.75, 0.5)`: height `1.375`, gradient `(3,1)` and
greatest directional rate `sqrt(10)`. Restore the original using the same editor.
The applied JSON can be copied and pasted for a roundtrip. Invalid drafts preserve
the current lesson and exact playhead; valid Apply deliberately returns to step 1.

The mathematical checker supports positive coefficients from 0.25 to 4 and
coordinates from -1.5 to 1.5. This **explanation** is narrower: positive x and y,
height from 0.25 to 4, and successful existing stage fit. A stationary point, other
quadrant, unsupported field or fit failure returns a located repair. Mathematical
validity alone does not establish an authored explanation or visual support.

`gradient-contour-authoring.ts` compiles a branded lesson with one checked model,
sequence and stage authority. `quadratic-field.ts` supplies the same expression
to native surface paint, notation, level-set sampling and camera-fit geometry.
The overlay uses the existing canonical stage camera; variant poses derive the
gradient direction and contour origin rather than reusing primary angles.
The reviewed primary prose is retained, while numeric and compass-specific
claims are rebound for the unequal-slope caller. No new renderer, clock, server,
global salience store or arbitrary-field generator was introduced.

## Evidence and limits

- `tests/gradient-contour-authoring.test.ts`: field/paint agreement, contour and
  derivative laws, source roundtrip, primary preservation and rejected cases.
- `npm run visual:gradient-contour`: real Apply, invalid retention, one live canvas,
  primary controls and attention, reference route, typography and all 19 passages
  at desktop/phone widths. Screenshots are disposable, not approved goldens.
- Full type checking is required at the commit boundary; actual run results are
  in Theseus. Broad release checks remain the G6 obligation.

This required bounded engine/adaptor work because the original stage was fixed
to one field. Subsequent supported coefficient/point edits are source-only.
The browser checks do not establish learning efficacy or certify physical Safari
trackpad history gestures. The first variant reuses the accepted visual treatment;
no catalogue-wide visual promotion is implied.
