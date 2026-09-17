# Algebra

## Logarithms and exponential equations

### Semantic moves

- [ ] `alg.exp.sum-to-product` Rewrite an exponential of a sum as a product. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: e^(a+b) → e^a e^b
  Audit: partial — exponential-homomorphism asset exists; exact source/authoring scope needs its own audit
- [ ] `alg.exp.difference-to-quotient` Rewrite an exponential of a difference as a quotient. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: e^(a-b) → e^a/e^b
  Audit: partial — separate quotient pressure asset exists; general source path not established
- [ ] `alg.exp.product-to-sum` Combine equal-base exponential factors as an authored inverse move.
  Example: e^a e^b → e^(a+b)
  Audit: unaudited
- [ ] `alg.log.definition` Convert between logarithmic and exponential statements.
  Example: log_b(a)=c ↔ b^c=a; b>0, b≠1, a>0
  Audit: unaudited
- [x] `alg.log.product-expand` Expand the logarithm of two factors — natural-log caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(xy) → ln(x)+ln(y); x,y>0
  Audit: implemented
- [x] `alg.log.product-three` Expand the logarithm of three factors — pressure caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(xyz) → ln(x)+ln(y)+ln(z); x,y,z>0
  Audit: implemented
- [ ] `alg.log.product-combine` Combine a sum of logarithms as an authored inverse move. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(x)+ln(y) → ln(xy); x,y>0
  Audit: partial — forward product expansion rewinds, but a separate authored inverse route is unverified
- [x] `alg.log.quotient-combine` Combine a difference into a logarithm of a quotient — canonical caller. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(x)-ln(y) → ln(x/y); x,y>0
  Audit: implemented
- [ ] `alg.log.quotient-expand` Expand the logarithm of a quotient as an authored move. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(x/y) → ln(x)-ln(y); x,y>0
  Audit: partial — difference-to-quotient rewinds; separate forward expansion route is unverified
- [x] `alg.log.power-solve` Extract an exponent inside the checked exponential solve. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(2^x)=ln(7) → x ln(2)=ln(7)
  Audit: implemented
- [ ] `alg.log.power-general` Extract an arbitrary real power from a logarithm. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(a^r) → r ln(a); a>0
  Audit: partial — bounded 2^x solve is implemented; arbitrary structured argument not established
- [ ] `alg.log.power-absorb` Absorb a coefficient into a logarithm's argument exponent. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: r ln(a) → ln(a^r); a>0
  Audit: partial — exponent-absorption fixture exists; general authored route not established
- [x] `alg.log.base-change` Change logarithm base — scalar argument/base exemplar. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: log_2(7) → ln(7)/ln(2)
  Audit: implemented
- [ ] `alg.log.inverse` Cancel exponential and logarithm inverses with domain restrictions.
  Example: ln(e^x)=x; e^(ln x)=x only for x>0
  Audit: unaudited
- [ ] `alg.log.no-sum` Reject a false logarithm rule for addition.
  Example: ln(x+y) is generally not ln(x)+ln(y)
  Audit: unaudited
- [ ] `alg.log.domain` Check each logarithm's argument before solving.
  Example: ln(x-1)+ln(x+1) requires x>1
  Audit: unaudited
- [x] `alg.exp.solve` Solve the bounded exponential equation two-to-x equals seven. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 2^x=7 → x=ln(7)/ln(2)
  Audit: implemented
- [ ] `alg.exp.common-base` Solve an exponential equation by matching bases.
  Example: 2^(x+1)=8 → x+1=3 → x=2
  Audit: unaudited
- [ ] `alg.exp.growth` Relate repeated multiplicative growth to an exponential.
  Example: P_n=P_0(1+r)^n; r>-1
  Audit: unaudited
- [ ] `alg.exp.continuous` Relate continuous growth rate to doubling time.
  Example: P(t)=P_0 e^(kt) → t_double=ln(2)/k; P_0,k>0
  Audit: unaudited
- [ ] `alg.log.scale` Interpret differences on a logarithmic axis as ratios.
  Example: ln(20)-ln(10)=ln(2), regardless of absolute scale
  Audit: unaudited

### Visual motifs

- [x] `motif.alg.log-product` Split a logarithm wrapper while preserving argument identities. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: ln(xy) branches into ln(x) and ln(y)
  Audit: implemented
- [x] `motif.alg.log-quotient` Fuse logarithm shells into a quotient relation. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: Subtraction licenses a fraction bar but is not that bar
  Audit: implemented
- [x] `motif.alg.log-exponent` Extract exponent meaning into a coefficient while retaining the base. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: x descends from the exponent of 2 into x ln(2)
  Audit: implemented
- [x] `motif.alg.log-base` Carry argument and base into distinct slots of a log ratio. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: 7 enters ln(7) above ln(2)
  Audit: implemented
