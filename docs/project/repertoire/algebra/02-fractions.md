# Algebra

## Fractions and rational expressions

### Semantic moves

- [x] `alg.fraction.scale` Scale numerator and denominator by the same nonzero factor — paired exemplar. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: (2/2)·(a/b) → 2a/(2b), b≠0
  Audit: implemented
- [x] `alg.fraction.reduce` Reduce an integer fraction using a common divisor — two-fourths exemplar. [Evidence](../../repertoire-notes/algebra-family-audit.md)
  Example: 2/4 → (1·2)/(2·2) → (1/2)(2/2) → 1/2
  Audit: implemented
- [ ] `alg.fraction.sign` Normalize the sign of a fraction.
  Example: a/(-b) → -a/b; b≠0
  Audit: unaudited
- [x] `alg.fraction.same-add` Add fractions with the same denominator — quadratic-reader exemplar. [Evidence](../../repertoire-notes/algebra-family-audit.md)
  Example: -24/4 + 25/4 → 1/4, with the equation's left side retained
  Audit: implemented
- [x] `alg.fraction.same-subtract` Subtract fractions with the same denominator — ordered positive-operand passage. [Evidence](../../reviews/2026-09-17-chain-first-subtraction-evidence.md)
  Example: 5/6 - 2/6 → (5-2)/6 → 3/6
  Audit: implemented — retained caller, not general signed-result visual certification
- [x] `alg.fraction.align-multiple` Align when one denominator divides the other — one-third plus one-sixth. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 1/3 + 1/6 → 2/6 + 1/6
  Audit: implemented
- [ ] `alg.fraction.align-coprime` Align two relatively prime integer denominators.
  Example: 1/3 + 1/5 → 5/15 + 3/15
  Audit: unaudited
- [x] `alg.fraction.align-shared` Align denominators with a nontrivial shared divisor — accepted two-sided passage. [Evidence](../../reviews/2026-09-17-chain-first-two-sided-review.md)
  Example: 1/6 + 1/8 → 4/24 + 3/24
  Audit: implemented — checked 6/8 denominator caller with separate factor joins
- [ ] `alg.fraction.align-symbolic` Find a common denominator from symbolic factors.
  Example: 1/[x(x+1)] + 1/(x+1) → [1+x]/[x(x+1)], x≠0,-1
  Audit: unaudited
- [ ] `alg.fraction.integer-add` Combine an integer and a fraction.
  Example: 2 + a/b → (2b+a)/b; b≠0
  Audit: unaudited
- [ ] `alg.fraction.mixed` Convert a mixed number to an improper fraction.
  Example: 2 1/3 → 7/3
  Audit: unaudited
- [ ] `alg.fraction.multiply` Multiply two fractions.
  Example: (a/b)(c/d) → ac/(bd); b,d≠0
  Audit: unaudited
- [ ] `alg.fraction.cross-cancel` Cancel factors across a product of fractions.
  Example: (2/3)(3/5) → 2/5
  Audit: unaudited
- [ ] `alg.fraction.divide` Rewrite fraction division using the reciprocal.
  Example: (a/b)/(c/d) → ad/(bc); b,c,d≠0
  Audit: unaudited
- [ ] `alg.fraction.divide-integer` Distinguish dividing a fraction from dividing by a fraction.
  Example: (a/b)/c = a/(bc); a/(b/c) = ac/b, b,c≠0
  Audit: unaudited
- [ ] `alg.fraction.nested-numerator` Flatten a fraction in the numerator.
  Example: (a/b)/c → a/(bc); b,c≠0
  Audit: unaudited
- [ ] `alg.fraction.nested-denominator` Flatten a fraction in the denominator.
  Example: a/(b/c) → ac/b; b,c≠0
  Audit: unaudited
- [ ] `alg.fraction.nested-both` Clear a compound fraction with sums on both levels.
  Example: (1+1/x)/(1-1/x) → (x+1)/(x-1); x≠0,1
  Audit: unaudited
- [x] `alg.fraction.split-numerator` Split a sum over a shared denominator — governed linear-numerator variation. [Evidence](../../repertoire-notes/algebra-family-audit.md)
  Example: (3y+9)/3 → 3y/3 + 9/3; fixed nonzero denominator
  Audit: implemented
- [ ] `alg.fraction.no-split-denominator` Reject distributing division over a denominator sum.
  Example: 1/(x+y) is generally not 1/x+1/y
  Audit: unaudited
- [x] `alg.fraction.cancel-factor` Cancel a nonzero scalar factor — checked scalar passage. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: (ab)/b → a; b≠0; actual caller is bounded
  Audit: implemented
- [ ] `alg.fraction.factor-before-cancel` Factor before cancellation and retain the excluded point.
  Example: (x²-1)/(x-1) → x+1; x≠1
  Audit: unaudited
- [ ] `alg.fraction.no-cancel-term` Distinguish terms from cancellable factors.
  Example: (x+1)/x cannot simplify by deleting x
  Audit: unaudited
- [ ] `alg.fraction.compare` Compare rational quantities with sign-aware denominators.
  Example: 1/x > 1/y with 0<x<y; positivity licenses multiplication
  Audit: unaudited

### Visual motifs

- [x] `motif.alg.fraction-scale` Pair numerator/denominator scaling while preserving fraction identity. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: A unit factor branches into the two fraction slots
  Audit: implemented
- [x] `motif.alg.fraction-align` Change one fraction while keeping the neighboring term stable. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: One-third changes to two-sixths; one-sixth persists
  Audit: implemented
- [ ] `motif.alg.fraction-nesting` Expose nested division structure without detaching its operands.
  Example: Contrast (a/b)/c and a/(b/c)
  Audit: unaudited
- [x] `motif.alg.cancellation` Expose a factor pair, cancel it and retain the remainder — scalar passage. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: One nonzero inverse pair disappears; contextual factors persist
  Audit: implemented
