# Classical mechanics

## Measurement, vectors and kinematics

### Semantic moves

- [ ] `mech.units` Check dimensional consistency before manipulating a physical equation.
  Example: v² and gh both have units of length²/time²
  Audit: unaudited
  Uses: alg.units.dimension
- [ ] `mech.frame` State the reference frame and coordinate convention.
  Example: Velocity is measured relative to a named frame
  Audit: unaudited
- [ ] `mech.position` Distinguish position, displacement and distance traveled.
  Example: A round trip can have zero displacement but positive traveled distance
  Audit: unaudited
- [ ] `mech.velocity` Relate position change to velocity.
  Example: v=dr/dt; speed=||v||
  Audit: unaudited
- [ ] `mech.acceleration` Relate velocity change to acceleration without equating it with speeding up.
  Example: Perpendicular acceleration can turn a velocity at fixed speed
  Audit: unaudited
- [ ] `mech.constant-acceleration` Integrate constant acceleration with initial data.
  Example: x=x₀+v₀t+(1/2)at² under constant a
  Audit: unaudited
- [ ] `mech.projectile` Separate horizontal and vertical components under uniform gravity.
  Example: x=x₀+v_x0 t, y=y₀+v_y0 t-gt²/2 without drag
  Audit: unaudited
- [ ] `mech.relative` Compose Galilean positions and velocities between inertial frames.
  Example: v_AB=v_AC-v_BC
  Audit: unaudited
- [ ] `mech.circular` Relate angular speed, tangential speed and centripetal acceleration.
  Example: v=rω and a_c=v²/r for uniform circular motion
  Audit: unaudited
- [ ] `mech.coordinates` Track changing basis directions in polar-coordinate motion.
  Example: v=r_dot e_r+r θ_dot e_θ
  Audit: unaudited
- [ ] `mech.constraints` Translate a geometric constraint into dependent coordinates.
  Example: A fixed-length pendulum has one angular degree of freedom
  Audit: unaudited

### Visual motifs

- [ ] `motif.mech.vector-change` Separate a vector from its change vector.
  Example: A curved path and a velocity arrow answer different questions
  Audit: unaudited
- [ ] `motif.mech.frame` Retain the physical event while changing the observer's coordinates.
  Example: Frame change must not look like an extra force
  Audit: unaudited
- [ ] `motif.mech.components` Coordinate vector components with the same physical quantity.
  Example: Two component arrows do not imply two objects
  Audit: unaudited
