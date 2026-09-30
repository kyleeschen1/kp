# Three pairs, one dot product

Status: standalone candidate ready for visual review; rectangular integration
and the source-only authoring proof remain conditional on acceptance.
Authority: [approved authoring proof](2026-09-30-matrix-authoring-next-step.md).
Execution: `run-contract.kp.matrix-authoring-v1`, first of three packages.

Open [Matrix explorations](http://localhost:8000/experiments/matrix-examples/)
and choose **Three-term dot product**. Use Next to inspect Vectors, Pairs,
Products and Sum. The [standalone host](http://localhost:8000/experiments/dot-product-passage/)
supports the same milestones and hash restoration.

The source is `(2, −1, 3) · (4, 5, −2)`. Copies arrange into three ordered
operand pairs, with the first vector settling before the second joins it; multiplication syntax enters after arrival. Each pair shrinks,
then its derived value grows in the same slot: `8 + (−5) + (−6)`. The products
then shrink and the sum `(−3)` grows. Source vectors stay readable. Review the
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

Checks: three focused semantic/preservation tests; two scoped Chromium tests
with four endpoints, ten transit captures, source IDs, native handoff, actual
playback, reverse seek, layout reflow, instant steps, reduced motion and phone
overflow. Endpoint and transit images were inspected. Inspection identified crossing
routes when both vectors moved simultaneously. Sequential vector arrivals keep
direct paths; sampled pairwise material-overlap checks guard this local repair
without claiming continuous collision certification. Full types (including zero Svelte errors/warnings), architecture, the standalone
multi-entry build and three changed-inventory checks pass, as do the eight
previous example/menu browser checks. The full typecheck was unusually slow
but completed successfully without changing checking scope or budgets.
The generic impact selector has no experiment rule and proposes whole-product
gates; this discovery uses the approved contract's bounded verification instead.
No broad release or native-compositor certification is claimed.

Build: 56 modules; new dot entry 3.81 KB gzip, shared config 0.38 KB,
shared scaffold chunk 85.16 KB, dot CSS 14.40 KB, excluding fonts/transport.
Shared chunks were repartitioned, so the new entry size alone is not a total
page-cost delta. No budget amendments. A local model, source, presentation,
host entry and stylesheet are added; the general matrix/math owners are unchanged.

HUMAN_CHECKPOINT: select this evaluation treatment before integrating it into
the 2×3 by 3×2 case. The independently reversible unit is this passage and its
menu/build/test integration. After acceptance, resume the existing rectangular
slice without requesting a redundant phase approval. The second source-only
case must record whether any renderer edits were needed; it is not yet proved.
