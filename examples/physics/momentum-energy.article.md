---
kp:
  schema: kp.article.v1
  id: lesson.physics.momentum-energy
  imports:
    straight: vignette.physics.momentum-energy-straight@1
    turning: vignette.physics.momentum-energy-turning@1
---

# Force, momentum and energy: how the relationships fit together

Push a cart and it speeds up. Stop pushing and, if resistance is negligible,
it keeps moving. Brake it and it slows down. Force, momentum and energy let us
ask different questions about this same event. Why do we need all three?

Our route is algebraic: start with three relationships, substitute to connect
them, differentiate to find what changes, and integrate to accumulate that
change. The equations are the argument; the moving figures are examples you
can inspect afterward.

:::kp-passage{#model-scope}
**Assumptions.** Treat the cart as a Newtonian point particle of fixed positive
mass $m$, viewed in one inertial frame: a reference frame in which a free
particle moves at constant velocity. We ignore rotation and deformation.
Throughout, $\mathbf F$ means the **net force**, the vector sum of the forces
acting on the particle. We discuss kinetic energy $K$, not every form of energy.
:::

## Three starting relationships

Velocity $\mathbf v=d\mathbf r/dt$ describes how position changes. It is a
vector: its direction tells us where the particle is heading, and its magnitude
$\lVert\mathbf v\rVert$ is speed. Double bars denote the Euclidean norm: the length
of a vector. Bold symbols below are vectors; $m$ and $K$ are scalars.

:::kp-passage{#momentum-definition}
{{kp-concept:physics.newtonian-momentum@1.0.0/definition}}

We will reuse this definition in the energy calculation.

{{kp-concept:physics.newtonian-momentum@1.0.0/velocity}}

**Why may we divide by mass?**

{{kp-concept:physics.newtonian-momentum@1.0.0/division}}
:::

**Definition in this model — kinetic energy.** Associate a scalar with motion:

$$K=\frac12m\lVert\mathbf v\rVert^2.$$

Why this expression is useful, rather than merely another way to label speed,
will emerge when we connect its change to work. Energy also includes forms
other than kinetic energy; that broader accounting comes later.

**Physical law — Newton's second law.** Interactions change momentum:

$$\frac{d\mathbf p}{dt}=\mathbf F.$$

This is a physical claim about the model, not an algebraic consequence of the
two definitions. With fixed mass it gives $\mathbf F=m\,d\mathbf v/dt=m\mathbf a$.
If the net force is zero, momentum stays constant; it need not be zero.
Continuing motion does not require continuing net force.

:::kp-passage{#relationship-map}
## The route at a glance

These are the three connections we will build. Read the whole route, or jump
to the reason behind a particular move.

**Substitute:** describe kinetic energy directly in terms of momentum.

$$\mathbf v=\frac{\mathbf p}{m}
\quad\Longrightarrow\quad K=\frac{\lVert\mathbf p\rVert^2}{2m}.$$

[Inspect the substitution](#energy-from-momentum).

**Differentiate:** use Newton's law to connect force to energy change.

$$\frac{dK}{dt}
=\frac{\mathbf p}{m}\cdot\frac{d\mathbf p}{dt}
=\mathbf v\cdot\mathbf F.$$

[Inspect the differentiation](#force-to-energy).

**Accumulate:** force over time gives impulse; force along displacement gives work.

$$\Delta\mathbf p=\int_{t_0}^{t_1}\mathbf F\,dt,$$

$$\Delta K=\int_{t_0}^{t_1}\mathbf F\cdot\mathbf v\,dt=W_{\mathrm{net}}.$$

[Inspect the accumulation](#impulse-and-work).
:::

:::kp-passage{#energy-from-momentum}
## 1. Substitute: energy in terms of momentum

**Deduction.** Since $m>0$, rearrange $\mathbf p=m\mathbf v$ and substitute:

$$\begin{aligned}
K&=\frac12m\lVert\mathbf v\rVert^2\\
 &=\frac12m\left\lVert\frac{\mathbf p}{m}\right\rVert^2\\
 &=\frac12m\frac{\lVert\mathbf p\rVert^2}{m^2}\\
 &=\frac{\lVert\mathbf p\rVert^2}{2m}.
\end{aligned}$$

The squared magnitude divides by $m^2$, not $m$. One factor of $m$ then cancels.
No new physics entered: this is the same energy written using a different variable.

The equation also tells us what information energy leaves out. For fixed mass,
$K$ depends on the **length** of the momentum vector, not its direction. Inverting
gives $\lVert\mathbf p\rVert=\sqrt{2mK}$, but does not recover the direction of $\mathbf p$.

**Ask what is held fixed.** At equal speed, doubling mass doubles kinetic energy:
$K=mv^2/2$. At equal momentum magnitude, doubling mass halves kinetic energy:
$K=\lVert\mathbf p\rVert^2/(2m)$. These are not contradictory predictions; they compare
different situations. Here $v=\lVert\mathbf v\rVert$ denotes speed.

[Back to the relationship map](#relationship-map).
:::

:::kp-passage{#force-to-energy}
## 2. Differentiate: how force changes energy

Momentum can change in size, direction, or both. Energy tracks only its squared
size. To find which changes matter, take the time derivative of the energy we
just derived. Write $K=(\mathbf p\cdot\mathbf p)/(2m)$: the two factors are the
same changing vector, so **both contribute to the derivative**.

Keep the positive mass constant. Below, $\dot{\mathbf p}$ means
$d\mathbf p/dt$ (a dot **over** a vector is a time derivative; the dot **between**
vectors is a dot product). Start with the derivative still unevaluated:

$$\begin{aligned}
\frac{dK}{dt}&=\frac{1}{2m}\frac{d}{dt}(\mathbf p\cdot\mathbf p)\\
 &=\frac{\mathbf p}{m}\cdot\dot{\mathbf p}.
\end{aligned}$$

The product rule gives $\dot{\mathbf p}\cdot\mathbf p+\mathbf p\cdot\dot{\mathbf p}$.
Symmetry of the dot product makes these two terms equal, and their factor of
$2$ cancels the denominator's $2$. This part is calculus, not a new physical law.

**Now use the physical model.** Recall [$\mathbf p/m=\mathbf v$](#momentum-definition).
Newton's law identifies $\dot{\mathbf p}$ with the **net** force $\mathbf F$.
Substituting those two meanings gives

$$\frac{dK}{dt}=\mathbf v\cdot\mathbf F.$$

[Why does only force along velocity matter?](#power-correspondence)

[See the geometry: energy circles in momentum space](#momentum-space).

This dot product is not unfamiliar calculus in disguise. In Cartesian
components, it is $F_xv_x+F_yv_y+F_zv_z$. Geometrically, for nonzero vectors,
it is $\lVert\mathbf F\rVert\lVert\mathbf v\rVert\cos\theta$, where $\theta$ is their angle.
It measures the force component along velocity, multiplied by speed.

So a force component along the motion increases kinetic energy; an opposing
component decreases it. A perpendicular force contributes zero instantaneous
power, even though it can change the momentum's direction. At an instant of
rest the power is also zero; a force can nevertheless start accelerating the
particle, after which the energy can grow.

The rate $dK/dt$ is the **net power delivered to the particle's kinetic energy**.
We have connected a vector law about changing momentum to a scalar account of
changing kinetic energy. The diagram will illustrate this deduction, not prove it.

**Try the distinction:** a particle is moving right. Would an upward force,
acting perpendicular to its velocity at that instant, increase its kinetic
energy immediately? No: its instantaneous power is zero. The force still
changes momentum. If its direction is held fixed while velocity turns, the
force need not remain perpendicular later.

[Back to the relationship map](#relationship-map).
:::

:::kp-passage{#momentum-move}
Momentum can change direction while its magnitude—and therefore kinetic energy—stays constant.

### direction
**Momentum changes direction.** Follow the arrow as it turns. These are different
momenta: a vector includes direction, not just length.

### magnitude
**Its magnitude stays the same.** The tip stays on one circle around zero.
The distance from zero—the arrow’s length—does not change.

### energy
**Therefore kinetic energy stays the same.** For this fixed mass,
$K=\lVert\mathbf p\rVert^2/(2m)$ depends on that unchanged length. The change in
direction contributes no change in energy.
:::

:::kp-passage{#momentum-space}
## How can momentum change while energy stays the same?

Move the tip of a momentum arrow without changing its length. Its direction
changes, but its kinetic energy does not. We can make that distinction visible
by drawing **momentum space**: each point represents a momentum, not a place
the particle visits. The origin means zero momentum. Here the mass is fixed at
$m=1.00$ kg, and $K=\lVert\mathbf p\rVert^2/(2m)$.

### Read distance as energy

The arrow runs from zero to the particle’s momentum. Every point on a circle
has the same distance from zero, so it has the same kinetic energy. The outer
circle has twice the radius and **four times the energy**.

### Push outward

In the straight push, the momentum tip moves outward from the inner circle to
the outer one. Its growing distance from zero is growing kinetic energy.
Force points along the tip’s motion because $\mathbf F=d\mathbf p/dt$.

### Turn without moving outward

In the circular-motion example, the momentum tip follows the inner circle.
The arrow turns through a quarter turn but keeps its length. Force is tangent
to this circle: it changes the direction of momentum without changing energy.
The tangent describes the **instantaneous** direction; a finite straight step
along that tangent would leave the circle.
:::

:::kp-passage{#momentum-space-conclusion}
Only the outward or inward part of force changes distance from zero. Since
$\mathbf p$ and $\mathbf v$ point in the same direction, this is also the part
along velocity. That is the geometry behind $dK/dt=\mathbf v\cdot\mathbf F$.

**Predict:** if the force points inward, toward zero momentum, is kinetic
energy increasing or decreasing at that instant?

It is decreasing: the momentum tip is moving toward smaller energy circles.

[Return to the force–energy argument](#force-to-energy).
:::

:::kp-passage{#power-correspondence}
## Why does only force along velocity matter?

Read the same dot product in two situations. The blue momentum arrow gives the
velocity direction because $\mathbf p=m\mathbf v$ with positive mass; its length
still measures momentum, not speed. The brown arrow is net force, on a separate
scale. Each sketch below is one checked instant, not an animation you need to watch.

### Speed and direction

For a moving particle, velocity supplies a direction and a speed
$\lVert\mathbf v\rVert$. First locate that direction in each sketch. A changing
direction is already a change in momentum, even when speed stays constant.

### Force along motion

$F_{\parallel}$ means the **signed component of force along velocity**.
In the straight push, all the force points along motion: $F_{\parallel}=2$ N.
In the turn, force is perpendicular: $F_{\parallel}=0$ N despite a nonzero force.
The right angle is the geometric reason for the zero; zero force is not the reason.

### Energy change

Now read the product: $dK/dt=\lVert\mathbf v\rVert F_{\parallel}$.
In the push, $2\times2=4$ J of kinetic energy are added per second at this instant.
In the turn, $1\times0=0$: momentum changes direction, but kinetic energy does not
change. This is an energy **rate**, not the amount of energy the particle has.
At rest there is no velocity direction; use $\mathbf v\cdot\mathbf F=0$ directly.
:::

:::kp-passage{#impulse-and-work}
## 3. Accumulate: impulse and work

Here we reuse the same relationship for a different purpose: once impulse tells
us the final momentum, it also tells us the final velocity for a known mass.

{{kp-concept:physics.newtonian-momentum@1.0.0/reminder}}

**Definitions of interval quantities.** Impulse accumulates net force over time;
net work accumulates its dot product with the actual displacement:

$$\mathbf J=\int_{t_0}^{t_1}\mathbf F(t)\,dt,$$

$$W_{\mathrm{net}}=\int_{\mathbf r(t_0)}^{\mathbf r(t_1)}
\mathbf F\cdot d\mathbf r.$$

The work integral follows the particle's actual path, not an arbitrary straight
line between endpoints. Since $d\mathbf r=\mathbf v\,dt$, we can use time to
describe that same accumulation. Now integrate the two rate equations:

$$\begin{aligned}
\mathbf J&=\int_{t_0}^{t_1}\frac{d\mathbf p}{dt}\,dt
=\mathbf p(t_1)-\mathbf p(t_0),\\
W_{\mathrm{net}}&=\int_{t_0}^{t_1}\mathbf F\cdot\mathbf v\,dt\\
 &=\int_{t_0}^{t_1}\frac{dK}{dt}\,dt
=K(t_1)-K(t_0).
\end{aligned}$$

**Deductions — impulse–momentum and work–energy.** These are the fundamental
theorem of calculus applied to the relationships we already established.
They are not extra independent laws to memorize.

This is why the descriptions are useful: momentum change tracks the accumulated
vector effect of force; kinetic-energy change tracks net work along the motion.
They answer different questions about the same event. Force history alone does
not specify work without the motion or enough information to determine it.
Net work is not automatically the work done by any single force.

[Back to the relationship map](#relationship-map).
:::

## Inspect a straight push

Use the figure to check the connections we derived. It represents the same
particle in each view, with time as the shared coordinate.

Read the dot product as **speed × the component of force along motion**.
The second factor asks how much of the force points in the direction of velocity.
Since $\mathbf p=m\mathbf v$ with positive mass, the momentum arrow also shows
that direction. Its length is momentum, not speed; the two have different units.
At rest there is no velocity direction, but $\mathbf v\cdot\mathbf F=0$ still
makes sense directly. The local power reading uses that zero-vector case.

:::kp-stage{#straight use=straight}
:::

:::kp-motion{#speed-up stage=straight run=straight/advance}
Start a 1 kg particle from rest with constant net force $(2,0)$ N. Advance time:
the brown force stays constant, while the blue momentum arrow grows. Once the
particle is moving, both arrows point the same way, so all 2 N contribute to
power. Watch **speed × 2 N** increase: the same force adds more energy each
second as the particle speeds up.

::after

After 2 s, momentum is $(4,0)$ kg m/s and kinetic energy is 8 J. The impulse
is $(2,0)\times2=(4,0)$ kg m/s. The particle travels 4 m in the force's
direction, so net work is $2\times4=8$ J. One event satisfies both accounts.
Here $\mathbf p(t)=(2t,0)$ and $K(t)=2t^2$: doubling momentum magnitude
quadruples kinetic energy, rather than merely doubling it.
:::

## Inspect a turn

Now the initially puzzling case has a place in the map: changing direction
changes momentum without necessarily changing its magnitude or kinetic energy.
Watch the small right-angle marker: it rotates with the particle, but the angle
between force and velocity stays perpendicular. That persistence, not the
particle standing still, is why the force contributes no instantaneous power.

:::kp-stage{#turning use=turning}
:::

:::kp-motion{#turn stage=turning run=turning/advance}
Keep a 1 kg particle moving at 1 m/s around a circle of radius 1 m. Follow the
momentum arrow as it turns without changing length. The inward force remains
perpendicular to it: $\mathbf F\cdot\mathbf v=0$, while
$K=\lVert\mathbf p\rVert^2/(2m)=0.5$ J throughout.

::after

Across a quarter circle, momentum changes from $(0,1)$ to $(-1,0)$ kg m/s.
The impulse is therefore $\Delta\mathbf p=(-1,-1)$ kg m/s. Yet
$W_{\mathrm{net}}=\Delta K=0$: a nonzero impulse need not mean nonzero work.
Energy alone cannot tell us the new direction.
:::

## What to carry forward

Momentum describes directed motion. Net force governs how it changes. Kinetic
energy describes a scalar aspect of that motion, and its change is net work.
The connections come from substitution, differentiation and accumulation under
our stated model—not from visual resemblance between formulas.

Try reading $K=\lVert\mathbf p\rVert^2/(2m)$ without the figures: at fixed mass, doubling
momentum magnitude quadruples kinetic energy; reversing direction at unchanged
magnitude leaves it unchanged. That is information you can extract directly
from the algebra.

These results are not a complete energy account for an object that rotates,
deforms or heats, and the fixed-mass derivation cannot be carried unchanged
into a mass-exchanging system. [Revisit the assumptions](#model-scope) or
[recover the compact relationship map](#relationship-map).
