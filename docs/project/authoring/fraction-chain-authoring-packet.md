# Checked fraction chains

Select `equation.fraction-chain` through the existing read-only checker:

```sh
npm run author:check -- --task equation.fraction-chain --example
npm run author:check -- --task equation.fraction-chain --request examples/algebra/fraction-chain.json
```

Return raw JSON with schema `kp.algebra.fraction-chain.v1`, a stable lowercase
`id`, `title`, two to eight `states` (`id`, `latex`), and one `move` per adjacent
pair (`id`, `from`, `to`, `prose`, optional `hint`). The example command supplies
a complete starter without hints. Do not return a check report as source.

Each expression is an explicit integer fraction or an ordered pair joined by
`+` or `-`. Integers have absolute value at most 1,000,000; denominators must be
positive. Slash notation and `\frac` are supported. No symbolic denominators,
decimals, undeclared assumptions or arbitrary algebra.

Author meaningful stops: `1/3+1/6 → 2/6+1/6 → 3/6 → 1/2`. Alignment must preserve
each ordered fraction while multiplying numerator and denominator by the same
positive integer. Combination requires equal denominators and the raw result:
`2/6+1/6 → 1/2` skips reduction and is rejected. Reduction divides both written
integers by an exact common divisor. Subtraction preserves order and its sign.
The four retained JSON/Article pairs in `examples/algebra/fraction-chain*`
demonstrate one-sided, two-sided, numeric and subtraction callers.

Unique checked candidates require no hint. Optional `align`, `combine` or
`reduce` hints must match verified mathematics. Prose does not prove a move.
If a broad endpoint jump leaves the intended route unspecified, add explicit
intermediate states; the checker does not invent a derivation. Preserve repair
`code`, `path` and `expected`, correct that source and recheck. Unknown fields,
proofs, motif IDs, timing, geometry and transported authority are rejected.

A successful report names the source revision and resolved moves. It carries
`hostEligibility` separately: `eligible` means the current native passage can
construct this operation sequence; `repair-required` names a host limitation
without undoing successful semantic checking. Eligible shapes are alignment,
raw combination, and optionally one reduction. This is not browser paint
certification. Publication checks the same boundary before emitting a page.

The report carries
no live proof, Apply authority or publication authority. Editing endpoints,
hints or prose produces a fresh revision; never attach an old report as proof.
Semantic acceptance is not paint certification. Signed/zero results have
semantic coverage but not general visual reduction support. The existing
numeric reduction is not a new fluent reduction motif.

Signed integer numerators are accepted by alignment and raw combination endpoint
validation. The retained `content/authoring/convergence/fraction-negative.json`
and adjacent Article demonstrate `1/6−3/4 → 2/12−9/12 → (-7)/12` through the
existing host's publication fixture (`npm run visual:algebra-convergence`). This
is not a new public preview route or support for signed reduction animation.

The canonical host is `/experiments/fraction-chain/#counting-parts`, built from
the retained source and adjacent Article. Its Vite/publication owners recheck
source, emit static explanation and pin the interactive revision. Checking an
arbitrary file does not load it into that route. To revise a retained caller,
edit its source and Article coherently and use the existing build; reuse shared
reader typography, rails and disclosure controls. No standalone immutable
edition builder or arbitrary chain-layout generator is supplied by this task.

The retained `/numeric/` caller now demonstrates a source-only variation from
eighths to tenths (`1/5+1/10 → 2/10+1/10 → 3/10`), without hints or route,
renderer, CSS or clock changes. Its adjacent Article supplies the matching prose.

The frozen repeatability trial also applies `2/5+1/10 → 4/10+1/10 → 5/10 → 1/2`
and `3/4−1/6 → 9/12−2/12 → 7/12` through this compiler and existing host,
without hints or case-specific engine changes. See
[`cost-comparison.md`](../reviews/authoring-repeatability/cost-comparison.md).
Its two adjacent Articles are real authoring work. Application used isolated
browser document fixtures, not a new upload/Apply route or immutable edition.
All three supported browsers preserve endpoints, reversal, disclosure return,
font resizing and no-JS native MathML. The publication owner now emits accessible
native math for permanent equations and static detail; retain that output when
editing prose. Checking another chain still does not certify its choreography
or teaching quality. A false numerator total remains a located arithmetic repair.

Mechanics discovery is separate: `--task mechanics.momentum-energy --example`
returns the existing positive-mass Euclidean-vector derivation assumptions.
Its checker does not infer new mechanics or apply drafts to the reference host.
