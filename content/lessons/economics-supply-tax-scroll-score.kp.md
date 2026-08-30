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
[Start with the untaxed equilibrium, $Q_0=5$ and $P_0=7$](kp-ref:tax-market/untaxed-equilibrium).
[A four-dollar tax is added to each unit sold](kp-ref:tax-market/tax),
[so buyer-facing supply shifts upward by four dollars](kp-ref:tax-market/taxed-supply).
[At the new equilibrium consumers pay $9$ while producers receive $5$](kp-ref:tax-market/wedge),
[and quantity traded contracts from five units to three](kp-ref:tax-market/taxed-equilibrium).
:::

:::kp-passage{#welfare-accounting intent=causal-accounting}
[The contraction reduces consumer and producer surplus from $25/2$ each to $9/2$ each](kp-ref:tax-market/consumer-surplus-taxed).
[The four-dollar wedge across three units becomes $12$ of government revenue](kp-ref:tax-market/government-revenue),
[while the prevented trades between three and five leave $4$ of deadweight loss](kp-ref:tax-market/deadweight-loss).
Together, the transfer and the loss account for the full decline in private surplus.
:::
