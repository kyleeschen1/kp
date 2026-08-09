---
kp:
  schema: kp.article.v1
  id: lesson.economics.demand-shift
  imports:
    demandShift: vignette.economics.demand-shift@1
---

### When demand changes

Imagine a weekly market for boxes of strawberries. Quantity, $Q$, is measured
in hundreds of boxes and price, $P$, in dollars per box. The market initially
settles where the supply schedule, $S$, meets demand, $D_0$.

:::kp-stage{#market use=demandShift}
:::

:::kp-focus{#read-curves stage=market target="market/demand market/supply" context="market/axes"}
Read the [price axis](kp-ref:market/price-axis) and compare the two schedules.
Neither curve is a path that the market travels over time.
:::

Before anything moves, keep three distinctions in view:

- A curve collects possible price–quantity combinations.
- An intersection is one state that satisfies both schedules.
- Holding supply fixed does not hold quantity supplied fixed.

:::kp-passage{#predict-shift intent=prediction claims=econ.demand.ceteris-paribus}
Buyers now want four hundred more boxes at every displayed price. Can the old
intersection still clear the market? Predict whether the new price and quantity
will be higher or lower before following the change.
:::

:::kp-motion{#raise-demand stage=market run=market/shift-demand}
At the same price, buyers now demand a larger quantity. Hold supply fixed and
follow the [demand schedule](kp-ref:market/demand) as it moves.

::after

The new intersection occurs at a higher price and quantity. Sellers move to a
new point on the unchanged supply schedule; the supply curve itself did not
shift.
:::

The equations verify the same two intersections shown by the graph:

$$
2 + Q = 14 - Q \quad\longrightarrow\quad 2 + Q = 18 - Q.
$$

The graph does not explain why demand changed or how quickly a real market
adjusts. Those claims require additional evidence and models rather than more
detail in this vignette.

