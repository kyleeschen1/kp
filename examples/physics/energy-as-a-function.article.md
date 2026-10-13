---
kp:
  schema: kp.article.v1
  id: lesson.physics.energy-as-a-function
  imports:
---

# What does energy keep—and what does it leave out?

Momentum describes both how much motion a particle has and which way it is
moving. Kinetic energy is a single number. Turning one into the other must leave
something out. What is it?

We will first rewrite energy in terms of momentum, then ask which changes in
momentum change that energy. Drag an equation down its rail to inspect a
derivation; drag back to retrace it. The written argument stays in place.

:::kp-passage{#model-scope}
We use a Newtonian particle of fixed positive mass $m$ in an inertial frame.
Bold symbols are vectors. $K$ is kinetic energy and $\mathbf F$ is net force.
The argument assumes elementary derivatives and the product rule.
:::

:::kp-passage{#momentum-definition}
## Start with the connection to velocity

{{kp-concept:physics.newtonian-momentum@1.0.0/definition}}

We can recover velocity because the mass is positive:

{{kp-concept:physics.newtonian-momentum@1.0.0/velocity}}

{{kp-concept:physics.newtonian-momentum@1.0.0/division}}
:::

:::kp-passage{#energy-from-momentum}
## A vector becomes a number

Substitute the whole velocity vector into the kinetic-energy definition.
The square applies to the divisor as well as the vector's length. Follow that
mass factor through the derivation, or open the smaller steps to inspect it.

{{kp-derivation:physics.energy-from-momentum@1}}

At fixed mass, energy keeps the **squared length** of momentum. It does not keep
its direction. Two particles with equal mass and equally long momentum vectors
can have the same kinetic energy while moving in different directions.

Before continuing, predict: if momentum doubles in length while mass stays
fixed, what happens to kinetic energy? The square makes it four times as large.
:::

:::kp-passage{#force-to-energy}
## Which changes survive that conversion?

Write squared length as $\mathbf p\cdot\mathbf p$. When momentum changes,
both copies change. The product rule accounts for both contributions.
A dot above a symbol means its time derivative; a dot between vectors is their
dot product.

{{kp-derivation:physics.force-to-energy@1}}

Now use $\mathbf p/m=\mathbf v$ and Newton's law,
$\dot{\mathbf p}=\mathbf F$. The result is
$dK/dt=\mathbf v\cdot\mathbf F$: speed times the signed component of force
along the motion.

A perpendicular force can turn the momentum without changing energy at that
instant. A force opposing the motion decreases energy. Perpendicular at one
instant does not mean perpendicular throughout an interval.
:::

:::kp-passage{#takeaway}
## Keep the two questions separate

**What is the energy?** The first rail connects the current momentum to a number.
**How is energy changing?** The second connects the changing momentum to a rate.

This distinction will matter whenever we compose a model with a measurement:
the measurement may retain some changes and discard others. Here the equations
let us say exactly which ones.
:::
