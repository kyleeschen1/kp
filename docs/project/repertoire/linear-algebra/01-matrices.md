# Linear algebra

## Vectors, matrices and linear maps

### Semantic moves

- [ ] `la.vector.components` Separate a geometric vector from its coordinate tuple.
  Example: The same vector has different coordinates in different bases
  Audit: unaudited
- [ ] `la.vector.linear-combination` Express a vector as a linear combination.
  Example: (3,2)=3(1,0)+2(0,1)
  Audit: unaudited
- [ ] `la.vector.dot` Interpret the dot product through lengths and angle.
  Example: u·v=||u||||v||cos θ
  Audit: unaudited
- [ ] `la.vector.cross` Use an oriented cross product in three dimensions.
  Example: e₁×e₂=e₃; swapping operands negates it
  Audit: unaudited
- [x] `la.matrix.multiply-vector` Compute a matrix-vector product — canonical two-by-two caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: [[2,1],[0,3]]·[4,5] → [13,15]
  Audit: implemented
- [x] `la.matrix.columns` Interpret columns as mapped basis vectors — canonical caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: T(e₁)=(2,0), T(e₂)=(1,3)
  Audit: implemented
- [x] `la.matrix.rows` Interpret rows as output-coordinate functionals — canonical caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: First output coordinate is 2v₁+v₂
  Audit: implemented
- [ ] `la.matrix.linearity` Check preservation of addition and scalar multiplication.
  Example: T(au+bv)=aT(u)+bT(v)
  Audit: unaudited
- [ ] `la.matrix.compose` Compose maps in the correct matrix order.
  Example: Apply B then A → AB; generally AB≠BA
  Audit: unaudited
- [ ] `la.matrix.transpose` Relate transposition to index exchange and dot products.
  Example: (AB)ᵀ=BᵀAᵀ
  Audit: unaudited
- [ ] `la.matrix.inverse` Use an inverse only for an invertible square map.
  Example: A⁻¹Av=v; singular A has no two-sided inverse
  Audit: unaudited
- [ ] `la.matrix.basis-change` Change coordinates while preserving the represented map.
  Example: [T]_new=P⁻¹[T]_old P for one basis change
  Audit: unaudited

### Visual motifs

- [x] `motif.la.row-column` Coordinate row arithmetic and geometric action — two-by-two caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: Both views refer to the same output vector
  Audit: implemented
- [ ] `motif.la.fixed-vector` Keep a vector fixed while its coordinate frame changes.
  Example: Coordinate labels change without implying physical motion
  Audit: unaudited
- [ ] `motif.la.compose` Track an intermediate vector through two maps.
  Example: Bv remains the input to A
  Audit: unaudited
