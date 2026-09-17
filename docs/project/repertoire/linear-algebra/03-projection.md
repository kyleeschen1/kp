# Linear algebra

## Projection and least squares

### Semantic moves

- [ ] `la.proj.line` Project onto a nonzero direction.
  Example: proj_u(v)=(u·v)/(u·u) u
  Audit: unaudited
- [ ] `la.proj.residual` Split a vector into parallel and perpendicular parts.
  Example: v=proj_u(v)+r with u·r=0
  Audit: unaudited
- [ ] `la.proj.closest` Relate orthogonality to minimum Euclidean distance.
  Example: The closest point in a subspace has an orthogonal residual
  Audit: unaudited
- [ ] `la.proj.gram-schmidt` Build an orthonormal basis by subtracting previous projections.
  Example: v₂→v₂-(q₁·v₂)q₁, then normalize if nonzero
  Audit: unaudited
- [ ] `la.proj.least-squares` Derive the normal equations from residual orthogonality.
  Example: Aᵀ(Ax-b)=0
  Audit: unaudited
- [ ] `la.proj.qr` Solve least squares using orthogonal coordinates.
  Example: For full column rank A=QR, solve Rx=Qᵀb
  Audit: unaudited

### Visual motifs

- [ ] `motif.la.projection` Retain the original vector while exposing its projection and residual.
  Example: A right-angle relation justifies the decomposition
  Audit: unaudited
- [ ] `motif.la.residual` Coordinate each data residual with its aggregate squared error.
  Example: The fit changes while the original observations remain
  Audit: unaudited
