# Linear algebra

## Linear systems and subspaces

### Semantic moves

- [ ] `la.system.row-operation` Apply a reversible elementary row operation.
  Example: R₂←R₂-2R₁ preserves the solution set
  Audit: unaudited
- [ ] `la.system.eliminate` Reduce a system with pivots and back substitution.
  Example: An upper triangular system exposes the last variable first
  Audit: unaudited
- [ ] `la.system.rank` Use pivots to identify rank and free variables.
  Example: A zero coefficient row with nonzero RHS means inconsistency
  Audit: unaudited
- [ ] `la.system.nullspace` Parameterize all solutions of a homogeneous system.
  Example: Ax=0 → x is a combination of nullspace basis vectors
  Audit: unaudited
- [ ] `la.system.affine` Separate a particular solution from homogeneous freedom.
  Example: Ax=b → x=x_p+z, Az=0
  Audit: unaudited
- [ ] `la.space.span` Distinguish span from independence.
  Example: Three vectors in R² can span R² but cannot be independent
  Audit: unaudited
- [ ] `la.space.basis` Extract a basis without changing the spanned space.
  Example: Discard a vector already in the span of retained vectors
  Audit: unaudited
- [ ] `la.space.rank-nullity` Relate dimension of input, kernel and image.
  Example: rank(A)+nullity(A)=number of columns
  Audit: unaudited
- [ ] `la.space.fundamental` Relate row space, column space and orthogonal complements.
  Example: Null(A) is orthogonal to the row space
  Audit: unaudited
- [ ] `la.system.factorization` Reuse elimination as an LU factorization.
  Example: Solve Ax=b via Ly=b then Ux=y when A=LU
  Audit: unaudited

### Visual motifs

- [ ] `motif.la.elimination` Keep row-operation provenance visible across all columns.
  Example: The RHS changes under the same row combination
  Audit: unaudited
- [ ] `motif.la.free-directions` Expose free directions without moving the fixed solution offset.
  Example: An affine solution set is a translated nullspace
  Audit: unaudited
