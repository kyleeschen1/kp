import type { KpEconomicsSupplyTaxAnimationAsset } from
  "../../animation/economics-supply-tax-asset.ts";
import type { KpSupplyTaxPedagogicalBeatV1 } from
  "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";

export type KpSupplyTaxScrollScoreStageFactId =
  | "tax-wedge"
  | "supply-translation"
  | "price-wedge"
  | "quantity-contraction"
  | "surplus-redistribution"
  | "government-revenue"
  | "deadweight-loss";

export interface KpSupplyTaxScrollScoreStageFactV1 {
  readonly id: KpSupplyTaxScrollScoreStageFactId;
  readonly latex: string;
}

export const kpSupplyTaxScrollScoreStageFacts:
readonly KpSupplyTaxScrollScoreStageFactV1[] = Object.freeze([
  fact("tax-wedge", "P_c=P_p+t,\\quad t=4"),
  fact("supply-translation", "S_t=S+t"),
  fact("price-wedge", "P_c-P_p=t=4"),
  fact("quantity-contraction", "Q_0=5\\;\\longrightarrow\\;Q_t=3"),
  fact("surplus-redistribution",
    "CS,PS:\\;\\frac{25}{2}\\;\\longrightarrow\\;\\frac{9}{2}"),
  fact("government-revenue", "GR=tQ_t=4\\cdot3=12"),
  fact("deadweight-loss", "DWL=4")
]);

export type KpSupplyTaxScrollScoreCurveRole =
  "demand" | "supply" | "taxed-supply";

export type KpSupplyTaxScrollScoreLabelRole =
  | "demand"
  | "supply"
  | "taxed-supply"
  | "untaxed-equilibrium"
  | "taxed-equilibrium"
  | "consumer-price"
  | "producer-price"
  | "taxed-quantity"
  | "tax-wedge";

export type KpSupplyTaxScrollScoreMarketMarkRole =
  | "consumer-price-guide"
  | "producer-price-guide"
  | "quantity-guide"
  | "wedge"
  | "wedge-cap-consumer"
  | "wedge-cap-producer"
  | "taxed-equilibrium-point"
  | "producer-point";

export interface KpSupplyTaxScrollScoreStageLensV1 {
  readonly fromBeatSlug: string;
  readonly toBeatSlug: string;
  readonly progress: number;
  readonly axesStrength: number;
  readonly baselineEquilibriumStrength: number;
  readonly curveStrengths: Readonly<Record<
    KpSupplyTaxScrollScoreCurveRole,
    number
  >>;
  readonly labelStrengths: Readonly<Record<
    KpSupplyTaxScrollScoreLabelRole,
    number
  >>;
  readonly marketMarkStrengths: Readonly<Record<
    KpSupplyTaxScrollScoreMarketMarkRole,
    number
  >>;
  readonly regionStrengths: Readonly<Record<string, number>>;
  readonly factStrengths: Readonly<Record<
    KpSupplyTaxScrollScoreStageFactId,
    number
  >>;
}

interface LensStop {
  readonly axes: number;
  readonly baselineEquilibrium: number;
  readonly curves: Readonly<Record<KpSupplyTaxScrollScoreCurveRole, number>>;
  readonly labels: Readonly<Record<KpSupplyTaxScrollScoreLabelRole, number>>;
  readonly marks: Readonly<Record<KpSupplyTaxScrollScoreMarketMarkRole, number>>;
  readonly fact?: KpSupplyTaxScrollScoreStageFactId;
}

const curveRoles = Object.freeze([
  "demand",
  "supply",
  "taxed-supply"
] as const satisfies readonly KpSupplyTaxScrollScoreCurveRole[]);

const labelRoles = Object.freeze([
  "demand",
  "supply",
  "taxed-supply",
  "untaxed-equilibrium",
  "taxed-equilibrium",
  "consumer-price",
  "producer-price",
  "taxed-quantity",
  "tax-wedge"
] as const satisfies readonly KpSupplyTaxScrollScoreLabelRole[]);

const marketMarkRoles = Object.freeze([
  "consumer-price-guide",
  "producer-price-guide",
  "quantity-guide",
  "wedge",
  "wedge-cap-consumer",
  "wedge-cap-producer",
  "taxed-equilibrium-point",
  "producer-point"
] as const satisfies readonly KpSupplyTaxScrollScoreMarketMarkRole[]);

const welfareBeforeStop = stop({
  axes: 0.62,
  baselineEquilibrium: 1,
  curves: { demand: 0.82, supply: 0.82 },
  labels: { "untaxed-equilibrium": 0.9 },
  marks: {}
});

const stops: Readonly<Record<string, LensStop>> = Object.freeze({
  "baseline-market": stop({
    axes: 0.72,
    baselineEquilibrium: 1,
    curves: { demand: 1, supply: 1 },
    labels: { demand: 1, supply: 1, "untaxed-equilibrium": 1 }
  }),
  "tax-input": stop({
    axes: 0.55,
    baselineEquilibrium: 0.46,
    curves: { demand: 0.52, supply: 0.52 },
    labels: { demand: 0.68, supply: 0.68 },
    fact: "tax-wedge"
  }),
  "supply-translation": stop({
    axes: 0.5,
    baselineEquilibrium: 0.18,
    curves: { demand: 0.42, supply: 0.72, "taxed-supply": 1 },
    labels: { demand: 0.62, supply: 0.82, "taxed-supply": 1 },
    marks: { "taxed-equilibrium-point": 0.62 },
    fact: "supply-translation"
  }),
  "price-wedge": stop({
    axes: 0.55,
    baselineEquilibrium: 0.12,
    curves: { demand: 0.48, supply: 0.28, "taxed-supply": 0.55 },
    labels: {
      "consumer-price": 1,
      "producer-price": 1,
      "tax-wedge": 1
    },
    marks: {
      "consumer-price-guide": 0.72,
      "producer-price-guide": 0.72,
      wedge: 1,
      "wedge-cap-consumer": 1,
      "wedge-cap-producer": 1,
      "taxed-equilibrium-point": 0.72,
      "producer-point": 0.72
    },
    fact: "price-wedge"
  }),
  "quantity-contraction": stop({
    axes: 0.66,
    baselineEquilibrium: 0.85,
    curves: { demand: 0.55, supply: 0.3, "taxed-supply": 0.5 },
    labels: {
      "untaxed-equilibrium": 0.82,
      "taxed-equilibrium": 1,
      "taxed-quantity": 1
    },
    marks: {
      "quantity-guide": 0.88,
      "taxed-equilibrium-point": 1
    },
    fact: "quantity-contraction"
  }),
  "surplus-redistribution": stop({
    axes: 0.48,
    baselineEquilibrium: 0.08,
    curves: { demand: 0.36, supply: 0.22, "taxed-supply": 0.36 },
    labels: { "consumer-price": 0.66, "producer-price": 0.66 },
    marks: {
      "consumer-price-guide": 0.38,
      "producer-price-guide": 0.38
    },
    fact: "surplus-redistribution"
  }),
  "government-revenue": stop({
    axes: 0.44,
    baselineEquilibrium: 0,
    curves: { demand: 0.3, supply: 0.18, "taxed-supply": 0.3 },
    labels: { "taxed-quantity": 0.8, "tax-wedge": 0.85 },
    marks: {
      "quantity-guide": 0.48,
      wedge: 0.78,
      "wedge-cap-consumer": 0.78,
      "wedge-cap-producer": 0.78
    },
    fact: "government-revenue"
  }),
  "deadweight-loss": stop({
    axes: 0.58,
    baselineEquilibrium: 0.7,
    curves: { demand: 0.42, supply: 0.42, "taxed-supply": 0.18 },
    labels: {
      "untaxed-equilibrium": 0.72,
      "taxed-equilibrium": 0.8,
      "taxed-quantity": 0.85
    },
    marks: {
      "quantity-guide": 0.72,
      "taxed-equilibrium-point": 0.8
    },
    fact: "deadweight-loss"
  })
});

export function projectKpSupplyTaxScrollScoreStageLens(input: {
  readonly authority: KpEconomicsSupplyTaxAnimationAsset;
  readonly fromBeat: KpSupplyTaxPedagogicalBeatV1;
  readonly toBeat: KpSupplyTaxPedagogicalBeatV1;
  readonly progress: number;
}): KpSupplyTaxScrollScoreStageLensV1 {
  const progress = boundedProgress(input.progress);
  const from = requiredStop(input.fromBeat.slug);
  const to = requiredStop(input.toBeat.slug);
  const visual = projectVisualInterval({
    from,
    to,
    fromBeatSlug: input.fromBeat.slug,
    toBeatSlug: input.toBeat.slug,
    progress
  });
  return Object.freeze({
    fromBeatSlug: input.fromBeat.slug,
    toBeatSlug: input.toBeat.slug,
    progress,
    axesStrength: interpolate(
      visual.from.axes,
      visual.to.axes,
      visual.progress
    ),
    baselineEquilibriumStrength: interpolate(
      visual.from.baselineEquilibrium,
      visual.to.baselineEquilibrium,
      visual.progress
    ),
    curveStrengths: interpolateRecord(
      curveRoles,
      visual.from.curves,
      visual.to.curves,
      visual.progress
    ),
    labelStrengths: interpolateRecord(
      labelRoles,
      visual.from.labels,
      visual.to.labels,
      visual.progress
    ),
    marketMarkStrengths: interpolateRecord(
      marketMarkRoles,
      visual.from.marks,
      visual.to.marks,
      visual.progress
    ),
    regionStrengths: projectRegionStrengths(input, progress),
    factStrengths: projectFactStrengths(from.fact, to.fact, progress)
  });
}

function projectVisualInterval(input: {
  readonly from: LensStop;
  readonly to: LensStop;
  readonly fromBeatSlug: string;
  readonly toBeatSlug: string;
  readonly progress: number;
}): Readonly<{ from: LensStop; to: LensStop; progress: number }> {
  if (input.fromBeatSlug !== "quantity-contraction" ||
      input.toBeatSlug !== "surplus-redistribution") {
    return Object.freeze({
      from: input.from,
      to: input.to,
      progress: input.progress
    });
  }
  if (input.progress <= 0.18) {
    return Object.freeze({
      from: input.from,
      to: welfareBeforeStop,
      progress: input.progress / 0.18
    });
  }
  if (input.progress <= 0.45) {
    return Object.freeze({
      from: welfareBeforeStop,
      to: welfareBeforeStop,
      progress: 1
    });
  }
  return Object.freeze({
    from: welfareBeforeStop,
    to: input.to,
    progress: boundedProgress((input.progress - 0.45) / 0.37)
  });
}

function projectRegionStrengths(
  input: {
    readonly authority: KpEconomicsSupplyTaxAnimationAsset;
    readonly fromBeat: KpSupplyTaxPedagogicalBeatV1;
    readonly toBeat: KpSupplyTaxPedagogicalBeatV1;
  },
  progress: number
): Readonly<Record<string, number>> {
  const regions = input.authority.semantics.entities.regions;
  const beforeConsumer = requiredRegionId(regions, "untaxed", "consumer-surplus");
  const beforeProducer = requiredRegionId(regions, "untaxed", "producer-surplus");
  const afterConsumer = requiredRegionId(regions, "taxed", "consumer-surplus");
  const afterProducer = requiredRegionId(regions, "taxed", "producer-surplus");
  const revenue = requiredRegionId(regions, "taxed", "government-revenue");
  const loss = requiredRegionId(regions, "taxed", "deadweight-loss");
  const ids = [
    beforeConsumer,
    beforeProducer,
    afterConsumer,
    afterProducer,
    revenue,
    loss
  ];
  const from = regionStop(input.fromBeat.slug, {
    afterConsumer,
    afterProducer,
    revenue,
    loss
  });
  const to = regionStop(input.toBeat.slug, {
    afterConsumer,
    afterProducer,
    revenue,
    loss
  });
  const strengths = Object.fromEntries(ids.map((id) => [
    id,
    interpolate(from[id] ?? 0, to[id] ?? 0, progress)
  ]));

  if (input.fromBeat.slug === "quantity-contraction" &&
      input.toBeat.slug === "surplus-redistribution") {
    // The welfare sentence first recalls the old whole, then replaces it with
    // the surviving private surplus. Keeping the two intervals distinct is
    // what lets the learner read redistribution instead of an overpainted key.
    const before = progress <= 0.18
      ? progress / 0.18
      : progress <= 0.45
        ? 1
        : progress < 0.68
          ? 1 - (progress - 0.45) / 0.23
          : 0;
    const after = progress <= 0.52
      ? 0
      : boundedProgress((progress - 0.52) / 0.3);
    strengths[beforeConsumer] = before;
    strengths[beforeProducer] = before;
    strengths[afterConsumer] = after;
    strengths[afterProducer] = after;
  }
  return Object.freeze(strengths);
}

function regionStop(
  slug: string,
  ids: {
    readonly afterConsumer: string;
    readonly afterProducer: string;
    readonly revenue: string;
    readonly loss: string;
  }
): Readonly<Record<string, number>> {
  if (slug === "surplus-redistribution") {
    return Object.freeze({
      [ids.afterConsumer]: 1,
      [ids.afterProducer]: 1
    });
  }
  if (slug === "government-revenue") {
    return Object.freeze({
      [ids.afterConsumer]: 0.22,
      [ids.afterProducer]: 0.22,
      [ids.revenue]: 1
    });
  }
  if (slug === "deadweight-loss") {
    return Object.freeze({ [ids.revenue]: 0.2, [ids.loss]: 1 });
  }
  return Object.freeze({});
}

function projectFactStrengths(
  from: KpSupplyTaxScrollScoreStageFactId | undefined,
  to: KpSupplyTaxScrollScoreStageFactId | undefined,
  progress: number
): Readonly<Record<KpSupplyTaxScrollScoreStageFactId, number>> {
  const strengths = Object.fromEntries(kpSupplyTaxScrollScoreStageFacts.map(
    ({ id }) => [id, 0]
  )) as Record<KpSupplyTaxScrollScoreStageFactId, number>;
  if (from === to) {
    if (to !== undefined) strengths[to] = 1;
    return Object.freeze(strengths);
  }
  const releaseEnd = from === "quantity-contraction" &&
    to === "surplus-redistribution" ? 0.18 : 0.38;
  if (from !== undefined) {
    strengths[from] = 1 - boundedProgress(progress / releaseEnd);
  }
  if (to !== undefined) {
    strengths[to] = boundedProgress((progress - 0.58) / 0.42);
  }
  return Object.freeze(strengths);
}

function stop(input: {
  readonly axes: number;
  readonly baselineEquilibrium: number;
  readonly curves: Partial<Record<KpSupplyTaxScrollScoreCurveRole, number>>;
  readonly labels: Partial<Record<KpSupplyTaxScrollScoreLabelRole, number>>;
  readonly marks?: Partial<Record<KpSupplyTaxScrollScoreMarketMarkRole, number>>;
  readonly fact?: KpSupplyTaxScrollScoreStageFactId;
}): LensStop {
  return Object.freeze({
    axes: input.axes,
    baselineEquilibrium: input.baselineEquilibrium,
    curves: completeRecord(curveRoles, input.curves),
    labels: completeRecord(labelRoles, input.labels),
    marks: completeRecord(marketMarkRoles, input.marks ?? {}),
    ...(input.fact === undefined ? {} : { fact: input.fact })
  });
}

function fact(id: KpSupplyTaxScrollScoreStageFactId, latex: string) {
  return Object.freeze({ id, latex });
}

function completeRecord<K extends string>(
  keys: readonly K[],
  values: Partial<Record<K, number>>
): Readonly<Record<K, number>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    values[key] ?? 0
  ])) as Record<K, number>);
}

function interpolateRecord<K extends string>(
  keys: readonly K[],
  from: Readonly<Record<K, number>>,
  to: Readonly<Record<K, number>>,
  progress: number
): Readonly<Record<K, number>> {
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    interpolate(from[key], to[key], progress)
  ])) as Record<K, number>);
}

function requiredStop(slug: string): LensStop {
  const value = stops[slug];
  if (value === undefined) throw new Error(`Missing Scroll Score lens ${slug}.`);
  return value;
}

function requiredRegionId(
  regions: KpEconomicsSupplyTaxAnimationAsset["semantics"]["entities"]["regions"],
  phase: "untaxed" | "taxed",
  role: "consumer-surplus" | "producer-surplus" |
    "government-revenue" | "deadweight-loss"
): string {
  const region = regions.find((candidate) =>
    candidate.phase === phase && candidate.role === role);
  if (region === undefined) throw new Error(`Missing ${phase} ${role} region.`);
  return region.id;
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function boundedProgress(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scroll Score lens progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
