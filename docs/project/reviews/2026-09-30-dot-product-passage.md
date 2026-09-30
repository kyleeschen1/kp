# Three pairs, one dot product

Status: standalone candidate ready for visual review; rectangular integration
and the source-only authoring proof remain conditional on acceptance.
Authority: [approved authoring proof](2026-09-30-matrix-authoring-next-step.md).
Execution: `run-contract.kp.matrix-authoring-v1`, first of three packages.

Open [Matrix explorations](http://localhost:8000/experiments/matrix-examples/)
and choose **Three-term dot product**. Use Next to inspect Vectors, Pairs,
Products and Sum. The [standalone host](http://localhost:8000/experiments/dot-product-passage/)
supports the same milestones and hash restoration.

The source is the row covector `[2, −1, 3]` applied to the column vector
`[4; 5; −2]`. The user requested a replacement for sequential copy arrivals:
move both objects so the column's lower-left meets the row's upper-right,
withdraw the brackets, then tilt the column into the paired expression while
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
Multiplication syntax enters after arrival. Negative factors have no added
parentheses, as requested. Each pair shrinks,
then its derived value grows in the same slot: `8 + −5 + −6`. Addition signs
remain visible and stationary throughout multiplication. Only the later sum
step consumes them. Pair terms now use their native widths with a 0.25em gap;
product slots retain those widths for a stationary addition-sign handoff. The products
then shrink and the sum `−3` grows. Review the
clarity of pairing, the product replacement, and the final sum's timing.

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

Checks after the requested coordinated-pivot revision: four focused
semantic/preservation tests; two scoped Chromium tests
with four endpoints, ten transit captures, source IDs, native handoff, actual
playback, reverse seek, layout reflow, instant steps, reduced motion and phone
overflow. Corner docking and exclusive source/material presence now have
explicit checks. Endpoint, docked, transit and side-layout images were inspected.
The prior simultaneous-copy crossing regression remains guarded by sampled
scalar-box overlap checks, without claiming continuous collision certification.
Visual inspection caught a wrapper-box docking gap and a clipped top entry in
the side layout. Measuring KaTeX's native base fixes the docking boundary;
reserving the same vertical tilt room in both layouts fixes the clipping.
Tests assert corner alignment and side-layout material containment. The latest
checks also assert column collinearity during the turn and that row entries
reach their final slots while the column is still tilted. The initial pivot
trial caught bottom-entry overlap with the opening row; delaying the shared
pivot's descent repaired it without changing the straight-axis constraint.
The previous
regressions also check two visible addition signs throughout multiplication
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

Build: 56 modules; revised dot entry 4.35 KB gzip (previously 4.23 KB), shared config 0.38 KB,
shared scaffold chunk 85.16 KB, dot CSS 14.40 KB, excluding fonts/transport.
Shared chunks were repartitioned, so the new entry size alone is not a total
page-cost delta. No budget amendments. A local model, source, presentation,
host entry and stylesheet are added; the general matrix/math owners are unchanged.

HUMAN_CHECKPOINT: select this evaluation treatment before integrating it into
the 2×3 by 3×2 case. The independently reversible unit is this passage and its
menu/build/test integration. After acceptance, resume the existing rectangular
slice without requesting a redundant phase approval. The second source-only
case must record whether any renderer edits were needed; it is not yet proved.
