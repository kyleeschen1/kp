# Algebra

## Equations, inequalities and systems

### Semantic moves

- [x] `alg.eq.add` Add the same quantity to both sides — registered linear caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x-4=7 → x-4+4=7+4
  Audit: implemented
- [x] `alg.eq.subtract` Subtract the same quantity from both sides — registered linear caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 2x+3=11 → 2x+3-3=11-3
  Audit: implemented
- [ ] `alg.eq.multiply` Multiply both sides by a nonzero quantity. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x/3=4 → x=12
  Audit: partial — governed registration exists; this concrete visual path not verified
- [x] `alg.eq.divide` Divide both sides by a nonzero coefficient — three-x caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 3x=12 → (3x)/3=12/3 → x=4
  Audit: implemented
- [ ] `alg.eq.both-variable` Collect variable terms across both sides.
  Example: 3x+2=x+8 → 2x=6 → x=3
  Audit: unaudited
- [ ] `alg.eq.degenerate` Distinguish unique, no-solution and identity equations.
  Example: 0x=3 has no solution; 0x=0 allows every real x
  Audit: unaudited
- [ ] `alg.eq.clear-denominators` Clear denominators while preserving domain exclusions.
  Example: 1/x=2/(x+1) → x+1=2x; x≠0,-1
  Audit: unaudited
- [ ] `alg.eq.zero-product` Branch a zero product into factor equations.
  Example: (x-2)(x+3)=0 → x=2 or x=-3
  Audit: unaudited
- [ ] `alg.eq.quadratic-formula` Apply the quadratic formula including discriminant cases. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ax²+bx+c=0 → (-b±√(b²-4ac))/(2a), a≠0
  Audit: partial — verified formula authority and native forms exist; general presentation scope not verified
- [ ] `alg.eq.absolute` Split an absolute-value equation into valid branches.
  Example: |x-2|=3 → x=5 or x=-1
  Audit: unaudited
- [ ] `alg.eq.parameter` Branch on a parameter before dividing.
  Example: ax=b: a≠0 → x=b/a; a=0 requires separate cases
  Audit: unaudited
- [ ] `alg.eq.verify` Substitute a candidate into the original equation.
  Example: Check x=2 in √(x+2)=x rather than only its squared equation
  Audit: unaudited
- [ ] `alg.ineq.add` Preserve inequality direction under addition.
  Example: x-3<2 → x<5
  Audit: unaudited
- [ ] `alg.ineq.negative` Reverse an inequality when multiplying by a negative. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: -2x<6 → x>-3
  Audit: partial — inequality sign-flip asset found; complete scope not audited
- [ ] `alg.ineq.compound` Intersect or unite inequality solution intervals.
  Example: x>1 and x≤4 → (1,4]
  Audit: unaudited
- [ ] `alg.ineq.absolute` Translate absolute-value bounds into intervals.
  Example: |x-2|<3 → -1<x<5
  Audit: unaudited
- [ ] `alg.ineq.rational` Use a sign chart with zeros and excluded poles.
  Example: (x-1)/(x+2)>0 → x<-2 or x>1
  Audit: unaudited
- [ ] `alg.system.substitute` Solve a linear system by substitution.
  Example: y=2x, x+y=6 → x=2, y=4
  Audit: unaudited
- [ ] `alg.system.eliminate` Eliminate a variable with a scaled equation combination.
  Example: x+y=3, x-y=1 → 2x=4
  Audit: unaudited
- [ ] `alg.system.classify` Distinguish intersecting, parallel and coincident constraints.
  Example: x+y=1 versus 2x+2y=2 or 3
  Audit: unaudited
- [ ] `alg.system.nonlinear` Substitute between a line and a nonlinear relation.
  Example: y=x, x²+y²=2 → (1,1),(-1,-1)
  Audit: unaudited
- [ ] `alg.system.feasible` Intersect several inequalities to form a feasible region.
  Example: x≥0, y≥0, x+y≤1
  Audit: unaudited

### Visual motifs

- [x] `motif.alg.balance` Apply one operation to both equation branches together. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: Subtraction is introduced on the left and right under one law
  Audit: implemented
- [ ] `motif.alg.solution-filter` Retain candidates alongside the original constraint.
  Example: Invalid roots remain explainable rather than silently vanishing
  Audit: unaudited
- [ ] `motif.alg.elimination` Track a linear combination across equation rows.
  Example: A chosen coefficient cancels while the other column persists
  Audit: unaudited
