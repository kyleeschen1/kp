# Algebra

## Powers, roots and radicals

### Semantic moves

- [x] `alg.power.expand-square` Expand a square as repeated multiplication — governed exemplar. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x² → x·x
  Audit: implemented
- [ ] `alg.power.expand-integer` Expand an arbitrary positive integer exponent. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x⁴ → x·x·x·x
  Audit: partial — bounded exponent lowering exists; arbitrary integer caller not established
- [ ] `alg.power.product` Combine powers with the same base.
  Example: x^m x^n → x^(m+n); positive x for arbitrary real exponents
  Audit: unaudited
- [ ] `alg.power.quotient` Divide powers with the same nonzero base.
  Example: x^m/x^n → x^(m-n); x>0 for real exponents
  Audit: unaudited
- [ ] `alg.power.power` Simplify a power of a power.
  Example: (x^m)^n → x^(mn); x>0
  Audit: unaudited
- [ ] `alg.power.product-expand` Distribute a power over a product.
  Example: (ab)² → a²b²; a,b real
  Audit: unaudited
- [ ] `alg.power.quotient-expand` Distribute a power over a quotient. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: (a/b)² → a²/b²; b≠0
  Audit: partial — mechanics quotient-square caller exists; general algebra source reuse unconfirmed
- [ ] `alg.power.zero` Use the zero-exponent law with its nonzero-base condition.
  Example: x⁰ → 1; x≠0
  Audit: unaudited
- [ ] `alg.power.negative` Move a negative exponent across a fraction bar.
  Example: x^(-n) → 1/x^n; x≠0
  Audit: unaudited
- [x] `alg.root.half-power` Rewrite a half power as a square root — governed exemplar. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x^(1/2) → √x; x≥0
  Audit: implemented
- [ ] `alg.root.root-to-power` Rewrite a square root as a half power. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: √x → x^(1/2); x≥0
  Audit: partial — the checked operation runs power to root; reverse playback does not establish a separately authorized inverse move
- [ ] `alg.root.rational-power` Relate general rational exponents to radicals.
  Example: x^(2/3) = (∛x)² for real x; choose real-root convention
  Audit: unaudited
- [ ] `alg.root.square-absolute` Retain absolute value when taking the square root of a square.
  Example: √(x²) → |x|
  Audit: unaudited
- [ ] `alg.root.extract` Extract perfect-square factors from a radical.
  Example: √(12x²) → 2|x|√3
  Audit: unaudited
- [ ] `alg.root.combine` Collect like radicals after simplification.
  Example: √8+√18 → 5√2
  Audit: unaudited
- [ ] `alg.root.product` Multiply radicals with real-domain conditions.
  Example: √a√b → √(ab); a,b≥0
  Audit: unaudited
- [ ] `alg.root.rationalize-single` Rationalize a single-radical denominator.
  Example: 1/√2 → √2/2
  Audit: unaudited
- [ ] `alg.root.rationalize-conjugate` Rationalize with a conjugate.
  Example: 1/(√x+1) → (√x-1)/(x-1); x≥0, x≠1 for this form
  Audit: unaudited
- [ ] `alg.root.odd-equation` Solve an odd-power equation over the reals. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x³=-8 → x=-2
  Audit: partial — odd-root semantic exemplar exists; full visual path not verified
- [ ] `alg.root.even-equation` Retain both branches when solving an even-power equation — bounded caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x²=9 → x=3 or x=-3
  Audit: partial — even-root asset exists; exact stated caller needs verification
- [ ] `alg.root.extraneous` Reject extraneous roots introduced by squaring.
  Example: √(x+2)=x → candidates 2,-1 → keep 2
  Audit: unaudited

### Visual motifs

- [x] `motif.alg.power-expand` Expose repeated factors without treating identical glyphs as one entity. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x² opens into two multiplicative occurrences
  Audit: implemented
- [x] `motif.alg.root-rewrite` Carry exponent meaning into radical notation — governed exemplar. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: The half power becomes a square-root relationship
  Audit: implemented
- [ ] `motif.alg.root-branches` Keep both solution branches and attach their validity checks.
  Example: ±√c with c≥0; collapse duplicate branches at c=0
  Audit: unaudited
