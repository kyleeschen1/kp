import {
  createKpEconomicsSupplyTaxAnimationAsset,
  type KpEconomicsSupplyTaxAnimationAsset
} from "../../animation/economics-supply-tax-asset.ts";

export const kpSupplyTaxPedagogicalScoreSchemaVersion =
  "kp.economics.supply-tax-pedagogical-score.v1" as const;

export type KpSupplyTaxBeatId =
  | "beat.economics.supply-tax.baseline-market"
  | "beat.economics.supply-tax.tax-input"
  | "beat.economics.supply-tax.supply-translation"
  | "beat.economics.supply-tax.price-wedge"
  | "beat.economics.supply-tax.quantity-contraction"
  | "beat.economics.supply-tax.surplus-redistribution"
  | "beat.economics.supply-tax.government-revenue"
  | "beat.economics.supply-tax.deadweight-loss";

export type KpSupplyTaxAttentionAct =
  | "orient"
  | "identify-input"
  | "transform"
  | "compare-prices"
  | "compare-quantities"
  | "compare-surplus"
  | "trace-transfer"
  | "interpret-loss";

export interface KpSupplyTaxBeatAttentionV1 {
  readonly targetEntityIds: readonly string[];
  readonly contextEntityIds: readonly string[];
  readonly historicalTraceEntityIds: readonly string[];
  readonly prospectiveTraceEntityIds: readonly string[];
}

export interface KpSupplyTaxPedagogicalBeatV1 {
  readonly id: KpSupplyTaxBeatId;
  readonly ordinal: number;
  readonly slug: string;
  readonly title: string;
  readonly claim: string;
  readonly attentionAct: KpSupplyTaxAttentionAct;
  readonly settledFrame: "untaxed" | "taxed";
  readonly transitionFromPrevious: "none" | "sample-tax-imposition";
  readonly attention: KpSupplyTaxBeatAttentionV1;
}

export interface KpSupplyTaxPedagogicalScoreV1 {
  readonly schemaVersion: typeof kpSupplyTaxPedagogicalScoreSchemaVersion;
  readonly id: "score.economics.supply-tax-focus-deck.v1";
  readonly animationId: string;
  readonly beats: readonly KpSupplyTaxPedagogicalBeatV1[];
}

export interface KpSupplyTaxScoreIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpSupplyTaxPedagogicalScore(
  authority: KpEconomicsSupplyTaxAnimationAsset =
    createKpEconomicsSupplyTaxAnimationAsset()
): KpSupplyTaxPedagogicalScoreV1 {
  const semantics = authority.semantics;
  const { model } = semantics;
  const demand = requiredCurveId(authority, "demand");
  const supply = requiredCurveId(authority, "marginal-cost-supply");
  const taxedSupply = requiredCurveId(authority, "buyer-facing-taxed-supply");
  const untaxedPrice = requiredPriceId(authority, "untaxed-market");
  const consumerPrice = requiredPriceId(authority, "consumer");
  const producerPrice = requiredPriceId(authority, "producer");
  const untaxedConsumer = requiredRegionId(authority, "untaxed", "consumer-surplus");
  const untaxedProducer = requiredRegionId(authority, "untaxed", "producer-surplus");
  const taxedConsumer = requiredRegionId(authority, "taxed", "consumer-surplus");
  const taxedProducer = requiredRegionId(authority, "taxed", "producer-surplus");
  const revenue = requiredRegionId(authority, "taxed", "government-revenue");
  const deadweightLoss = requiredRegionId(authority, "taxed", "deadweight-loss");
  const tax = model.input.tax.id;
  const untaxed = model.states.untaxed.id;
  const taxed = model.states.taxed.id;
  const wedge = semantics.entities.wedge.id;

  const beats = Object.freeze([
    beat({
      id: "beat.economics.supply-tax.baseline-market",
      ordinal: 1,
      slug: "baseline-market",
      title: "The market before the tax",
      claim: "Demand and original supply clear at five units and a price of seven.",
      attentionAct: "orient",
      settledFrame: "untaxed",
      transitionFromPrevious: "none",
      targetEntityIds: [demand, supply, untaxed, untaxedPrice],
      contextEntityIds: [semantics.id]
    }),
    beat({
      id: "beat.economics.supply-tax.tax-input",
      ordinal: 2,
      slug: "tax-input",
      title: "Introduce the tax",
      claim: "A four-dollar tax is imposed on each unit traded.",
      attentionAct: "identify-input",
      settledFrame: "untaxed",
      transitionFromPrevious: "none",
      targetEntityIds: [tax],
      contextEntityIds: [demand, supply, untaxed]
    }),
    beat({
      id: "beat.economics.supply-tax.supply-translation",
      ordinal: 3,
      slug: "supply-translation",
      title: "Translate buyer-facing supply",
      claim: "The tax lifts buyer-facing supply by four while original supply remains marginal-cost evidence.",
      attentionAct: "transform",
      settledFrame: "taxed",
      transitionFromPrevious: "sample-tax-imposition",
      targetEntityIds: [supply, taxedSupply, tax],
      contextEntityIds: [demand],
      historicalTraceEntityIds: [untaxed]
    }),
    beat({
      id: "beat.economics.supply-tax.price-wedge",
      ordinal: 4,
      slug: "price-wedge",
      title: "Read the price wedge",
      claim: "Consumers pay nine, producers receive five, and the four-dollar difference equals the tax.",
      attentionAct: "compare-prices",
      settledFrame: "taxed",
      transitionFromPrevious: "none",
      targetEntityIds: [consumerPrice, producerPrice, wedge],
      contextEntityIds: [demand, supply, taxedSupply, taxed],
      historicalTraceEntityIds: [untaxed]
    }),
    beat({
      id: "beat.economics.supply-tax.quantity-contraction",
      ordinal: 5,
      slug: "quantity-contraction",
      title: "Compare quantities",
      claim: "The quantity traded contracts from five units to three.",
      attentionAct: "compare-quantities",
      settledFrame: "taxed",
      transitionFromPrevious: "none",
      targetEntityIds: [untaxed, taxed],
      contextEntityIds: [demand, supply, taxedSupply]
    }),
    beat({
      id: "beat.economics.supply-tax.surplus-redistribution",
      ordinal: 6,
      slug: "surplus-redistribution",
      title: "Compare private surplus",
      claim: "Consumer and producer surplus each fall from twelve and a half to four and a half.",
      attentionAct: "compare-surplus",
      settledFrame: "taxed",
      transitionFromPrevious: "none",
      targetEntityIds: [taxedConsumer, taxedProducer],
      contextEntityIds: [demand, supply, taxedSupply, consumerPrice, producerPrice],
      historicalTraceEntityIds: [untaxed, untaxedConsumer, untaxedProducer]
    }),
    beat({
      id: "beat.economics.supply-tax.government-revenue",
      ordinal: 7,
      slug: "government-revenue",
      title: "Follow the transfer",
      claim: "The four-dollar wedge on three traded units becomes twelve dollars of government revenue.",
      attentionAct: "trace-transfer",
      settledFrame: "taxed",
      transitionFromPrevious: "none",
      targetEntityIds: [revenue],
      contextEntityIds: [
        supply,
        taxedSupply,
        wedge,
        taxed,
        taxedConsumer,
        taxedProducer
      ],
      historicalTraceEntityIds: [untaxed, untaxedConsumer, untaxedProducer]
    }),
    beat({
      id: "beat.economics.supply-tax.deadweight-loss",
      ordinal: 8,
      slug: "deadweight-loss",
      title: "Identify the lost gains from trade",
      claim: "The trades between three and five units disappear, leaving four dollars of deadweight loss.",
      attentionAct: "interpret-loss",
      settledFrame: "taxed",
      transitionFromPrevious: "none",
      targetEntityIds: [deadweightLoss],
      contextEntityIds: [
        demand,
        supply,
        taxedSupply,
        untaxed,
        taxed,
        taxedConsumer,
        taxedProducer,
        revenue
      ],
      historicalTraceEntityIds: [untaxedConsumer, untaxedProducer]
    })
  ] satisfies readonly KpSupplyTaxPedagogicalBeatV1[]);

  const score = Object.freeze({
    schemaVersion: kpSupplyTaxPedagogicalScoreSchemaVersion,
    id: "score.economics.supply-tax-focus-deck.v1" as const,
    animationId: authority.id,
    beats
  });
  const issues = validateKpSupplyTaxPedagogicalScore(authority, score);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join(" "));
  }
  return score;
}

export function validateKpSupplyTaxPedagogicalScore(
  authority: KpEconomicsSupplyTaxAnimationAsset,
  score: KpSupplyTaxPedagogicalScoreV1
): readonly KpSupplyTaxScoreIssue[] {
  const issues: KpSupplyTaxScoreIssue[] = [];
  const objectIds = new Set(authority.animation.bundle.objects.map(({ id }) => id));
  const beatIds = new Set<string>();
  const slugs = new Set<string>();
  if (score.animationId !== authority.id) {
    issues.push(issue("$.animationId", "Score must bind the canonical supply-tax animation."));
  }
  if (score.beats.length !== 8) {
    issues.push(issue("$.beats", "Supply-tax Focus Deck requires exactly eight semantic beats."));
  }
  score.beats.forEach((entry, index) => {
    const path = `$.beats[${index}]`;
    if (entry.ordinal !== index + 1) {
      issues.push(issue(`${path}.ordinal`, "Ordinals must be consecutive and one-based."));
    }
    if (beatIds.has(entry.id)) {
      issues.push(issue(`${path}.id`, `Duplicate beat id ${entry.id}.`));
    }
    beatIds.add(entry.id);
    if (slugs.has(entry.slug)) {
      issues.push(issue(`${path}.slug`, `Duplicate semantic slug ${entry.slug}.`));
    }
    slugs.add(entry.slug);
    validateAttention(entry.attention, objectIds, path, issues);
  });
  const motionBeats = score.beats.filter(
    ({ transitionFromPrevious }) => transitionFromPrevious === "sample-tax-imposition"
  );
  if (motionBeats.length !== 1 || motionBeats[0]?.slug !== "supply-translation") {
    issues.push(issue(
      "$.beats",
      "Only the supply-translation beat may own tax-imposition motion."
    ));
  }
  score.beats.forEach((entry, index) => {
    const expectedFrame = index < 2 ? "untaxed" : "taxed";
    if (entry.settledFrame !== expectedFrame) {
      issues.push(issue(
        `$.beats[${index}].settledFrame`,
        `Expected the deterministic ${expectedFrame} endpoint.`
      ));
    }
  });
  return Object.freeze(issues);
}

function beat(input: Omit<KpSupplyTaxPedagogicalBeatV1, "attention"> & {
  readonly targetEntityIds: readonly string[];
  readonly contextEntityIds: readonly string[];
  readonly historicalTraceEntityIds?: readonly string[];
  readonly prospectiveTraceEntityIds?: readonly string[];
}): KpSupplyTaxPedagogicalBeatV1 {
  const {
    targetEntityIds,
    contextEntityIds,
    historicalTraceEntityIds = [],
    prospectiveTraceEntityIds = [],
    ...semanticState
  } = input;
  return Object.freeze({
    ...semanticState,
    attention: Object.freeze({
      targetEntityIds: Object.freeze([...targetEntityIds]),
      contextEntityIds: Object.freeze([...contextEntityIds]),
      historicalTraceEntityIds: Object.freeze([...historicalTraceEntityIds]),
      prospectiveTraceEntityIds: Object.freeze([...prospectiveTraceEntityIds])
    })
  });
}

function validateAttention(
  attention: KpSupplyTaxBeatAttentionV1,
  objectIds: ReadonlySet<string>,
  path: string,
  issues: KpSupplyTaxScoreIssue[]
): void {
  const fields = [
    "targetEntityIds",
    "contextEntityIds",
    "historicalTraceEntityIds",
    "prospectiveTraceEntityIds"
  ] as const;
  const seen = new Set<string>();
  for (const field of fields) {
    const ids = attention[field];
    if (field === "targetEntityIds" && ids.length === 0) {
      issues.push(issue(`${path}.attention.${field}`, "Every beat needs a semantic target."));
    }
    for (const [entityIndex, entityId] of ids.entries()) {
      if (!objectIds.has(entityId)) {
        issues.push(issue(
          `${path}.attention.${field}[${entityIndex}]`,
          `Unknown animation entity ${entityId}.`
        ));
      }
      if (seen.has(entityId)) {
        issues.push(issue(
          `${path}.attention.${field}[${entityIndex}]`,
          `Entity ${entityId} must have one attention role per beat.`
        ));
      }
      seen.add(entityId);
    }
  }
}

function requiredCurveId(
  authority: KpEconomicsSupplyTaxAnimationAsset,
  role: KpEconomicsSupplyTaxAnimationAsset["semantics"]["entities"]["curves"][number]["role"]
): string {
  const entity = authority.semantics.entities.curves.find((candidate) => candidate.role === role);
  if (!entity) throw new Error(`Missing curve role ${role}.`);
  return entity.id;
}

function requiredPriceId(
  authority: KpEconomicsSupplyTaxAnimationAsset,
  role: KpEconomicsSupplyTaxAnimationAsset["semantics"]["entities"]["prices"][number]["role"]
): string {
  const entity = authority.semantics.entities.prices.find((candidate) => candidate.role === role);
  if (!entity) throw new Error(`Missing price role ${role}.`);
  return entity.id;
}

function requiredRegionId(
  authority: KpEconomicsSupplyTaxAnimationAsset,
  phase: "untaxed" | "taxed",
  role: KpEconomicsSupplyTaxAnimationAsset["semantics"]["entities"]["regions"][number]["role"]
): string {
  const entity = authority.semantics.entities.regions.find(
    (candidate) => candidate.phase === phase && candidate.role === role
  );
  if (!entity) throw new Error(`Missing ${phase} region role ${role}.`);
  return entity.id;
}

function issue(path: string, message: string): KpSupplyTaxScoreIssue {
  return Object.freeze({ path, message });
}
