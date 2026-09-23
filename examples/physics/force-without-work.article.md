---
kp:
  schema: kp.article.v1
  id: lesson.physics.force-without-work
  imports:
---

# Can a force change motion without changing energy?

A particle is moving to the right. A net force points upward. Its momentum
starts changing—but must its kinetic energy increase at that instant?

Follow two connections: first find what energy retains from momentum, then find
which part of a force changes it. The rails let you inspect the algebra without
leaving the argument. Open smaller steps only where a connection needs unpacking.

:::kp-passage{#model-scope}
**Our model.** One Newtonian particle of fixed positive mass $m$, observed in one
inertial frame. Bold symbols are vectors; $\lVert\mathbf p\rVert$ means the length
of the momentum vector. $\mathbf F$ is the **net force**, and $K$ is kinetic
energy. Rotation, deformation and internal energy are outside this model.

**The physical law we will use:** $d\mathbf p/dt=\mathbf F$. A nonzero force
changes momentum. That statement alone does not say whether its length changes.
:::

:::kp-passage{#momentum-definition}
## First, connect momentum to velocity

{{kp-concept:physics.newtonian-momentum@1.0.0/definition}}

To put this relationship inside the energy expression, solve for velocity:

{{kp-concept:physics.newtonian-momentum@1.0.0/velocity}}

{{kp-concept:physics.newtonian-momentum@1.0.0/division}}
:::

:::kp-passage{#energy-from-momentum}
## 1. Energy retains magnitude, not direction

Start with the kinetic-energy definition, $K=\tfrac12m\lVert\mathbf v\rVert^2$.
Replace the **whole velocity vector** with $\mathbf p/m$. Follow the square:
it acts on the mass divisor too. One mass factor then cancels.

$$\begin{aligned}
K&=\frac12m\lVert\mathbf v\rVert^2\\
 &=\frac12m\left\lVert\frac{\mathbf p}{m}\right\rVert^2\\
 &=\frac12m\frac{\lVert\mathbf p\rVert^2}{m^2}\\
 &=\frac{\lVert\mathbf p\rVert^2}{2m}.
\end{aligned}$$

At fixed mass, two momentum vectors with the same length have the same kinetic
energy, even if they point in different directions. Energy therefore cannot tell
us the full momentum vector. A turn is a change of motion it can leave out.

This makes unchanged energy **possible** during a turn. To decide whether a
particular force changes energy, we still need to connect force to this expression.
:::

:::kp-passage{#force-to-energy}
## 2. Force changes energy through its component along motion

Write the squared length as $\mathbf p\cdot\mathbf p$. Here the dot product of a
vector with itself is its squared length. Differentiate while holding mass fixed.
Both copies of $\mathbf p$ change; the product rule contributes two equal terms.
Inspect the step below to see where their factor of two goes.

A dot **over** $\mathbf p$ means its time derivative; a dot **between** vectors
means their dot product.

$$\begin{aligned}
\frac{dK}{dt}&=\frac{1}{2m}\frac{d}{dt}(\mathbf p\cdot\mathbf p)\\
 &=\frac{\mathbf p}{m}\cdot\dot{\mathbf p}.
\end{aligned}$$

Now reuse two meanings: $\mathbf p/m=\mathbf v$ from
the [momentum definition](#momentum-definition), and $\dot{\mathbf p}=\mathbf F$
from Newton's law. Thus

$$\frac{dK}{dt}=\mathbf v\cdot\mathbf F.$$

For a moving particle, this dot product is **speed times the signed component of
force along velocity**. Along the motion gives positive power, against it gives
negative power, and perpendicular gives zero. It measures an energy-change rate,
not the energy already present.
:::

:::kp-passage{#sideways-force}
## Return to the sideways force

At the instant in our question, velocity points right and force points up. The
force has no component along velocity, so $dK/dt=0$. Yet $d\mathbf p/dt=\mathbf F$
is nonzero: momentum changes direction. The two statements describe different
aspects of the same motion.

**“Perpendicular now” is not “perpendicular throughout.”** A force that keeps
pointing upward need not stay perpendicular once the velocity turns. Zero net
work over an interval follows if the net force stays perpendicular to velocity
throughout that interval: its instantaneous power then stays zero, so kinetic
energy does not change. Uniform circular motion is one example.

**Try a changed case.** The particle still moves right, but the net force points
up and slightly left. Does kinetic energy increase, decrease, or stay constant
at that instant? Can momentum still change direction?

**Compare your reasoning.**

The leftward component opposes the motion, so kinetic energy decreases. The
upward component also turns momentum. A force can change both speed and direction;
negative power means decreasing kinetic energy, not negative kinetic energy.

The useful distinction is now visible in the equations: **force controls the
whole momentum vector; power picks out its effect along the motion.**
Revisit [the magnitude argument](#energy-from-momentum) or
[the rate argument](#force-to-energy) if either connection needs inspection.
:::
