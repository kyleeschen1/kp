---
kp:
  schema: kp.article.v1
  id: lesson.economics.demand-shift
  imports:
    demandShift: vignette.economics.demand-shift@1
---

# Why does an increase in demand raise both equilibrium price and equilibrium quantity when supply remains fixed?

Kicker: Supply, demand, and equilibrium

Assumption: This lesson assumes that you can read price and
quantity axes and have encountered supply, demand, and
equilibrium before. It focuses on the difference between
shifting a curve and moving to a new point on an unchanged
curve.

:::kp-stage{#market use=demandShift}
:::

### The puzzle in the starting market

:::kp-passage{#context}
Imagine a weekly market for boxes of strawberries. Quantity,
$Q$, is measured in hundreds of boxes and price,
[$P$](kp-ref:market/price-axis), in dollars per box.
Strawberries become more desirable, so demand increases, but the
supply curve does not shift. The new equilibrium nevertheless
has a larger quantity. If the supply relationship stayed fixed,
why do sellers supply more?
:::

:::kp-focus{#initial-equilibrium stage=market target="market/equilibrium" context="market/axes market/demand market/supply"}
The starting supply schedule, $S$, and demand schedule, $D_0$,
collect possible price–quantity combinations; neither curve is a
path that the market travels over time. They meet at
$E_0=(6,8)$. At that point sellers want to supply $Q=6$ and
buyers want to purchase $Q=6$, so the market clears.

Equilibrium means only that the two schedules agree at the
displayed price and quantity. It does not mean that the outcome
is ideal, fair, or permanent. The intersection is determined by
both relationships at once, so changing either relationship can
make the old point inconsistent with market clearing.
:::

### Change one relationship

:::kp-focus{#demand-change stage=market target="market/demand" context="market/supply market/axes"}
Buyers now want four hundred more boxes at every displayed
price, so the entire demand schedule shifts from $D_0$ to $D_1$.
Supply remains the same relationship, $S$. A fixed supply curve
does not freeze quantity at six hundred boxes; it says how much
sellers supply at each possible price. A new market-clearing
price may therefore select a different point on that unchanged
curve.
:::

:::kp-passage{#prediction}
Before watching the change, predict where the new intersection
must lie. Can $E_0=(6,8)$ still clear the market when demand has
increased but supply has not shifted? Should the new point have
a higher or lower price, and a larger or smaller quantity?

At the old price of $8$, sellers still supply six hundred boxes,
but buyers now demand one thousand. The shortage tells us that
$E_0$ is no longer an equilibrium. It does not yet tell us the
exact new point; for that, we must follow where the shifted
demand curve meets unchanged supply.
:::

### Follow the new intersection

:::kp-motion{#follow-shift stage=market run=market/shift-demand}
Begin at $E_0$. Hold the blue supply curve fixed and follow only
the red demand curve and the intersection it determines. As
demand shifts from $D_0$ to $D_1$, the equilibrium point follows
the changing intersection.

::after

The new curves meet at $E_1=(8,10)$, above and to the right of
$E_0$. Equilibrium price has risen from $8$ to $10$, and
equilibrium quantity from six hundred to eight hundred boxes.
The result is not an extra rule placed on the graph: $E_1$ is
simply the one point that satisfies both of the relationships
now shown.
:::

:::kp-motion{#shift-versus-movement stage=market run=market/trace-supply-movement}
Now ignore the red curve and watch blue $S$. The trace will move
from $E_0$ to $E_1$ along that same supply curve. Its position
changes; the supply relationship itself does not.

::after

The trace separates two kinds of change. Demand shifted from one
schedule to another; sellers moved to a new point on the same
supply schedule. Quantity supplied rose because the higher
market-clearing price selected a different point on unchanged
$S$.

Only now do we need the equations. Initially, $2+Q=14-Q$, so
$Q=6$ and $P=8$. After the demand shift, $2+Q=18-Q$, so $Q=8$
and $P=10$. The algebra is not a second story; it verifies the
same two intersections shown by the graph.
:::

### Check and generalize

:::kp-passage{#scope}
Comparing $E_0$ with $E_1$ gives a comparative-static result:
with upward-sloping supply held fixed, an increase in demand
raises both equilibrium price and equilibrium quantity. The
exact amounts belong to this example. A different curve shape, a
simultaneous supply shift, or a price control could produce a
different result.

The comparison identifies the two equilibria; it does not
describe the path or speed by which an actual market adjusts,
the trades made along the way, or whether every participant is
better off. Those questions require additional models rather
than more detail on this graph.
:::

:::kp-passage{#synthesis}
Supply did not shift. Explain why equilibrium quantity supplied
nevertheless rose. Pause before revealing the answer.

The supply curve describes how much sellers supply at each
possible price; it does not hold quantity at six hundred boxes.
The demand shift made $P=8$ inconsistent with market clearing.
At the higher clearing price of $10$, sellers move along
unchanged $S$ and supply eight hundred boxes. Quantity supplied
rose because equilibrium selected a new point on the same supply
relationship, not because the supply curve itself moved.
:::

:::kp-passage{#explore}
As an optional transfer exercise, change the final demand
intercept and predict the new equilibrium before reading the
graph. The Explore control always returns to the lesson example,
$14\rightarrow18$, and its two exact equilibria.
:::
