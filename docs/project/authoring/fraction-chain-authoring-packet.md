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
positive. Slash notation and `\\frac` are supported. No symbolic denominators,
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
no live proof, Apply authority or publication authority. Editing endpoints,
hints or prose produces a fresh revision; never attach an old report as proof.
Semantic acceptance is not paint certification. Signed/zero results have
semantic coverage but not general visual reduction support. The existing
numeric reduction is not a new fluent reduction motif.

The canonical host is `/experiments/fraction-chain/#counting-parts`, built from
the retained source and adjacent Article. Its Vite/publication owners recheck
source, emit static explanation and pin the interactive revision. Checking an
arbitrary file does not load it into that route. To revise a retained caller,
edit its source and Article coherently and use the existing build; reuse shared
reader typography, rails and disclosure controls. No standalone immutable
edition builder or arbitrary chain-layout generator is supplied by this task.
