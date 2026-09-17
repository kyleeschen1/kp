# Calculus and multivariable calculus

## Differentiation rules and applications

### Semantic moves

- [ ] `calc.diff.constant` Differentiate constants and linear combinations.
  Example: d(3x+7)/dx=3
  Audit: unaudited
- [x] `calc.diff.power` Differentiate a power — bounded integer exponent greater than one. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: d(x³)/dx → 3x²
  Audit: implemented
- [ ] `calc.diff.power-general` Differentiate negative or fractional powers on their valid domains. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: d(x^(-1))/dx=-x^(-2), x≠0
  Audit: partial — current power-rule semantic boundary rejects exponents at most one
- [ ] `calc.diff.product` Differentiate a scalar product with both contributions.
  Example: (uv)′=u′v+uv′
  Audit: unaudited
- [x] `calc.diff.dot` Differentiate a vector self-dot-product — force/energy passage. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: d(v·v)/dt = v′·v+v·v′
  Audit: implemented
- [ ] `calc.diff.quotient` Differentiate a quotient while preserving order and denominator square.
  Example: (u/v)′=(u′v-uv′)/v²; v≠0
  Audit: unaudited
- [ ] `calc.diff.chain` Differentiate nested dependence with a chain rule.
  Example: d sin(x²)/dx = cos(x²)·2x
  Audit: unaudited
- [ ] `calc.diff.exp-log` Differentiate exponential and logarithmic functions.
  Example: d e^x/dx=e^x; d ln(x)/dx=1/x for x>0
  Audit: unaudited
- [ ] `calc.diff.trig` Differentiate sine, cosine and tangent.
  Example: d tan(x)/dx=sec²(x) where cos(x)≠0
  Audit: unaudited
- [ ] `calc.diff.inverse` Differentiate an inverse function at a regular point.
  Example: (f⁻¹)′(y)=1/f′(f⁻¹(y)), f′≠0
  Audit: unaudited
- [ ] `calc.diff.implicit` Differentiate an implicit constraint.
  Example: x²+y²=1 → 2x+2y y′=0
  Audit: unaudited
- [ ] `calc.diff.logarithmic` Use logarithms to differentiate a variable power.
  Example: d x^x/dx = x^x(ln x+1), x>0
  Audit: unaudited
- [ ] `calc.diff.higher` Interpret second derivatives and concavity.
  Example: f″>0 means the slope is increasing
  Audit: unaudited
- [ ] `calc.diff.related` Relate rates using one shared constraint.
  Example: A=πr² → dA/dt=2πr dr/dt
  Audit: unaudited
- [ ] `calc.diff.extrema` Compare critical points, endpoints and singular points.
  Example: Minimize x² on [-1,2] by checking 0 and both endpoints
  Audit: unaudited
- [ ] `calc.diff.mean-value` Relate average slope to an intermediate instantaneous slope.
  Example: Under continuity/differentiability, f′(c)=[f(b)-f(a)]/(b-a)
  Audit: unaudited
- [ ] `calc.diff.lhopital` Use a justified indeterminate-form limit rule.
  Example: lim x→0 sin(x)/x = lim x→0 cos(x)/1 under the rule's hypotheses
  Audit: unaudited

### Visual motifs

- [x] `motif.calc.power` Branch exponent meaning into coefficient and successor exponent. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: 3 in x³ supplies 3x²
  Audit: implemented
- [x] `motif.calc.product` Retain the two distinct causes of product change before collection. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: v′·v and v·v′ remain distinguishable before becoming equal contributions
  Audit: implemented
- [ ] `motif.calc.chain` Follow nested dependencies through corresponding derivative factors.
  Example: Input → inner function → outer function
  Audit: unaudited
