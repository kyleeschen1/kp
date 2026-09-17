# Algebra

## Complex numbers, coordinates and sequences

### Semantic moves

- [ ] `alg.complex.arithmetic` Add and multiply complex numbers by their real/imaginary parts.
  Example: (1+i)(1-i)=2; i²=-1
  Audit: unaudited
- [ ] `alg.complex.divide` Divide complex numbers using the conjugate.
  Example: 1/(1+i)=(1-i)/2
  Audit: unaudited
- [ ] `alg.complex.polar` Relate rectangular and polar forms.
  Example: 1+i=√2(cos(π/4)+i sin(π/4))
  Audit: unaudited
- [ ] `alg.complex.multiply-polar` Multiply magnitudes and add arguments.
  Example: r e^(iθ) s e^(iφ)=rs e^(i(θ+φ))
  Audit: unaudited
- [ ] `alg.complex.roots` Find all complex nth roots.
  Example: z³=1 has arguments 0, 2π/3, 4π/3
  Audit: unaudited
- [ ] `alg.coordinate.line` Convert between slope and implicit forms of a line.
  Example: y=2x+3 ↔ 2x-y+3=0
  Audit: unaudited
- [ ] `alg.coordinate.distance` Compute Euclidean distance and midpoint.
  Example: (0,0),(3,4) → distance 5, midpoint (1.5,2)
  Audit: unaudited
- [ ] `alg.coordinate.conic` Complete squares to identify a circle or conic.
  Example: x²+y²-2x=0 → (x-1)²+y²=1
  Audit: unaudited
- [ ] `alg.sequence.arithmetic` Relate a constant difference to an explicit nth term.
  Example: a_n=a_1+(n-1)d
  Audit: unaudited
- [ ] `alg.sequence.geometric` Relate a constant ratio to an explicit nth term.
  Example: a_n=a_1 r^(n-1)
  Audit: unaudited
- [ ] `alg.sequence.sum-arithmetic` Sum an arithmetic progression.
  Example: 1+...+n=n(n+1)/2
  Audit: unaudited
- [ ] `alg.sequence.sum-geometric` Sum a finite geometric progression.
  Example: 1+r+...+r^(n-1)=(1-r^n)/(1-r); r≠1
  Audit: unaudited
- [ ] `alg.sequence.sigma` Expand finite summation while respecting the index. [Evidence](../../repertoire-notes/algebra-audit.md)
  Example: Σ from k=1 to 3 of k² → 1²+2²+3²
  Audit: partial — finite-sum exemplar exists; this specific source not verified
- [ ] `alg.sequence.reindex` Reindex a sum without changing the terms.
  Example: Σ from k=1 to n of a_k = Σ from j=0 to n-1 of a_(j+1)
  Audit: unaudited
- [ ] `alg.sequence.recurrence` Unroll a recurrence to reveal dependency on earlier states.
  Example: a_(n+1)=2a_n+1, a_0=0 → 0,1,3,7
  Audit: unaudited
- [ ] `alg.binomial` Expand a binomial using combinatorial coefficients.
  Example: (a+b)³=a³+3a²b+3ab²+b³
  Audit: unaudited

### Visual motifs

- [ ] `motif.alg.complex-rotate` Connect complex multiplication to scaling and rotation.
  Example: Multiplication by i rotates a vector by π/2
  Audit: unaudited
- [ ] `motif.alg.sequence-index` Keep index bindings distinct from the values they select.
  Example: Renaming a bound index preserves the selected terms
  Audit: unaudited
- [ ] `motif.alg.sequence-unroll` Expose recurrence dependencies while retaining the compact rule.
  Example: Each term points to the prior term it uses
  Audit: unaudited
