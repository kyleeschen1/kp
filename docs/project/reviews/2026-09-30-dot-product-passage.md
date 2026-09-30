# Three pairs, one dot product

Status: standalone candidate ready for visual review; rectangular integration
and the source-only authoring proof remain conditional on acceptance.
Authority: [approved authoring proof](2026-09-30-matrix-authoring-next-step.md).
Execution: `run-contract.kp.matrix-authoring-v1`, first of three packages.

Open [Matrix explorations](http://localhost:8000/experiments/matrix-examples/)
and choose **Three-term dot product**. Use Next to inspect Vectors, Pairs,
Products, Addition and Sum. The [standalone host](http://localhost:8000/experiments/dot-product-passage/)
supports the same milestones and hash restoration.

The source is the row covector `[2, −1, 3]` applied to the column vector
`[4; 5; −2]`. The user requested a replacement for sequential copy arrivals:
move both objects so the column's lower-left meets the row's upper-right,
fade the brackets during departure, then tilt the column into the paired expression while
spreading the row entries. The local presentation measures native KaTeX boxes
for docking and pair slots for arrival. The latest user-requested trial replaces
independent concave-up paths with a coordinated pivot: all column entries stay
on one straight axis with a shared angle and pivot. Spacing expands along that
axis to fit the factor slots; glyphs remain upright. Quintic easing starts and
ends the turn with zero velocity and acceleration. The row opens earlier and
is already in its final slots before the column reaches horizontal. The unit
settles downward later in the turn to clear the opening row. This is a layout
transformation, not a mathematical rotation of the vector. The source
representations are consumed by this rearrangement; immutable references remain.
The Pairs endpoint contains operands only. In the next beat multiplication
syntax grows in, holds briefly, then evaluation begins. Centered dots replace
crosses; muted parentheses enclose each entire product, not individual negative
factors: `(2·4)`, `(−1·5)`, `(3·−2)`. Dot and enclosure enter together after
matching and are consumed with the operands. Each pair uses the canonical contributor-fusion
optical sampler: its two operands and product syntax gather into nonzero
ink, then the derived value emerges in the same slot. In the separate Addition
beat plus signs appear to form `8 + −5 + −6`; only the later Sum beat consumes
them. This intentionally supersedes the earlier always-present addition signs.
Pair terms use their native widths with a 0.25em gap;
product slots retain those widths. The products
then gather with those signs through a second contributor fusion into `−3`. Review the
clarity of pairing, the product replacement, and the final sum's timing.

Notation trial: KaTeX `left`/`right` delimiters enclose a native matrix with
explicit internal padding, rather than manually drawn bracket characters.
Operators use 0.85em sizing and the shared theme-aware muted ink token; parentheses
retain full math sizing and muted ink. Matrix brackets
use the same muted ink. Signed scalar values retain normal number styling.
The bracket-only source shells fade continuously while material entries move.

The local model accepts the original `MatrixProductCell`. A 1×3 row times a
3×1 column supplies the standalone dot relationship through `matrixProduct`.
The passage retains the exact cell, dot, operand, pair-product and result
objects. Pair copies are occurrences of the original operands; evaluation
introduces distinct derived IDs. No renderer arithmetic or new math engine.
Finite immutable three-term numerical cells are supported for this review;
other lengths, nonfinite values and mismatched references throw `DotPassageGap`.

Native KaTeX owns static endpoints. The existing computed-style material
helpers, authority stripping and reader timeline clock own copying and time.
Presentation/configuration stays local to this experiment. Reflow remeasures
untransformed native slots before restoring the current semantic playhead.
Shared layout, spacing and motion settings apply through the existing host.
The accessible calculation and no-script text preserve the explanation.

The new local `fusion.ts` adapter projects the existing
`sampleKpNativeKatexContributorFusionPaint` onto measured native DOM fragments.
There are no copied optical thresholds or new arithmetic values. The three
multiplication cohorts and the later addition use the original dot references;
operators participate as catalysts. Native endpoints, reset/remeasure and the
existing clock remain local owners. This reuses the canonical optical treatment,
but does not mint evaluation certificates or traverse the full certified scene
compositor. Do not describe this experiment as compositor-certified. That
integration remains distinct from this user-requested visual trial.

Checks after the requested notation and beat-separation revision: four focused
semantic/preservation tests; two scoped Chromium tests
with five endpoints, ten transit captures, source IDs, native handoff, actual
playback, reverse seek, layout reflow, instant steps, reduced motion and phone
overflow. Corner docking and exclusive source/material presence now have
explicit checks. Endpoint, docked, transit and side-layout images were inspected.
The prior simultaneous-copy crossing regression remains guarded by sampled
scalar-box overlap checks, without claiming continuous collision certification.
Visual inspection caught a wrapper-box docking gap and a clipped top entry in
the side layout. Measuring KaTeX's native base fixes the docking boundary;
reserving the same vertical tilt room in both layouts fixes the clipping.
Tests assert corner alignment and side-layout material containment. The latest
checks sample both evaluations before and after the fusion handoff, require a
nonzero visible fragment in each cohort, and verify that addition signs wait
until multiplication has completed. Separate checks cover fractional bracket
opacity during departure and multiplication syntax absent at Pairs but visible
before fusion. Initial, Pairs, multiplication-hold and Addition images were
inspected for the notation changes.
Eight additional handoff images were captured; four representative frames were
inspected directly. These DOM geometry/presence
checks are not raster-level continuity certification. A test initially supplied
trailing-zero strings rejected by Playwright's range-input fill; normalizing the
numeric strings fixed the harness and both scoped browser tests pass again.
Previous
checks also assert column collinearity during the turn and that row entries
reach their final slots while the column is still tilted. The initial pivot
trial caught bottom-entry overlap with the opening row; delaying the shared
pivot's descent repaired it without changing the straight-axis constraint.
The previous
regressions now check addition-sign introduction after multiplication
and compact inter-term gaps. The first new test run used an invalid range-input
step for the exact endpoint; it now selects that endpoint through the milestone
control, while still sampling intermediate multiplication poses through the slider.
Full types (including zero Svelte errors/warnings) and the standalone build pass
again for this correction. Before this correction, architecture, the standalone
multi-entry build and three changed-inventory checks pass, as do the eight
previous example/menu browser checks. The full typecheck was unusually slow
but completed successfully without changing checking scope or budgets.
The generic impact selector has no experiment rule and proposes whole-product
gates; this discovery uses the approved contract's bounded verification instead.
No broad release or native-compositor certification is claimed.

Build: 59 modules; revised dot entry 5.88 KB gzip (previously 5.85 KB), shared config 0.38 KB,
shared scaffold chunk 85.16 KB, dot CSS 14.40 KB, excluding fonts/transport.
Shared chunks were repartitioned, so the new entry size alone is not a total
page-cost delta. No budget amendments. A local model, source, presentation,
host entry and stylesheet are added; the general matrix/math owners are unchanged.

September 30, compact centered presentation refinement: the mathematical stage
is 10% smaller, including both source entries and their destination occurrences
to avoid a size jump at handoff. Starting vectors and the evaluation line are
centered vertically; the existing layout controls retain horizontal grouping.
KaTeX operator, relation, enclosure and punctuation classes use the muted theme
color in the stage and static calculation. Product parentheses are explicit
enclosure participants in the local fusion adapter: their sampled phase trails
the contents, while the result retains its existing handoff. This is a local
visual trial, not promotion of a new global fusion profile.

Validation: four unit tests, two scoped Chromium tests, full typecheck (zero
Svelte errors/warnings), and the matrix experiment build pass. Browser checks
cover matching entry sizes, consistent syntax color, centered working layout,
delayed enclosure compression/withdrawal and reverse seek restoration, alongside
the existing semantic-reference, pivot, endpoint and configuration checks.
Initial, multiplication hold and delayed-enclosure captures were inspected.
The dot entry is now 5.96 KB gzip (previously 5.88); no budget change.

September 30, continuous lift-and-pivot refinement: removed the intermediate
bracket-corner docking state. Material entries depart directly from their native
positions; the column lifts and turns on one continuous sampled motion, retaining
its straight axis and upright glyphs while the row opens early. Brackets fade at
their original positions. The lift uses the measured column span, not a new
global trajectory or mathematical transformation. Addition still uses the same
contributor-fusion sampler with all products and plus signs as contributors.
Four unit and two Chromium tests pass; the scoped build reports 5.83 KB gzip
for the dot entry. Browser checks replace obsolete docking assertions with
direct upward departure and stationary bracket checks, preserving collinearity,
row arrival, reverse seeking, references, fusion and side-layout containment.
Four lift/turn frames were inspected. This supersedes the docking choreography
described earlier in this review; it does not advance rectangular integration.

September 30, enclosure pop refinement: parentheses now hold at native size
until the contents reach the contributor-fusion kernel. A short local collapse
shrinks their vertical scale faster than their horizontal scale; the result
holds at kernel size until the enclosure is gone, then expands using the shared
fusion optics. Ungrouped addition retains its existing fusion timing. This
supersedes the earlier delayed uniform enclosure fusion trial. Syntax is darker
neutral grey in light mode, with a separately legible darker-grey dark-mode value.
Four unit and two Chromium tests pass, including native enclosure hold,
anisotropic collapse, result-growth ordering and reverse seek. Multiplication,
pop and result frames were inspected. The build passes at 5.87 KB gzip for the
dot entry. These are local provisional aesthetics, not a promoted global motif.

September 30, column depth trial: the user approved testing a subtle dimensional
departure. Column material entries gain a soft glyph shadow and at most 3.5%
scale while following the existing lift/pivot. The row remains flat. Native
brackets wait briefly, then flatten horizontally with a slight vertical retreat
and fade. Entry shadows and scale settle completely before the native pairing
endpoint; reduced-motion mode suppresses this depth cue. This is a local 2D
depth illusion, not new 3D geometry or semantic ownership. Evaluation is unchanged.
Four unit and two Chromium tests pass, including column-only shadow, bracket
flattening, shadow-free endpoint/reduced-motion and existing reversal checks.
Departure, transit and landed captures were inspected. The scoped build passes;
dot entry 6.03 KB gzip, previously 5.87 KB. No shared motif promotion is claimed.

September 30, glyph-axis tilt trial: column glyphs now rotate up to 22 degrees
about their own vertical axes with local perspective, following the same depth
envelope as the shadow. The row remains face-on; landing and reduced motion have
zero tilt. The mathematical objects, column trajectory and evaluation stay
unchanged. Four unit and two Chromium tests pass, including measured 3D tilt
and zero-tilt landing. The departure capture was inspected; the effect is subtle
at native text size. Build passes at 6.06 KB gzip for the dot entry (6.03 before).

September 30, shared-plane correction: the user clarified that the entire
mathematical x-y plane should tilt, rather than individual glyphs. The stage now
uses shared perspective and a 45-degree Y rotation with preserved 3D children.
Both row and column material entries translate forward to Z=70px; the working
expression remains at that depth for a continuous native handoff. Source
brackets remain full-size and opaque at Z=0 throughout. The working line sits
60px lower in plane coordinates to avoid the retained brackets overlapping the
new expression. This supersedes the bracket retreat and individual-glyph tilt.

Preparation temporarily removes the camera and working-plane transforms so
native measurement and fusion remain in scene coordinates. The projection is
restored before paint; semantics and evaluation timing are unchanged. Four unit
and two Chromium tests pass, including shared rotation, positive material and
destination Z, untransformed opaque brackets, collinearity, native handoff and
reverse seeking. Full types and build pass; dot entry is 6.00 KB gzip. Initial,
departure, pairing and multiplication frames were inspected. This remains a
local perspective trial, with no general 3D renderer or compositor claim.

September 30, reverse camera and text-shadow trial: the shared Y rotation is
now -25 degrees, replacing +45. Moving glyphs inherit an explicit text shadow
whose offset, softness and opacity track the depth envelope, replacing the
filter shadow. The source brackets and real Z translation are preserved.
Shadows settle away at the reading endpoint and are suppressed in reduced
motion. They are text-attached shading, not a light projection onto the backing
plane. The smaller angle makes the text less compressed in the inspected
departure, pivot and multiplication captures. Four unit and two Chromium tests
pass; the signed camera rotation and text-shadow lifecycle are checked along
with the existing handoff and reverse-seek checks. Build passes at 6.00 KB gzip.

September 30, two bordered surfaces: the source plane now has a thin neutral
border and faint fill; a second, faint teal working plane appears and translates
forward with the entries. Each surface sits 1px behind its mathematical paint
to avoid coplanar ambiguity. The working plane stays forward throughout
evaluation; there are only two surfaces, not one per beat. Both share the camera
and adapt their width to the side layout. They are decorative, pointer-inert and
inside the existing aria-hidden visual stage. No mathematical identity changes.
Four unit and two Chromium tests pass, including plane count, initial working
plane absence, material/surface depth agreement and reverse seek. Initial,
pivot and multiplication captures were inspected. The scoped build passes at
6.06 KB gzip for the dot entry. Border and fill values remain provisional.

September 30, stronger plane separation: shared camera now combines X=10deg
with Y=-25deg. The working surface has an 85%-opaque paper-toned fill with a
slight teal tint. Source surface and brackets recede together to Z=-100px while
the working surface and entries advance to Z=70px. Their opacity and native
scale stay intact; the front surface naturally obscures the rear content.
Preparation resets source depth while measuring and restores it before paint.
Plane top bounds were tightened after a capture exposed clipping under X tilt.

Four unit and two Chromium tests pass, as do full types, updated test types and
build (dot entry 6.11 KB gzip). Browser checks cover both camera axes and shared
source/bracket depth. A former screen-rectangle no-contact assertion caught
0.65px of projected whitespace overlap between column entries. Spacing is now
asserted in scene coordinates; projected transit remains captured and visually
inspected rather than certified collision-free. Revised pivot and multiplication
captures show unclipped main-layout planes and distinguishable front content.

HUMAN_CHECKPOINT: select this evaluation treatment before integrating it into
the 2×3 by 3×2 case. The independently reversible unit is this passage and its
menu/build/test integration. After acceptance, resume the existing rectangular
slice without requesting a redundant phase approval. The second source-only
case must record whether any renderer edits were needed; it is not yet proved.
