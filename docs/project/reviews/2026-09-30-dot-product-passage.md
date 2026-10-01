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

September 30, face-on comparison: removed both camera rotations while retaining
perspective and the real forward/rearward Z translations. The rear surface and
brackets gain a coordinated 60px horizontal / 32px vertical offset to expose the
stack. The front panel casts a soft CSS box shadow that spreads and softens as
the planes separate; glyph text shadows are removed. This is a panel-attached
shadow approximation, not a physically projected light simulation. The existing
85%-opaque fill is retained. Source offset/depth are reset during local geometry
measurement so configuration changes cannot accumulate displacement.

Four unit and two Chromium tests pass. Camera rotation is zero, panel shadow and
rear offset are checked, glyphs remain shadow-free, and native endpoints,
reversal and configuration checks pass. Initial, transit and multiplication
captures were inspected: the text stays upright and the stack reads as layered
sheets. Scoped build passes with a 6.15 KB gzip entry (previously 6.11).

September 30, converging pairs and source traces: the user accepted the face-on
direction and requested less sweeping motion. Row and column entries now meet
on the central reading line from below and above, using a shallow 24px separation
instead of the full-column pivot. Native pair slots open before vertical spacing
closes; this repaired an observed early neighbor overlap without enlarging the
path. The initial rigid-column collinearity assertion was replaced with checks
for opposite-side approach, bounded vertical travel and native arrival.

The front surface transitions from cool to the same warm neutral paper tone as
the source surface by the matched-pairs endpoint. Original native entries remain
as grey source traces, retaining their scalar references; these are visual
historical occurrences rather than new mathematical values. Their trace role
is explicitly removed from material clones during layout remeasurement. Browser
checks cover six retained traces, role separation after configuration changes,
exact color endpoint, geometry, evaluation and deterministic reverse seeking.
Four unit tests, full types and the scoped build pass; the entry is approximately
6.1 KB gzip. Matching and multiplication frames were inspected. This remains the
standalone review candidate; rectangular integration has not begun.

September 30, neutral moving ink: removed the blue/teal focus color from material
entries. Moving numbers now use the same theme-native ink as their destination
occurrences (light text in dark mode, dark text in light mode). Source traces
remain grey. The scoped browser check asserts matching ink in both themes.

September 30, lighter working surface: front-panel fill opacity reduced from
85% to 30% at the user's request, exposing more of the grey originals behind it.
The border, panel shadow, text and rear surface retain their existing paint.
The browser color-endpoint check now preserves matching warm RGB with the
intentionally lower front alpha.

September 30, light-mode text-shadow comparison: this standalone host now
explicitly uses the light palette even with a dark OS preference. Moving entries
regain a subtle dark text shadow, strongest during departure/convergence and
absent at native reading endpoints or under reduced motion. Their ink stays
neutral. Panel alpha remains 30%, and the original grey traces remain visible.
The two Chromium checks pass, including explicit light color-scheme/background
under dark media emulation, moving shadow presence and shadow-free endpoints.
Four unit tests and the build pass (6.17 KB gzip entry); a transit frame was
inspected. This is a local palette trial, not a global theme preference change.

Deferred visual feedback, September 30: user reports a large size difference
between the two pairs of brackets. Log only; do not repair yet. Diagnosis should
distinguish intended row/column enclosure height from inconsistent glyph scale,
stroke weight, padding or perspective scaling. No cause has been established.

Exploratory direction, not implementation approval: user finds tilt distracting
and wants to brainstorm borderless panel levels, with entities rising from and
settling onto surfaces and shadows communicating depth. The current code has no
X/Y rotation, but retains perspective and Z-dependent apparent size. A possible
next comparison is constant-size, face-on objects with surface-relative shadows
and a small number of stable levels. Preserve the logged bracket issue and do
not treat this discussion as approval to redesign or promote the motif.

September 30, approved borderless-level exemplar: removed the remaining camera
perspective and both surface borders. Glyph sizes now remain constant with Z;
panel tone, offset and soft panel shadow identify the two levels. Entries rise
up to 20px above the receiving surface, with separate inert glyph-shadow paint
projected onto that surface using a fixed directional offset proportional to
height. Shadow blur grows with height; shadows tighten and disappear at landing.
Attached text shadows are disabled. This is a local directional projection,
not a general lighting engine or a promoted compositor mechanism.

Preparation and disposal own both glyph and shadow nodes. Decorative shadows
carry no native occurrence or source IDs; a browser regression caught inherited
source metadata and the clone boundary now removes it. An accidental selector
edit was also caught by the existing syntax-color check and repaired. Four unit
and two Chromium tests pass, as do full types, updated test types and build
(6.28 KB gzip entry). Browser checks include zero borders, constant glyph bounds,
receiver-plane shadow depth, semantic metadata exclusion, clean landing and
existing reverse/configuration checks. Transit and multiplication captures were
inspected. The previously logged bracket-size discrepancy remains deferred.

September 30, stationary context and stronger pop: source plane and source
contents no longer translate in x, y or z. They shrink to 94% around their own
centers and dim together to 22% opacity. Original scalar traces remain attached
to their original references. Foreground entries briefly scale up by at most
12%, returning to native size before landing. Receiver-plane glyph shadows are
much stronger (peak alpha .65, larger offset and blur); attached text shadow
remains disabled so glyphs stay crisp. Reduced motion suppresses pop/shadow.

Browser checks cover stationary rear transforms, coordinated translucency and
scale, foreground growth followed by native-size landing, and stronger shadow
presence. The pop produces approximately 2.6px overlap of adjacent column font
rectangles at an early sampled frame; visual inspection shows distinct glyphs.
Per motif-composition policy, transit contacts now attach diagnostic JSON rather
than assert zero rectangle overlap. Finite geometry, native endpoints, identity,
reverse seek and configuration checks remain executable. This is not a claim
of raster-level collision certification. The bracket-size issue stays deferred.

September 30, live opacity tuning: added a labeled Back panel opacity slider
below playback controls, 0–100% with a 22% default and percentage readout. It
sets the source panel/contents' opacity after foreground lift, preserving the
initial readable source and the existing fade envelope. Changes render at the
current clock position without pausing playback, seeking or rebuilding geometry.
The setting remains during same-page layout changes; reload resets the default.
The local render boundary rejects nonfinite/out-of-range opacity. A third scoped
browser test covers zero/full/intermediate values and tuning during playback;
existing slider queries now explicitly distinguish the timeline from tuning.
All three browser tests, four unit tests and build pass; entry 6.48 KB gzip.

September 30, gradual surface color exchange: the source retains its initial
beige, then eases toward white over the first 60% of pairing. The working plane
starts white and warms to the original beige from 35% through the end of pairing.
The overlapping smooth ramps follow the existing playhead, with no independent
CSS transition. Rear opacity tuning, stationary placement, source traces, shadows
and mathematical references are preserved. Scoped browser checks confirm initial,
intermediate and exchanged endpoint colors; all three browser tests, four unit
tests and build pass (dot entry 6.51 KB gzip). Color strength remains provisional
at the existing 30% front surface alpha; no broader treatment is promoted.

September 30, heavier light-mode typography and uniform brackets: user requests
heavier text generally in light mode. This passage is the first reviewable
candidate: prose and controls use weight 600, cues and native math use 700.
The native and moving numeric owners retain the same weight; fonts load before
geometry measurement. Catalogue-wide light-mode adoption remains a follow-up
after reviewing this treatment and a second caller.

The previously deferred bracket mismatch now has a concrete mechanism: KaTeX
selects a size-font glyph for the row and a constructed SVG for the column.
This local adapter preserves KaTeX enclosure layout and MathML but hides the
two native delimiter paints and draws structural square brackets with one
shared .12em stroke. Display-math outer margins are excluded from the bracket
height. Thus row and column height can differ while all horizontal and vertical
strokes agree. This is a local replacement-paint boundary, not certification of
the shared native KaTeX compositor. Browser regression checks enforce equal
nonzero bracket strokes, hidden native delimiters and matching bold source and
material glyphs; all three scoped tests, full typecheck and build pass.
Initial and multiplication-hold screenshots were inspected. The reversible
unit is the local stylesheet and its scoped checks; math and clocks are unchanged.

September 30, token/operator hierarchy refinement: lighter tokens use the regular
KaTeX face with a .2px paint stroke; delimiters and operators retain bold weight
and grey syntax ink. Unary negative signs are explicitly tagged from scalar
values, use bold operator sizing (85%), and retain token ink. This also applies
to the expandable static calculation. Source vector entries use a single 90%
element role. Moving owners clone full-size destination typography and interpolate
from the measured source-size ratio, retaining the existing pop and native landing.
This is role-based sizing, not recursive nesting shrinkage.

Source values now become invisible on departure, leaving empty structural
brackets rather than historical token copies. Native identities remain available
for measuring and reverse restoration. Browser checks cover relative element size,
negative sign weight/size/ink, bold operators, absent source paint after departure
and after reprepare, native handoffs and reverse seeks. Initial and multiplication
frames were inspected; three browser tests, four unit tests and build pass
(entry 6.53 KB gzip). The full light-mode treatment remains exemplar-local.

September 30, correction to unary size and matrix centering: the previous
font-size-only check missed that a bold minus at 85% was wider than a digit.
Unary signs now use 50% sizing with baseline adjustment; the browser checks
their measured width against the adjacent digit, rather than accepting a CSS
percentage as evidence of proportion. Matrix element sizing now uses KaTeX's
native small size before layout instead of a post-layout CSS font override.
Structural brackets use symmetric padding around measured entry bounds, avoiding
the outer formula line box's asymmetric font whitespace. These measurements are
recomputed during preparation with source scale neutralized, preserving resize
and direct-seek behavior. Regression checks enforce horizontal/vertical enclosure
centering within half a CSS pixel and retain row/column alignment tests. These
are DOM geometry checks, not a claim of raster-ink optical centering. Initial
and multiplication frames were inspected; three browser tests, four unit tests,
typecheck and build pass (entry 6.69 KB gzip).

September 30, padding restoration: retain the native enclosure's former horizontal
extent while centering it on the entry bounds. The prior centering repair had
also tightened the horizontal padding to the vertical .4em inset; that aesthetic
change was unwanted. Horizontal padding now derives from native enclosure width
and the previous .12em edge inset, applied symmetrically. Depth alternatives are
discussion only: the color exchange primarily suggests attention transfer;
contact shadows and opaque occlusion are candidates for a future face-on depth
pass, not newly implemented or approved treatments.

September 30, opaque paper depth experiment (approved “go”): both surfaces now
keep the same opaque warm-paper fill. The back stays stationary at native scale;
its opacity slider remains available but defaults to 100%. The raised paper
occludes the underlying source brackets. Its tight contact shadow is accompanied
by a broader offset cast shadow as elevation increases. Token shadows separate
and soften during lift, then tighten to match the native expression's resting
contact shadow. Background color exchange and automatic rear shrinking are
removed. Typography, padding, semantic references and pairing/evaluation beats
remain intact. This is one reversible local depth treatment, not a promotion.

The scoped browser gate checks constant opaque fills, unchanged rear scale,
default full opacity, diffuse lift and tight landing shadows, reverse seeks,
native handoffs, reduced motion and existing identity/geometry safeguards.
Three browser tests, four unit tests, full typecheck and build pass (entry 6.69 KB
gzip). Lift and multiplication screenshots were inspected: source brackets are
covered by the raised sheet. Full-playback depth readability awaits human review.

September 30, source-context correction: user found fully opaque layers
incoherent because they concealed the source. The working surface now uses 70%
paper alpha, allowing the empty source brackets to remain visible through it.
Foreground mathematical ink stays fully opaque; constant color, stationary
back, contact/cast shadows and the rear opacity control are preserved. This
supersedes full occlusion as the desired treatment for this exemplar. The scoped
browser check now enforces stable surface translucency rather than opaque fill.

September 30, constant token size and continuous panel arrival: remove the
matrix-only small size, extraction growth and lift pop. Sources, moving owners
and paired values now share the same typography and inline-block box behavior;
the latter fixes a measured 0.297px source/material line-box discrepancy.
Evaluation fusion scaling is preserved. Front fill now follows the lift smoothly
from 0% to 70%, with shadow strength ramping alongside it. This replaces the
instant translucent overlay that caused the bracket contrast jump; the bracket
ink itself stays constant. Browser checks sample unchanged x/y token scale,
matching native/material bounds, monotonic fill alpha with a near-zero initial
sample, and reverse restoration to zero alpha. Three browser tests, four unit
tests, typecheck and build pass (entry 6.64 KB gzip). Transit capture inspected;
full-playback visual acceptance remains pending.

September 30, neutral palette and stronger lift shadows: user approves trying
white surfaces with stable neutral ink, reserving color for purposeful focus.
The passage now uses neutral paper, text, syntax, controls and shadow colors;
no semantic focus color cue is added yet. Default back opacity remains 100%,
with the existing manual tuning control retained. Front surface translucency
and its smooth arrival remain, so this does not restore full occlusion.
Moving glyph shadows now peak at .55 opacity instead of .20, offset 13px/20.8px
instead of 9px/15.8px, and blur 4px instead of 5px. Resting contact-shadow geometry
and strength remain unchanged, with neutral black replacing the tinted shadow.
Constant glyph size, source references and evaluation choreography are preserved.
Three browser tests, four unit tests and build pass (entry 6.63 KB gzip); the lift
capture was inspected. These palette/shadow values remain local visual candidates.

September 30, focus ink: user chooses solid #2563EB tokens, explicitly declining
highlight backgrounds. The local beat projector derives focused scalar IDs
from the dot's operands, products and result; all native and moving occurrences
of those contributors receive the same blue. Initial matrix presentation remains
neutral. Negative signs inherit their signed token's focus ink, while delimiters,
binary operators and decorative shadows retain grey/black. Cloned glyph fill
and optical stroke both follow currentColor, preventing retained neutral stroke
paint during the native/material handoff. Focus is recomputed from the playhead,
including reversal and geometry reprepare; there is no new global focus store.
Scoped browser checks cover operand, product and final-result blue, negative
sign inheritance, neutral syntax/shadows and neutral restoration at the start.
This is the local exemplar's focus mapping, not a catalogue-wide rollout.

September 30, palette adjustment: restore the cream page (#fffdf8) and the
earlier warm beige surface mix (94% paper, 6% #806548). Focused token ink is now
CSS SteelBlue (#4682B4), replacing #2563EB for every active operand and result.
The same beat-derived focus mapping, neutral syntax/shadows, constant token size
and smoothly introduced translucent front are preserved. No highlight background
or new color-exchange animation is introduced.

September 30, adjustable background veil: user declines the blue focus treatment
and approves neutral focused tokens with a beige context wash. Background veil
replaces the back-opacity slider, ranging 0–40% and starting at zero. It controls
the existing front surface's fill, with the same smooth lift envelope, instead
of stacking another layer over the previous 70% wash. Rear paint remains at full
opacity; active native/material tokens, required operation syntax and shadows
sit above the veil. Beat-derived focus IDs remain available but no longer color
the tokens. This projection is scoped to this exemplar's source/working layers.

The render boundary rejects nonfinite or out-of-range veil settings. Browser
checks cover zero/intermediate/maximum values, live tuning without seeking or
pausing, neutral foreground ink, unchanged rear opacity and reversible smooth
fill arrival. Three browser tests, four unit tests and build pass (entry 6.73 KB
gzip). The multiplication capture at 40% was inspected. Tuning starts at zero
after reload and remains local to the mounted example.

September 30, focused glyph halo: add Glow strength (0–100%, default 60%) beside
the independent Background veil control. Focused tokens use a paper-white
(#fffdf8) glyph-shaped halo: four 1px edge shadows and a soft 4px spread. Native
tokens retain their dark contact shadow; moving tokens use the halo while their
separate receiving-plane shadow stays black and halo-free. Unary signs inherit
the halo through the signed token. Unfocused source text and syntax keep their
existing appearance. The existing beat-derived focus IDs own eligibility; there
is no additional focus state or geometry animation. The render boundary validates
strength, live tuning preserves playback, and disposal removes the input handler.
Browser checks cover zero/full/intermediate strength, stage-relative geometry,
native negative-sign inheritance, neutral decorative shadows and reverse focus
removal. This is a local visual candidate; no shared motif is promoted.

September 30, halo visibility probe: user could not see the paper-white halo.
Change its color to red (#dc2626), preserving the 60% default, strength slider,
glyph-shaped spread, dark token ink and separate black shadows. This makes the
existing effect easier to inspect; red is a local trial, not a focus-color policy.

September 30, stronger veil range: user requests a heavier wash. Background veil
now spans 0–100%, starting at 70%; the render boundary uses the same range and
default. At 100% the source beneath the working surface is fully covered after
lift, while focused expression paint and glow remain above it. Smooth arrival
and manual adjustment are preserved. The live-control browser check now exercises
0%, 40%, 70% and 100%.

September 30, subtle context recession: user requests slightly smaller unfocused
content. Source surface and source vector layout now ease together from 100% to
96% scale during foreground lift, centered in place. Active tokens and expression
stay at their original size; this does not restore extraction growth or the pop.
Existing prepare-time scale neutralization preserves native geometry measurement.
Browser checks verify matching 96% context scales, unchanged active token size
against the initial source, and reverse restoration to 100%.

September 30, inherited source bracket ink: remove the fixed syntax-grey paint
from source enclosures; structural bracket borders now use currentColor from the
source context. Active-expression syntax retains its grey treatment. Glow now
defaults to zero, with its control retained. A browser probe changes the parent
context color and checks that bracket paint follows it; stroke equality and
geometry remain covered. Important correction to the preceding discussion:
fixed grey was already beneath the veil, not bypassing it. Inheriting the current
dark context ink actually darkens source brackets slightly. This isolates the
ownership experiment and does not claim to resolve their visual dominance.

HUMAN_CHECKPOINT: select this evaluation treatment before integrating it into
the 2×3 by 3×2 case. The independently reversible unit is this passage and its
menu/build/test integration. After acceptance, resume the existing rectangular
slice without requesting a redundant phase approval. The second source-only
case must record whether any renderer edits were needed; it is not yet proved.
