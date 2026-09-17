# Calculus and multivariable calculus

## Several variables and vector calculus

### Semantic moves

- [x] `calc.multi.partial` Differentiate with one coordinate held fixed — quadratic contour caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: For f=x²+2y², f_x=2x and f_y=4y
  Audit: implemented
- [x] `calc.multi.total` Assemble the total differential — quadratic contour caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: df=2x dx+4y dy; a local first-order approximation
  Audit: implemented
- [x] `calc.multi.direction` Compute a directional derivative using a unit direction — contour caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: D_u f=∇f·u; ||u||=1
  Audit: implemented
- [x] `calc.multi.gradient` Relate the gradient to steepest first-order ascent — regular contour point. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: At (1,0.5), ∇(x²+2y²)=(2,2)
  Audit: implemented
- [x] `calc.multi.tangent` Distinguish zero first-order change from finite constant height — contour caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: A straight tangent step need not stay on the level curve
  Audit: implemented
- [ ] `calc.multi.chain` Apply the multivariable chain rule along a path.
  Example: d f(x(t),y(t))/dt=f_x x′+f_y y′
  Audit: unaudited
- [ ] `calc.multi.jacobian` Represent a local vector-valued map by its Jacobian.
  Example: ΔF≈J_F Δx
  Audit: unaudited
- [ ] `calc.multi.hessian` Classify a stationary point using second-order behavior.
  Example: A positive-definite Hessian gives a strict local minimum
  Audit: unaudited
- [ ] `calc.multi.double` Set up and reorder a double integral over a region.
  Example: 0≤y≤x≤1 becomes 0≤y≤1, y≤x≤1
  Audit: unaudited
- [ ] `calc.multi.change-variables` Include the Jacobian magnitude in a coordinate change.
  Example: dx dy = r dr dθ in polar coordinates
  Audit: unaudited
- [ ] `calc.multi.triple` Accumulate a density over a three-dimensional region.
  Example: Mass = ∭ρ(x,y,z)dV
  Audit: unaudited
- [ ] `calc.multi.line` Distinguish scalar line accumulation from vector work.
  Example: ∫f ds versus ∫F·dr
  Audit: unaudited
- [ ] `calc.multi.conservative` Use a potential only under the required field/domain conditions.
  Example: F=∇φ → path work φ(B)-φ(A)
  Audit: unaudited
- [ ] `calc.multi.div-curl` Distinguish local outward flow from local circulation.
  Example: div F is scalar; curl F is a vector in 3D
  Audit: unaudited
- [ ] `calc.multi.green` Relate planar circulation to an interior double integral.
  Example: ∮P dx+Q dy = ∬(Q_x-P_y)dA with positive boundary orientation
  Audit: unaudited
- [ ] `calc.multi.stokes` Relate surface curl to oriented boundary circulation.
  Example: ∬(curl F)·n dS = ∮F·dr
  Audit: unaudited
- [ ] `calc.multi.divergence` Relate closed-surface flux to volume divergence.
  Example: ∯F·n dS = ∭div F dV; outward normal
  Audit: unaudited

### Visual motifs

- [x] `motif.calc.contour` Coordinate a surface, level curve and local direction — quadratic caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: Retain one point while comparing along/across-gradient change
  Audit: implemented
- [ ] `motif.calc.orientation` Keep boundary direction and surface normal consistent.
  Example: Reverse one orientation and account for the sign
  Audit: unaudited
- [ ] `motif.calc.jacobian` Relate a small source cell to its locally transformed area or volume.
  Example: Scaling a region differs from relabeling coordinates
  Audit: unaudited
