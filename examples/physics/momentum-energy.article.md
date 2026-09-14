---
kp:
  schema: kp.article.v1
  id: lesson.physics.momentum-energy
  imports:
    straight: vignette.physics.momentum-energy-straight@1
    turning: vignette.physics.momentum-energy-turning@1
---

# How can a force change momentum without changing kinetic energy?

Imagine guiding a moving puck around a bend without making it go any faster.
Its motion changes: it leaves in a different direction. Yet its speed stays the
same. Has the force changed its momentum, its kinetic energy, or both?

The distinction matters when choosing what to calculate. Momentum keeps track
of **which way** something moves as well as how fast. Kinetic energy describes
its motion using **speed alone**. Turning exposes the information that energy
leaves out.

## Two descriptions of the same motion

Velocity, $\mathbf v$, is an arrow: its direction tells us where the object is
heading and its length represents speed. For a particle of constant mass $m$,
momentum is that arrow multiplied by mass:

$$\mathbf p=m\mathbf v.$$

Kinetic energy is a number, not an arrow:

$$K=\tfrac12m|\mathbf v|^2.$$

Changing direction changes the velocity arrow and therefore the momentum
arrow. It need not change the arrow's length, so it need not change kinetic
energy. This is the first part of the answer. Now ask what the force must do.

## First, push along the motion

:::kp-stage{#straight use=straight}
:::

:::kp-motion{#speed-up stage=straight run=straight/advance}
Start a 1 kg particle from rest and push right with a constant net force of
2 newtons. As time passes, its rightward momentum grows and its kinetic energy
grows. Follow the length of the momentum arrow; its direction stays fixed.

::after

After 2 seconds the momentum is $(4,0)$ kg m/s, speed is 4 m/s, and kinetic
energy is 8 joules. During the same interval the particle moves 4 metres, so
the force does 8 joules of net work. This example makes the quantities change
together—but that is not a rule that they must always do so.
:::

## Now, turn without speeding up

:::kp-stage{#turning use=turning}
:::

:::kp-motion{#turn stage=turning run=turning/advance}
Keep a 1 kg particle moving at 1 m/s around a circle of radius 1 metre. The
momentum arrow points along its motion. The net force points inward, at right
angles to that arrow. Follow the momentum arrow as it turns: its direction
changes while its length stays the same.

::after

Across a quarter circle, momentum changes from $(0,1)$ to $(-1,0)$ kg m/s.
Its change is $(-1,-1)$ kg m/s—not zero. Kinetic energy stays at half a joule.
There is a force throughout, but it does no net work on the particle.
:::

## What makes the two cases different?

Net force is the rate of change of the **momentum vector**:

$$\frac{d\mathbf p}{dt}=\mathbf F.$$

The rate of change of kinetic energy is instead

$$\frac{dK}{dt}=\mathbf F\cdot\mathbf v.$$

The dot product measures the part of the force along the velocity, multiplied
by speed. A force along the motion increases kinetic energy; an opposing
component decreases it. A perpendicular force contributes zero at that instant.
In circular motion it remains perpendicular throughout, so the energy stays
constant even while momentum keeps changing.

This is not an extra rule to memorize. Differentiate
$K=\tfrac12m\mathbf v\cdot\mathbf v$ with constant $m$:

$$\frac{dK}{dt}=m\frac{d\mathbf v}{dt}\cdot\mathbf v=\mathbf F\cdot\mathbf v.$$

Only the component that changes speed enters the energy calculation. Momentum
still records the turning that the energy calculation leaves out.

## Accumulate the change

Over an interval, accumulating force **over time** gives momentum change:

$$\Delta\mathbf p=\int\mathbf F\,dt.$$

Accumulating force **along the actual displacement** gives net work and kinetic
energy change:

$$\Delta K=\int\mathbf F\cdot\mathbf v\,dt=\int\mathbf F\cdot d\mathbf r=W_{\mathrm{net}}.$$

These are two ways of asking about the same motion, not competing laws. Force
history alone does not tell you the work: you also need the motion. If you want
to know the new direction, energy alone has discarded information you need.

We have treated a constant-mass Newtonian point particle in one fixed inertial
frame. Work here means work by the **net** force, not automatically by any one
force, and these statements are not a complete energy account for a deforming
or heating object.
