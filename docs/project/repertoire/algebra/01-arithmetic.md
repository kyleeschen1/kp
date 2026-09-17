# Algebra

## Signed arithmetic and expression structure

### Semantic moves

- [ ] `alg.sign.add` Add signed quantities.
  Example: -3 + 5 → 2
  Audit: unaudited
- [ ] `alg.sign.subtract` Rewrite subtraction as addition of the opposite.
  Example: a - (-b) → a + b
  Audit: unaudited
- [ ] `alg.sign.product` Determine signs in products and quotients.
  Example: (-a)(-b) → ab; a,b real
  Audit: unaudited
- [ ] `alg.order` Respect precedence and parentheses.
  Example: -2² = -4; (-2)² = 4
  Audit: unaudited
- [ ] `alg.associate` Regroup associative operations.
  Example: (a+b)+c ↔ a+(b+c); do not apply to subtraction
  Audit: unaudited
- [ ] `alg.commute` Reorder commuting scalar operands.
  Example: ab ↔ ba; does not generalize to matrices
  Audit: unaudited
- [ ] `alg.collect` Collect like terms while retaining unlike terms.
  Example: 3x+2x+y → 5x+y
  Audit: unaudited
- [x] `alg.distribute` Distribute a scalar across a sum — bounded equation caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: a(b+c) → ab+ac
  Audit: implemented
- [ ] `alg.distribute-negative` Distribute a negative sign across a difference.
  Example: -(x-y) → -x+y
  Audit: unaudited
- [ ] `alg.distribute-nested` Distribute through nested sums. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 2(x+3(y-1)) → 2x+6y-6
  Audit: partial — nested product grouping exists; full source-to-result path not established
- [x] `alg.factor-common` Extract a shared scalar factor — bounded distribution inverse. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ab+ac → a(b+c)
  Audit: implemented
- [ ] `alg.identity` Remove additive and multiplicative identities.
  Example: x+0 → x; 1x → x
  Audit: unaudited
- [ ] `alg.evaluate` Evaluate exact arithmetic separately from symbolic rewriting. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 2·3x → 6x; the value calculation differs from distribution
  Audit: partial — exact evaluation machinery exists; broad authorable arithmetic not audited
- [ ] `alg.substitute` Substitute an expression without losing grouping.
  Example: x² with x=a+b → (a+b)²
  Audit: unaudited
- [ ] `alg.absolute` Use absolute value as distance and a piecewise expression.
  Example: |x| = x if x≥0, otherwise -x
  Audit: unaudited
- [ ] `alg.estimate` Check an answer by magnitude and sign.
  Example: 19·21 is near 400, not 40
  Audit: unaudited

### Visual motifs

- [x] `motif.alg.distribute` Branch one factor into corresponding products. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: a is carried into both ab and ac
  Audit: implemented
- [ ] `motif.alg.sign` Keep a negation attached to its entire scope.
  Example: Contrast -(x-y) with -x-y
  Audit: unaudited
- [ ] `motif.alg.collect` Gather only genuinely like terms.
  Example: Link both x terms while y remains contextual
  Audit: unaudited
