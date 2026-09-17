# Linear algebra

## Determinants, eigenvectors and decomposition

### Semantic moves

- [ ] `la.det.area` Interpret determinant as signed volume scale.
  Example: det([[2,0],[0,3]])=6
  Audit: unaudited
- [ ] `la.det.singular` Relate zero determinant to dimension collapse.
  Example: A square map with det A=0 is not invertible
  Audit: unaudited
- [ ] `la.eigen.definition` Identify directions preserved up to scale.
  Example: Av=λv with v≠0
  Audit: unaudited
- [ ] `la.eigen.solve` Find eigenvalues and their eigenspaces.
  Example: det(A-λI)=0, then solve (A-λI)v=0
  Audit: unaudited
- [ ] `la.eigen.diagonalize` Use an eigenbasis only when enough independent eigenvectors exist.
  Example: A=PDP⁻¹ enables A^n=PD^nP⁻¹
  Audit: unaudited
- [ ] `la.eigen.symmetric` Use orthogonal eigenvectors for real symmetric matrices.
  Example: A=QΛQᵀ
  Audit: unaudited
- [ ] `la.eigen.quadratic` Classify a quadratic form through its eigenvalue signs.
  Example: xᵀAx>0 for nonzero x when symmetric A is positive definite
  Audit: unaudited
- [ ] `la.svd` Interpret singular values as orthogonal stretch factors.
  Example: A=UΣVᵀ separates input directions, stretches and output directions
  Audit: unaudited
- [ ] `la.pca` Relate principal components to variance directions.
  Example: Center data before finding covariance eigenvectors
  Audit: unaudited
- [ ] `la.pseudoinverse` Use a pseudoinverse for least-squares/minimum-norm solutions.
  Example: x=A⁺b selects minimum norm among least-squares minimizers
  Audit: unaudited

### Visual motifs

- [ ] `motif.la.eigen` Contrast preserved directions with generic turning directions.
  Example: An eigenvector scales along its line
  Audit: unaudited
- [ ] `motif.la.svd` Separate rotation, stretch and rotation without changing the map.
  Example: All intermediate views compose to the same A
  Audit: unaudited
- [ ] `motif.la.rank` Show lost dimensions as a semantic collapse rather than mere fading.
  Example: A zero singular value removes one output degree of freedom
  Audit: unaudited
