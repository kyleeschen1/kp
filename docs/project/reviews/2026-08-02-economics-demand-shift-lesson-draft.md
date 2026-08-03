# Economics demand-shift lesson draft

Status: `EDITORIAL_CHECKPOINT`

This is a prose artifact for review, not a compiled KP lesson. The prose is
intentionally continuous. The binding notes after it are editorial annotations,
not proposed Markdown compiler syntax.

Central question: **Why does an increase in demand raise both equilibrium price
and equilibrium quantity when supply remains fixed?**

Assumed learner state: the learner can read quantity and price axes, has seen
supply, demand, and equilibrium, but may confuse a curve shifting with a point
moving along a curve.

### What equilibrium means

Imagine a simplified weekly market for boxes of strawberries. We will measure
quantity, $Q$, in hundreds of boxes and price, $P$, in dollars per box. The
numbers are deliberately simple so that we can see the economic relationship
without letting arithmetic take over the lesson.

The supply curve and the demand curve are schedules. Each curve collects many
possible price–quantity combinations; neither one is a path that the market
must travel over time. In our example, the supply schedule is $P=2+Q$. Supplying
the sixth hundred boxes corresponds to a price of $8$. The initial demand
schedule is $P=14-Q$. For buyers, the sixth hundred boxes also corresponds to a
price of $8$.

That shared point is the initial equilibrium, $E_0=(6,8)$. At $P=8$, sellers
want to supply $Q=6$ and buyers want to purchase $Q=6$, so the market clears.
Equilibrium does not mean that the outcome is ideal, fair, or permanent. It
means something narrower: at this price, quantity supplied equals quantity
demanded under the relationships currently shown.

Look at the intersection before anything moves. The point is not an extra fact
placed on top of the curves. Its location is determined by both curves at once.
If one of those relationships changes, the old intersection may no longer be
the market-clearing point.

### What changes when demand increases

Suppose strawberries become more desirable while the supply relationship stays
the same. In this model, demand changes from $P=14-Q$ to $P=18-Q$. At any given
quantity, buyers are now willing to pay $4$ more than before. Said the other
way around, at any given price they want four hundred more boxes. This is an
increase in demand, so the entire demand curve shifts. It is not a movement
from one point to another on the old demand curve.

The supply curve does not shift. Its equation remains $P=2+Q$. This does not
mean that sellers must supply the old quantity forever. A fixed supply curve is
a fixed relationship between price and quantity supplied; a different price
can still select a different point on that same curve. Keeping this distinction
in view will resolve the apparent puzzle at the end of the lesson.

Before playing the change, make a prediction. If the demand curve moves while
the supply curve stays in place, where must the new intersection lie? In
particular, can the old point $E_0=(6,8)$ still clear the market?

At the old price of $8$, sellers still supply six hundred boxes. Under the new
demand schedule, however, buyers demand ten hundred boxes because
$8=18-Q$ gives $Q=10$. The old price therefore produces a shortage of four
hundred boxes. The demand shift has made the old equilibrium inconsistent with
the new pair of schedules.

### How the market-clearing point changes

Now play the shift. Watch the demand curve and its intersection with supply as
one event. The old demand curve can remain as a quiet reference, while the
supply curve remains fixed. The moving equilibrium point travels up and to the
right because it must stay at the intersection of the changing demand curve and
the unchanged supply curve.

The graph carries the causal argument. Once demand has shifted, a price of $8$
leaves quantity demanded above quantity supplied. A higher price reduces
quantity demanded along the new demand curve and increases quantity supplied
along the unchanged supply curve. At $P=10$, both quantities are $Q=8$, so the
market clears again. The new equilibrium is $E_1=(8,10)$.

Notice the two different kinds of change. Demand shifted: the relationship
between price and quantity demanded changed. Supply did not shift: the supply
relationship stayed $P=2+Q$. Yet the market moved from one point on the supply
curve to another, from $(6,8)$ to $(8,10)$. That is a movement along the supply
curve, caused here by the change in demand.

The equations verify what the graph has already shown. Initially,
$2+Q=14-Q$, so $2Q=12$, $Q=6$, and $P=8$. After the demand shift,
$2+Q=18-Q$, so $2Q=16$, $Q=8$, and $P=10$. The algebra does not provide a
second story. It gives an exact reading of the same two intersections.

### What the model does and does not say

Comparing $E_0$ with $E_1$ gives a comparative-static result: with an
upward-sloping supply curve, a higher demand schedule raises both equilibrium
price and equilibrium quantity. Price rises from $8$ to $10$, and quantity
rises from six hundred to eight hundred boxes. The result follows from the
particular relationships and the single change represented in the model.

This comparison does not tell us how quickly an actual market adjusts, which
trades occur on the way, or whether every buyer and seller is better off. It
also does not say that price and quantity must respond by these exact amounts
in every market. A flatter supply curve, a simultaneous supply shift, a price
control, or a different demand change would produce a different result. Those
are useful extensions precisely because this first model keeps them fixed.

After the guided example is clear, changing the final demand intercept can help
separate the general relationship from these particular numbers. The learner
should always be able to return to the lesson example, $14\rightarrow18$, and
recover the same two exact equilibria.

Supply did not shift. Why, then, did equilibrium quantity still rise? Pause
before reading the model explanation.

The supply curve describes how much sellers supply at each possible price; it
does not hold quantity at six hundred boxes. The demand shift made $P=8$
inconsistent with market clearing. At the higher clearing price of $10$,
sellers move along their unchanged supply curve and supply eight hundred boxes.
Quantity supplied rose because equilibrium selected a new point on the same
supply relationship, not because the supply curve itself moved.

## Editorial binding notes

These notes preserve reviewable correspondence without forcing annotations into
the reading flow. `proposed:` claim IDs describe assertions proved by the exact
model but not yet present in the runtime claim vocabulary. They must not be
treated as shipped contracts before the integrated exemplar is approved.

| Passage ID | Prose role | Claim references | Primary semantic references | Prepared checkpoint |
| --- | --- | --- | --- | --- |
| `passage.econ.context` | concrete orientation | `claim.economics.market-clears` | `graph.economics.supply-demand.viewport`, `axis.economics.quantity.axis`, `axis.economics.price.axis` | `checkpoint.econ.orient-market` |
| `passage.econ.schedules` | define curves as relationships | `claim.economics.supply-fixed`, `proposed:claim.economics.curves-are-schedules` | `curve.economics.supply.body`, `curve.economics.demand.body` | `checkpoint.econ.orient-market` |
| `passage.econ.initial-equilibrium` | establish exact clearing point | `claim.economics.market-clears` | `equilibrium.economics.supply-demand.before`, `state.economics.supply-demand.before.snapshot` | `checkpoint.econ.initial-equilibrium` |
| `passage.econ.demand-change` | identify the changed relationship | `claim.economics.supply-fixed`, `claim.economics.demand-intercept-shift`, `proposed:claim.economics.shift-vs-movement` | `curve.economics.demand.body`, `parameter.economics.demand-price-intercept.before`, `parameter.economics.demand-price-intercept.after`, `curve.economics.supply.body` | `checkpoint.econ.identify-change` |
| `passage.econ.prediction` | non-gating prediction | `claim.economics.demand-intercept-shift`, `claim.economics.market-clears` | `equilibrium.economics.supply-demand.before`, `curve.economics.supply.body`, `curve.economics.demand.body` | `checkpoint.econ.predict` |
| `passage.econ.old-price-shortage` | explain why old point no longer clears | `proposed:claim.economics.old-price-shortage` | `market-sides.economics.supply-demand.shortage`, `state.economics.supply-demand.before.snapshot`, `state.economics.supply-demand.after.snapshot` | `checkpoint.econ.predict` |
| `passage.econ.follow-shift` | invite learner-triggered motion | `claim.economics.supply-fixed`, `claim.economics.demand-intercept-shift`, `claim.economics.equilibrium-handoff` | `curve.economics.demand.body`, `curve.economics.supply.body`, `equilibrium.economics.supply-demand.before`, `equilibrium.economics.supply-demand.after` | `checkpoint.econ.ready-to-shift` |
| `passage.econ.new-equilibrium` | interpret settlement | `claim.economics.market-clears`, `claim.economics.equilibrium-change` | `equilibrium.economics.supply-demand.after`, `state.economics.supply-demand.after.snapshot` | `checkpoint.econ.settled` |
| `passage.econ.shift-versus-movement` | repair target misconception | `claim.economics.supply-fixed`, `proposed:claim.economics.shift-vs-movement` | `curve.economics.supply.body`, `equilibrium.economics.supply-demand.before`, `equilibrium.economics.supply-demand.after` | `checkpoint.econ.compare-equilibria` |
| `passage.econ.equation-check` | exact verification | `claim.economics.market-clears`, `claim.economics.equilibrium-change` | `curve.economics.supply.equation`, `curve.economics.demand.equation`, `equilibrium.economics.supply-demand.after` | `checkpoint.econ.equation-check` |
| `passage.econ.scope` | state model boundary | `proposed:claim.economics.comparative-statics-boundary` | `model.economics.supply-demand.demand-intercept-shift.model` | `checkpoint.econ.compare-equilibria` |
| `passage.econ.synthesis` | non-gating synthesis and explanation | `claim.economics.supply-fixed`, `claim.economics.equilibrium-change`, `proposed:claim.economics.supply-curve-not-fixed-quantity` | `curve.economics.supply.body`, `equilibrium.economics.supply-demand.before`, `equilibrium.economics.supply-demand.after` | `checkpoint.econ.synthesis` |

## Claim verification notes

- The shipped runtime supplies five claim identities:
  `claim.economics.supply-fixed`, `claim.economics.market-clears`,
  `claim.economics.demand-intercept-shift`,
  `claim.economics.equilibrium-handoff`, and
  `claim.economics.equilibrium-change`.
- The exact model proves $E_0=(6,8)$ and $E_1=(8,10)$ from
  $P=2+Q$, $P=14-Q$, and $P=18-Q$.
- The model's market classifier proves that the shifted market at $P=8$ is in
  shortage. Direct substitution gives $Q_s=6$, $Q_d=10$, and a shortage of
  four hundred boxes.
- “Curves are schedules,” “shift versus movement,” “comparative statics,” and
  “a fixed curve is not a fixed quantity” are necessary editorial claims. The
  model supports them, but the current claim vocabulary does not identify them
  separately. This is an implementation gap to review after the prose passes,
  not a reason to weaken the draft now.
