# Algebra

## Polynomials and factoring

### Semantic moves

- [ ] `alg.poly.add` Add and subtract polynomials by degree.
  Example: (x²+2x)-(x²-x) → 3x
  Audit: unaudited
- [ ] `alg.poly.multiply` Multiply two sums with all cross terms. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: (x+2)(x+3) → x²+5x+6
  Audit: partial — nested distribution machinery exists; complete caller not verified
- [ ] `alg.poly.square-sum` Expand the square of a sum.
  Example: (a+b)² → a²+2ab+b²
  Audit: unaudited
- [ ] `alg.poly.square-difference` Expand the square of a difference.
  Example: (a-b)² → a²-2ab+b²
  Audit: unaudited
- [ ] `alg.poly.diff-squares` Factor a difference of squares.
  Example: a²-b² → (a-b)(a+b)
  Audit: unaudited
- [ ] `alg.poly.group` Factor by grouping.
  Example: ax+ay+bx+by → (a+b)(x+y)
  Audit: unaudited
- [ ] `alg.poly.monic-factor` Factor a monic quadratic by its sum/product conditions.
  Example: x²+5x+6 → (x+2)(x+3)
  Audit: unaudited
- [ ] `alg.poly.nonmonic-factor` Factor a nonmonic quadratic.
  Example: 2x²+7x+3 → (2x+1)(x+3)
  Audit: unaudited
- [ ] `alg.poly.cubes` Factor a sum or difference of cubes.
  Example: a³-b³ → (a-b)(a²+ab+b²)
  Audit: unaudited
- [ ] `alg.poly.complete-square` Complete the square in a quadratic. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x²+6x+5 → (x+3)²-4
  Audit: partial — quadratic authority and KaTeX machinery exist; full general caller not audited
- [ ] `alg.poly.long-divide` Divide a polynomial and expose quotient plus remainder.
  Example: (x²+1)/(x-1) → x+1+2/(x-1); x≠1
  Audit: unaudited
- [ ] `alg.poly.remainder` Use evaluation to identify the remainder at a linear divisor.
  Example: p(x)=(x-a)q(x)+r → r=p(a)
  Audit: unaudited
- [ ] `alg.poly.zeros` Relate factors and repeated zeros.
  Example: (x-1)²(x+2)=0 → roots 1 twice and -2
  Audit: unaudited
- [ ] `alg.poly.end-behavior` Infer polynomial end behavior from the leading term.
  Example: -2x⁴+x → -∞ at both ends
  Audit: unaudited

### Visual motifs

- [ ] `motif.alg.poly-grid` Account for every cross term in multiplying sums.
  Example: Four products of two binomials map to their origins
  Audit: unaudited
- [x] `motif.alg.poly-factor` Connect expansion and factoring at a common expression. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ab+ac and a(b+c) share a checked relation
  Audit: implemented
- [ ] `motif.alg.poly-square` Retain the compensating term while completing a square.
  Example: Adding 9 inside x²+6x requires subtracting 9 outside
  Audit: unaudited
