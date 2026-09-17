# Algebra trace pressure

These are original inventory probes, not newly implemented lessons. Row IDs
refer to the canonical Markdown inventory and are checked by `test:repertoire`.
Follow a row in the dashboard using `/experiments/repertoire/#<row-id>`.

## Add one third and one sixth

| Step | Reason | Inventory rows |
| --- | --- | --- |
| 1/3+1/6 → (2/2)(1/3)+1/6 | Introduce a unit factor; preserve the other addend | `alg.fraction.scale`, `alg.fraction.align-multiple` |
| → 2/6+1/6 | Evaluate the introduced products | `alg.evaluate` |
| → 3/6 | Add numerators over the common denominator | `alg.fraction.same-add` |
| → 1/2 | Reduce by a common divisor | `alg.fraction.reduce` |

Finding: alignment is implemented in the exact one-third/one-sixth caller.
The [family audit](../algebra-family-audit.md) recovered addition in the quadratic
reader and reduction in the two-fourths asset, with checked examples different
from this trace. The
existing alignment asset stops at 2/6+1/6; neither its checkbox nor the mathematical
correctness of the remaining steps proves a complete source-authored addition
passage. The [algebra audit](../algebra-audit.md) records these boundaries.

## Solve ln(x-1)+ln(x+1)=ln(8)

Work over the reals and use natural logarithms.

| Step | Reason | Inventory rows |
| --- | --- | --- |
| Require x>1 | Both arguments must be positive | `alg.log.domain` |
| ln((x-1)(x+1))=ln(8) | Combine logs, retaining that domain | `alg.log.product-combine` |
| (x-1)(x+1)=8 | Natural log is injective on positive arguments | `alg.log.injective` |
| x²-1=8 → x²=9 | Expand the product and add one to both sides | `alg.poly.multiply`, `alg.eq.add` |
| x=3 or x=-3 | Keep both candidates from the even-power equation | `alg.root.even-equation` |
| Keep x=3 | x=-3 is outside the original logarithmic domain; x=3 verifies | `alg.log.domain`, `alg.eq.verify` |

Finding: the trace exposed a missing inventory row for logarithm injectivity;
it is now listed as unaudited. Product expansion and rewind do not establish a
forward authored combination with these structured arguments and equation
context. This trace therefore remains an implementation/composition gap to
investigate, not a checked lesson.

## Fraction boundary variants

Changing 1/3+1/6 to 1/6+1/8 requires alignment of both fractions to 24, not the
same one-sided scaling caller. Replacing the denominators by x and x+1 adds
nonzero-domain obligations. A denominator containing a sum cannot be split as
if it were the numerator.

Rows: `alg.fraction.align-shared`, `alg.fraction.align-symbolic`,
`alg.fraction.no-split-denominator`. All are explicitly unaudited rather than
automatically inheriting the simpler caller's check.
