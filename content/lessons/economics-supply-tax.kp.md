---
kp:
  schema: kp.article.v1
  id: lesson.economics.supply-tax
  imports:
    supplyTax: vignette.economics.supply-tax-welfare@1
---

# How does a per-unit tax change a competitive market?

:::kp-stage{#tax-market use=supplyTax}
:::

:::kp-focus{#baseline-market stage=tax-market target="tax-market/demand tax-market/supply tax-market/untaxed-equilibrium tax-market/untaxed-price" context="tax-market/authority"}
The [demand schedule](kp-ref:tax-market/demand) is $P=12-Q$ and the
[original supply schedule](kp-ref:tax-market/supply) is $P=2+Q$.
Their intersection gives the untaxed market: $Q_0=5$ and $P_0=7$.

This first state is the reference for every comparison that follows. The
curves describe willingness to pay and marginal cost; their intersection
selects the trades whose willingness to pay covers marginal cost.
:::

### Introduce the tax

:::kp-focus{#tax-input stage=tax-market target="tax-market/tax" context="tax-market/demand tax-market/supply tax-market/untaxed-equilibrium"}
Now impose a per-unit tax of $t=4$. The tax is a new input to the market,
not a change in buyers' willingness to pay or sellers' underlying marginal
cost. Demand and original supply therefore remain available as evidence.

For each unit sold, the price paid by the consumer must exceed the price
received by the producer by exactly four dollars.
:::

:::kp-motion{#supply-translation stage=tax-market run=tax-market/impose-tax}
**Translate buyer-facing supply.** A buyer must cover both marginal cost and
the tax, so the schedule the buyer faces becomes
$S_t(Q)=S(Q)+t=6+Q$. The new schedule is parallel to original supply and
four dollars above it at every quantity.

::after

The original supply schedule does not disappear. It still records marginal
cost, while $S_t$ records the consumer price required to support each
quantity after the tax. Keeping both visible will let us read incidence and
welfare from the same model.
:::

### Read the price wedge

:::kp-focus{#price-wedge stage=tax-market target="tax-market/consumer-price tax-market/producer-price tax-market/wedge" context="tax-market/demand tax-market/supply tax-market/taxed-supply tax-market/taxed-equilibrium"}
Demand now clears buyer-facing supply at $Q_t=3$. At that quantity,
consumers pay $P_c=9$, while original supply shows that producers receive
$P_p=5$. The vertical distance is $P_c-P_p=4=t$.

The tax does not create one new market price. It separates the amount paid
from the amount received, with the wedge connecting the two prices at the
same traded quantity.
:::

### Compare the quantities

:::kp-focus{#quantity-contraction stage=tax-market target="tax-market/untaxed-equilibrium tax-market/taxed-equilibrium" context="tax-market/demand tax-market/supply tax-market/taxed-supply"}
The traded quantity falls from $Q_0=5$ to $Q_t=3$. Those two fewer units are
not merely movement on the page: they are trades whose willingness to pay
still exceeds marginal cost but no longer covers marginal cost plus the tax.

The two equilibrium points make the comparison discrete and reversible. We
can return to the untaxed point to inspect exactly which trades vanished.
:::

### Compare private surplus

:::kp-focus{#surplus-redistribution stage=tax-market target="tax-market/consumer-surplus-taxed tax-market/producer-surplus-taxed" context="tax-market/consumer-surplus-untaxed tax-market/producer-surplus-untaxed tax-market/demand tax-market/supply tax-market/taxed-supply tax-market/consumer-price tax-market/producer-price"}
Before the tax, consumer surplus and producer surplus are each $25/2$.
After the tax, each is $9/2$. Consumers lose surplus because they pay more
and buy less; producers lose surplus because they receive less and sell less.

Private surplus therefore falls by $16$ in total. That entire decline is not
deadweight loss, because part of it is transferred to the government rather
than destroyed.
:::

### Follow government revenue

:::kp-focus{#government-revenue stage=tax-market target="tax-market/government-revenue" context="tax-market/supply tax-market/taxed-supply tax-market/wedge tax-market/taxed-equilibrium tax-market/consumer-surplus-taxed tax-market/producer-surplus-taxed"}
The government collects the four-dollar wedge on each of the three units
still traded, so revenue is $tQ_t=4\cdot3=12$. Geometrically, this is the
rectangle whose height is the price wedge and whose width is taxed quantity.

Revenue changes who receives surplus; it does not by itself measure lost
gains from trade. We must separate this transfer from the value of trades
that no longer occur.
:::

### Identify deadweight loss

:::kp-focus{#deadweight-loss stage=tax-market target="tax-market/deadweight-loss" context="tax-market/demand tax-market/supply tax-market/taxed-supply tax-market/untaxed-equilibrium tax-market/taxed-equilibrium tax-market/government-revenue"}
Between quantities three and five, demand remains above original supply, so
those trades would have created gains. The tax prevents them, leaving a
deadweight-loss triangle worth $4$.

The accounting now closes: the $16$ decline in private surplus becomes $12$
of government revenue plus $4$ of deadweight loss. The tax both redistributes
surplus and eliminates mutually beneficial trades; only the second effect
reduces total surplus.
:::
