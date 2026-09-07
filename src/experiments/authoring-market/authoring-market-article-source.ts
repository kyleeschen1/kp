import type { createKpAuthoringMarketFacts } from "./authoring-market-facts.ts";

export const kpAuthoringMarketArticleSourceId: string = "projection.authoring-market.article.v1";
const authoredSourcePath: string = "src/experiments/authoring-market/authoring-market-article-source.ts";

/** Ordinary build-time TypeScript, not executable syntax embedded in Markdown.
 * Literal wording belongs to the author; only explicitly named slots bind data.
 */
export function authorKpMarketArticle(facts: ReturnType<typeof createKpAuthoringMarketFacts>) {
  const { latex: math, text: value } = facts;
  // This explicitly compares settled history; it does not ask the tax scene to
  // animate a demand operation that its governed projection does not support.
  const demandContext = value("initial.demandIntercept") === value("before.demandIntercept") ? "" :
    `First, demand's price intercept changes from $${math("initial.demandIntercept")}$ to $${math("before.demandIntercept")}$; the original market cleared at $Q=${math("initial.quantity")}$ and $P=${math("initial.price")}$, before the demand change. `;
  const text = `---
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
[${demandContext}Before the tax, demand and supply meet at $Q_0=${math("before.quantity")}$ and $P_0=${math("before.price")}$](kp-ref:tax-market/untaxed-equilibrium).
[A tax of ${value("after.tax")} dollars per unit creates a wedge between the price consumers pay and the price producers receive: $P_c=P_p+${math("after.tax")}$](kp-ref:tax-market/tax).
[On a graph whose vertical axis is the consumer price, demand stays put because willingness to pay has not changed; buyer-facing supply rises by ${value("after.tax")} dollars](kp-ref:tax-market/taxed-supply).
[Their new intersection has consumers paying $P_c=${math("after.consumerPrice")}$ while producers receive $P_p=${math("after.producerPrice")}$](kp-ref:tax-market/wedge),
[and trade contracts from $Q_0=${math("before.quantity")}$ units to $Q_t=${math("after.quantity")}$](kp-ref:tax-market/taxed-equilibrium).
:::

:::kp-passage{#welfare-accounting intent=causal-accounting}
[Before the tax, consumer surplus is $${math("before.consumerSurplus")}$ and producer surplus is $${math("before.producerSurplus")}$; afterward, their surviving portions are $${math("after.consumerSurplus")}$ and $${math("after.producerSurplus")}$](kp-ref:tax-market/consumer-surplus-taxed).
[One part of the missing private surplus becomes government revenue: the ${value("after.tax")}-dollar wedge across ${value("after.quantity")} traded units is $${math("after.tax")}\\cdot${math("after.quantity")}=${math("after.revenue")}$](kp-ref:tax-market/government-revenue).
[The remaining triangle is not transferred to anyone: the prevented trades between $Q_t=${math("after.quantity")}$ and $Q_0=${math("before.quantity")}$ leave $${math("after.loss")}$ of deadweight loss](kp-ref:tax-market/deadweight-loss).
:::
`;
  // Accessible claims use plain rational text, never raw TeX commands.
  const claimText = Object.freeze({
    "baseline-market": `Demand and original supply clear at ${value("before.quantity")} units and a price of ${value("before.price")}.`,
    "tax-input": `A tax of ${value("after.tax")} dollars is imposed on each unit traded.`,
    "supply-translation": `The tax lifts buyer-facing supply by ${value("after.tax")} while original supply remains marginal-cost evidence.`,
    "price-wedge": `Consumers pay ${value("after.consumerPrice")}, producers receive ${value("after.producerPrice")}, and the difference equals the tax of ${value("after.tax")}.`,
    "quantity-contraction": `The quantity traded contracts from ${value("before.quantity")} units to ${value("after.quantity")}.`,
    "surplus-redistribution": `Consumer surplus falls from ${value("before.consumerSurplus")} to ${value("after.consumerSurplus")}; producer surplus falls from ${value("before.producerSurplus")} to ${value("after.producerSurplus")}.`,
    "government-revenue": `The tax of ${value("after.tax")} on ${value("after.quantity")} traded units becomes ${value("after.revenue")} dollars of government revenue.`,
    "deadweight-loss": `Prevented trades leave ${value("after.loss")} of deadweight loss.`
  });
  // Bind exact claim keys, not one template's literal wording as a type contract.
  const claims: { readonly [Key in keyof typeof claimText]: string } = claimText;
  return Object.freeze({ text, claims, facts, sourceId: kpAuthoringMarketArticleSourceId,
    authoredSourcePath,
    modelRevisionId: facts.modelRevisionId });
}
