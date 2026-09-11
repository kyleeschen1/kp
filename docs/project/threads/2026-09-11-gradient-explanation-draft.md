# What is a gradient, and why does it point uphill?

Explanatory draft approved by the user with “approve. implement” on 2026-09-11.
Its translation is now on the live gradient card for rendered G3 review. The
reported successful GPT response has not been supplied: this is our explanation,
not a reconstruction or independently validated lesson. The section divisions
are explanatory units, not prescribed slide counts.

## The question a height measurement cannot answer

Imagine standing on a hillside and wanting to gain height as quickly as possible.
Knowing your current height does not tell you which direction to take. You need
to know how height changes when you move.

On a path with only one direction to move, a slope gives you that information:
how much height you gain per small amount of forward travel. On a hillside,
there are many possible directions. One slope is no longer enough.

The gradient packages the local information you need to answer that question.
It is useful beyond hills, too: the changing quantity might be temperature,
profit, or an error you are trying to reduce. We will use height so that the
meaning of “increase” stays concrete.

## First measure two simple directions

At our chosen point, suppose the local eastward slope is 2: a tiny eastward move
of length 0.01 would add approximately 0.02 to your height. The local northward
slope is also 2. Horizontal coordinates use the same distance units.

These measurements have a name: partial derivatives. “Partial” just means we
change one coordinate while holding the other fixed. East gives the x partial;
north gives the y partial. Here they are

\[
f_x=2,\qquad f_y=2.
\]

They are slopes at this point, not a promise that the hillside continues with
those slopes forever.

## How can two measurements describe a diagonal move?

Look sufficiently close to this smooth hillside and it is almost a flat ramp.
On that local ramp, an eastward contribution and a northward contribution add.
For a tiny move with eastward part \(\Delta x\) and northward part \(\Delta y\),

\[
\Delta f\approx 2\Delta x+2\Delta y.
\]

For example, moving 0.01 east and 0.01 north predicts a height gain of 0.04.
We are predicting the effect of that move, not yet comparing it fairly with a
0.01 east-only move: the diagonal move is longer.

The approximation matters. The curved hillside can depart from the flat ramp
over a larger distance. These two slopes describe what happens locally.

Package the two slopes as the pair \((2,2)\). That pair is the gradient at this
point, written \(\nabla f\). You can also draw the pair as an arrow: two units
in the eastward direction and two in the northward direction.

So a gradient is not initially a mysterious extra measurement. It is the local
coordinate slopes, collected into one object that predicts changes in any
small direction.

## Why does that arrow point toward the fastest increase?

First make the comparison fair: allow the same small horizontal travel distance
in every direction. We are comparing slopes, not giving one direction a longer
step or comparing how tiring it is to walk on the surface.

For our local ramp, moving southeast gains height from its eastward part but
loses the same amount from its southward part. Those effects cancel. Southeast
and northwest are locally level directions.

Moving northeast combines two positive contributions instead. Every other
direction can be split into a part along northeast and a part along the locally
level line. The level part adds no height. Only the northeast part contributes.

Now imagine fixed-length arrows starting at your position. Their tips lie on a
circle. Its projection tells us how far forward it reaches along the northeast
line, found by dropping a perpendicular from the tip onto that line. A backward
projection counts as negative. The forward reach cannot exceed the whole arrow's
length. It reaches that length only when the arrow itself points northeast.
Turning away reduces that reach and gives less rise.

That is why northeast wins. And northeast is exactly the direction of our
gradient arrow \((2,2)\).

## Why does this work beyond this symmetric example?

The connection comes from the same change rule, not from a special property of
the compass directions. In general, the local slopes give

\[
\Delta f\approx f_x\Delta x+f_y\Delta y
             =\nabla f\cdot\Delta\mathbf r.
\]

The dot in that expression is called a dot product. Here it is simply another
way to write “multiply each slope by its coordinate movement and add”. Its
geometric meaning is the gradient's length times the **signed projection of
your move onto the gradient's direction**.

For fixed travel distance, that projection is greatest when you align with the
gradient. Perpendicular movement has zero projection and therefore zero local
rise. Opposite movement has a negative projection and goes downhill.

The gradient's direction tells you which way increases the quantity fastest.
Its length tells you the greatest local increase per unit horizontal distance.
Here that length is \(\sqrt{2^2+2^2}=\sqrt8\), about 2.83. You do not need to
travel the length of the gradient arrow: it encodes a direction and a rate.

## Where do contours enter?

A contour joins locations with the same height. Moving along it therefore
changes your position without changing your height.

At your point, the contour's tangent is its immediate direction. We just found
that locally level directions are perpendicular to the gradient. So the
gradient crosses the contour at a right angle, toward increasing heights.

The contour map is another way to read the same local information. It confirms
the gradient's meaning; you did not need to begin by mastering contours to
understand what the gradient is for.

A straight tangent step can eventually leave the curved contour. “Zero local
rise” describes its initial rate, not its height after an arbitrary finite step.
At a point where the gradient is zero, every first-order directional rate is
zero; there is no unique fastest first-order direction to draw.

## A small check, if you want one

If the eastward slope were negative and the northward slope positive, which
quadrant would the gradient point into? What would that say about moving east?

Expected reasoning: northwest. West reverses the negative eastward change and
north contributes positively; the relative slope magnitudes determine the exact
direction. Moving east would initially lower the quantity.

And why can't an equal-length arrow tilted away from the gradient do better?
Its projection along the gradient is shorter; its perpendicular part contributes
no first-order change.

## Optional calculation: where did the two slopes come from?

The existing example uses \(f(x,y)=x^2+2y^2\) at \((1,\tfrac12)\). Its height
there is 1.5. Expand the height after a small move:

\[
f(1+\Delta x,\tfrac12+\Delta y)
=1.5+2\Delta x+2\Delta y+(\Delta x)^2+2(\Delta y)^2.
\]

The terms linear in the small move are \(2\Delta x+2\Delta y\). The remaining
terms are quadratic: halving both movements makes those terms four times smaller.
This is why the linear prediction becomes accurate close to the point, and why
the local coordinate slopes are both 2. The definition and use of the slopes
belong to the main explanation; this expansion supplies additional justification.
