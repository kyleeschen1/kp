---
kp:
  schema: kp.article.v1
  id: lesson.economics.supply-tax-scroll-score
  imports:
    supplyTax: vignette.economics.supply-tax-welfare@1
---

# How does a tax reshape a market?

:::kp-stage{#tax-market use=supplyTax}
:::

:::kp-passage{#market-adjustment intent=causal-comparison}
[Before the tax, demand and supply meet at $Q_0=5$ and $P_0=7$](kp-ref:tax-market/untaxed-equilibrium).
[A four-dollar tax creates a wedge between the price consumers pay and the price producers receive: $P_c=P_p+4$](kp-ref:tax-market/tax).
[On a graph whose vertical axis is the consumer price, demand stays put because willingness to pay has not changed; buyer-facing supply rises by four dollars](kp-ref:tax-market/taxed-supply).
[Their new intersection has consumers paying $P_c=9$ while producers receive $P_p=5$](kp-ref:tax-market/wedge),
[and trade contracts from $Q_0=5$ units to $Q_t=3$](kp-ref:tax-market/taxed-equilibrium).
:::

:::kp-passage{#welfare-accounting intent=causal-accounting}
[Before the tax, consumer and producer surplus fill the gains-from-trade region, $25/2$ each; afterward, the surviving portions are only $9/2$ each](kp-ref:tax-market/consumer-surplus-taxed).
[One part of the missing private surplus becomes government revenue: the four-dollar wedge across three traded units is $4\cdot3=12$](kp-ref:tax-market/government-revenue).
[The remaining triangle is not transferred to anyone: the prevented trades between $Q_t=3$ and $Q_0=5$ leave $4$ of deadweight loss](kp-ref:tax-market/deadweight-loss).
:::
