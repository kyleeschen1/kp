import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import type { KpSupplyTaxScrollScoreStageFactV1 } from "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-stage-lens.ts";
import { createKpAuthoringMarketFrameSession } from "./authoring-market-frame.ts";

export class KpAuthoringMarketFactGap extends Error {
  readonly code = "kp.authoring.market-fact-gap";
  readonly path: string;
  constructor(path: string, message: string) { super(message); this.name = "KpAuthoringMarketFactGap"; this.path = path; }
}

/** Revision-local values, not a prose verifier or an expression evaluator. */
export function createKpAuthoringMarketFacts(authored: ReturnType<typeof createKpAuthoredMarketSource>) {
  const session = createKpAuthoringMarketFrameSession(authored);
  const { before, after } = (() => {
    try { return { before: session.sample(0), after: session.sample(1) }; }
    finally { session.dispose(); }
  })();
  const values = Object.freeze({
    "before.quantity": before.frame.market.quantity,
    "before.price": before.frame.market.consumerPrice,
    "before.consumerSurplus": before.frame.welfare.consumerSurplus,
    "before.producerSurplus": before.frame.welfare.producerSurplus,
    "before.totalSurplus": before.frame.welfare.totalSurplus,
    "after.quantity": after.frame.market.quantity,
    "after.consumerPrice": after.frame.market.consumerPrice,
    "after.producerPrice": after.frame.market.producerPrice,
    "after.consumerSurplus": after.frame.welfare.consumerSurplus,
    "after.producerSurplus": after.frame.welfare.producerSurplus,
    "after.tax": after.frame.market.taxAmount,
    "after.revenue": after.frame.welfare.governmentRevenue,
    "after.totalSurplus": after.frame.welfare.totalSurplus,
    "after.loss": after.frame.welfare.deadweightLoss
  });
  type Name = keyof typeof values;
  const references = Object.freeze(Object.fromEntries(Object.keys(values).map(name => [name, Object.freeze({
    name: name as Name, modelRevisionId: after.revisionId,
    address: name.startsWith("before.") ? before.address : after.address
  })])) as { readonly [Key in Name]: { readonly name: Key; readonly modelRevisionId: string; readonly address: typeof before.address } });
  type Reference = (typeof references)[Name];
  const ref = (name: Name): Reference => {
    if (!Object.hasOwn(references, name)) throw new KpAuthoringMarketFactGap(String(name), "Unknown explicit fact reference.");
    return references[name];
  };
  const read = (reference: Reference) => {
    if (reference == null || ref(reference.name) !== reference) {
      throw new KpAuthoringMarketFactGap("reference", "A fact needs this binding session's reference capability.");
    }
    return values[reference.name];
  };
  const text = (name: Name) => {
    const value = read(ref(name));
    return value.denominator === "1" ? value.numerator : `${value.numerator}/${value.denominator}`;
  };
  const latex = (name: Name) => {
    const value = read(ref(name));
    return value.denominator === "1" ? value.numerator : `\\frac{${value.numerator}}{${value.denominator}}`;
  };
  const samePrivateSurplus = text("before.consumerSurplus") === text("before.producerSurplus") &&
    text("after.consumerSurplus") === text("after.producerSurplus");
  const stageFacts: readonly KpSupplyTaxScrollScoreStageFactV1[] = Object.freeze([
    { id: "tax-wedge", latex: `P_c=P_p+t,\\quad t=${latex("after.tax")}` },
    { id: "supply-translation", latex: "S_t=S+t" },
    { id: "price-wedge", latex: `P_c-P_p=t=${latex("after.tax")}` },
    { id: "quantity-contraction", latex: `Q_0=${latex("before.quantity")}\\;\\longrightarrow\\;Q_t=${latex("after.quantity")}` },
    { id: "surplus-redistribution", latex: samePrivateSurplus
      ? `CS,PS:\\;${latex("before.consumerSurplus")}\\;\\longrightarrow\\;${latex("after.consumerSurplus")}`
      : `CS:${latex("before.consumerSurplus")}\\to${latex("after.consumerSurplus")},\\quad PS:${latex("before.producerSurplus")}\\to${latex("after.producerSurplus")}` },
    { id: "government-revenue", latex: `GR=tQ_t=${latex("after.tax")}\\cdot${latex("after.quantity")}=${latex("after.revenue")}` },
    { id: "deadweight-loss", latex: `DWL=${latex("after.loss")}` }
  ].map(item => Object.freeze(item)) as KpSupplyTaxScrollScoreStageFactV1[]);
  return Object.freeze({ modelRevisionId: after.revisionId, values, references, ref, read, text, latex, stageFacts });
}

/** Plain HTML facts remain meaningful without animation, KaTeX or a clock. */
export function renderKpAuthoringMarketStaticFacts(facts: ReturnType<typeof createKpAuthoringMarketFacts>): string {
  // Names and values originate in the closed typed map; no authored HTML enters here.
  return `<section data-kp-authoring-market-static-facts><h2>Model facts (before / after tax)</h2><dl>${Object.keys(facts.references).map(name =>
    `<dt>${name}</dt><dd>${facts.text(name as keyof typeof facts.references)}</dd>`).join("")}</dl></section>`;
}
