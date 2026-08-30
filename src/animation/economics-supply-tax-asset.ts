import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  createKpPerUnitTaxWelfareAsset,
  type KpPerUnitTaxWelfareAssetV1
} from "../../domains/economics/per-unit-tax-welfare-asset.ts";
import {
  sampleKpPerUnitTaxWelfareFrame,
  type KpPerUnitTaxWelfareFrameV1,
  type KpSupplyTaxFrameDirection
} from "../../domains/economics/per-unit-tax-welfare-frame.ts";
import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from
  "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

export const KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID =
  "animation.economics.supply-tax-welfare" as const;
export const KP_ECONOMICS_SUPPLY_TAX_TRANSFORMATION_ID =
  "transform.economics.impose-per-unit-tax" as const;
export const KP_ECONOMICS_SUPPLY_TAX_TIMELINE_ID =
  "timeline.economics.supply-tax-welfare" as const;
export const KP_ECONOMICS_SUPPLY_TAX_RENDER_TARGET_ID =
  "render.economics.supply-tax-welfare" as const;

export interface KpEconomicsSupplyTaxAnimationAsset {
  readonly id: typeof KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID;
  readonly animation: KpAnimationAsset;
  readonly semantics: KpPerUnitTaxWelfareAssetV1;
  readonly accessibility: Readonly<{
    title: string;
    description: string;
    settledDescription: string;
  }>;
}

export function createKpEconomicsSupplyTaxAnimationAsset(
  semantics: KpPerUnitTaxWelfareAssetV1 =
    createKpPerUnitTaxWelfareAsset()
): KpEconomicsSupplyTaxAnimationAsset {
  const model = semantics.model;
  const objects: KpSemanticAssetObject[] = [
    object(semantics.id, "economics-supply-tax-semantic-authority",
      "Exact supply-tax semantic authority", semantics, [
        selector(`${semantics.id}.authority`, "domain-authority",
          "Exact market and welfare authority")
      ]),
    object(model.input.tax.id, "economics-per-unit-tax", "Per-unit tax",
      model.input.tax, [
        selector(`${model.input.tax.id}.untaxed`, "parameter-value",
          "Initial zero tax"),
        selector(`${model.input.tax.id}.taxed`, "parameter-value",
          "Final per-unit tax")
      ]),
    ...semantics.entities.curves.map((curve) => object(
      curve.id,
      "economics-linear-market-curve",
      curve.role,
      curve,
      [selector(`${curve.id}.body`, "market-curve", curve.role)]
    )),
    object(model.states.untaxed.id, "economics-market-state",
      "Untaxed equilibrium", model.states.untaxed, [
        selector(`${model.states.untaxed.id}.point`, "equilibrium-point",
          "Untaxed equilibrium")
      ]),
    object(model.states.taxed.id, "economics-market-state",
      "Taxed equilibrium", model.states.taxed, [
        selector(`${model.states.taxed.id}.point`, "equilibrium-point",
          "Taxed equilibrium")
      ]),
    ...semantics.entities.prices.map((price) => object(
      price.id,
      "economics-price-level",
      price.role,
      price,
      [selector(`${price.id}.level`, "price-level", price.role)]
    )),
    object(semantics.entities.wedge.id, "economics-price-wedge",
      "Tax price wedge", semantics.entities.wedge, [
        selector(`${semantics.entities.wedge.id}.body`, "price-wedge",
          "Consumer-producer tax wedge")
      ]),
    ...semantics.entities.regions.map((region) => object(
      region.id,
      "economics-welfare-region",
      `${region.phase} ${region.role}`,
      region,
      [selector(`${region.id}.body`, "welfare-region", region.role)]
    ))
  ];
  const byRegionRole = new Map(
    semantics.entities.regions.map((region) =>
      [`${region.phase}:${region.role}`, region] as const)
  );
  const untaxedConsumer = requiredRegion(byRegionRole,
    "untaxed:consumer-surplus");
  const untaxedProducer = requiredRegion(byRegionRole,
    "untaxed:producer-surplus");
  const taxedConsumer = requiredRegion(byRegionRole,
    "taxed:consumer-surplus");
  const taxedProducer = requiredRegion(byRegionRole,
    "taxed:producer-surplus");
  const taxedRevenue = requiredRegion(byRegionRole,
    "taxed:government-revenue");
  const taxedDwl = requiredRegion(byRegionRole,
    "taxed:deadweight-loss");
  const untaxedPrice = requiredPrice(semantics, "untaxed-market");
  const consumerPrice = requiredPrice(semantics, "consumer");
  const producerPrice = requiredPrice(semantics, "producer");
  const demand = requiredCurve(semantics, "demand");
  const supply = requiredCurve(semantics, "marginal-cost-supply");
  const taxedSupply = requiredCurve(semantics,
    "buyer-facing-taxed-supply");
  const sourceObjectIds = [
    semantics.id,
    demand.id,
    supply.id,
    model.input.tax.id,
    model.states.untaxed.id,
    untaxedPrice.id,
    untaxedConsumer.id,
    untaxedProducer.id
  ];
  const targetObjectIds = [
    semantics.id,
    demand.id,
    supply.id,
    taxedSupply.id,
    model.input.tax.id,
    model.states.taxed.id,
    consumerPrice.id,
    producerPrice.id,
    semantics.entities.wedge.id,
    taxedConsumer.id,
    taxedProducer.id,
    taxedRevenue.id,
    taxedDwl.id
  ];
  const transformation = createKpSemanticTransformation({
    id: KP_ECONOMICS_SUPPLY_TAX_TRANSFORMATION_ID,
    definitionId: "definition.economics.per-unit-tax",
    transformType: "imposePerUnitTax",
    title: "Impose a per-unit tax and follow market welfare",
    sourceObjectIds,
    targetObjectIds,
    preserves: ["role", "structure"],
    correspondence: [
      persistent(`${semantics.id}.authority`, ["identity", "value"]),
      persistent(`${demand.id}.body`, ["identity", "value", "role"]),
      persistent(`${supply.id}.body`, ["identity", "value", "role"]),
      between(`${model.input.tax.id}.untaxed`,
        `${model.input.tax.id}.taxed`, ["role"]),
      between(`${model.states.untaxed.id}.point`,
        `${model.states.taxed.id}.point`, ["role"]),
      between(`${untaxedPrice.id}.level`, `${consumerPrice.id}.level`,
        ["role"]),
      between(`${untaxedPrice.id}.level`, `${producerPrice.id}.level`,
        ["role"]),
      between(`${untaxedConsumer.id}.body`, `${taxedConsumer.id}.body`,
        ["role"]),
      between(`${untaxedProducer.id}.body`, `${taxedProducer.id}.body`,
        ["role"])
    ],
    assumptions: [
      "Supply and demand are linear over the bounded visible domain.",
      "The initial per-unit tax is zero and the final tax is positive.",
      "The original supply curve remains marginal-cost evidence after tax."
    ],
    lawRefs: [
      {
        id: "law.economics.supply-tax.market-clearing",
        level: "strict",
        summary: "Demand equals buyer-facing taxed supply at every exact sample."
      },
      {
        id: "law.economics.supply-tax.wedge-equals-tax",
        level: "strict",
        summary: "Consumer price minus producer price equals the per-unit tax."
      },
      {
        id: "law.economics.supply-tax.welfare-closes",
        level: "strict",
        summary: "Private surplus loss equals revenue plus deadweight loss."
      }
    ]
  });
  const animation = createKpAnimationAsset({
    id: KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID,
    title: "A per-unit tax and market welfare",
    bundle: createKpAssetBundle({
      id: "bundle.economics.supply-tax-welfare",
      title: "Supply-tax market and welfare semantics",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds,
          targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      ),
      annotations: [{
        id: "focus.economics.supply-tax.transformation",
        kind: "focus",
        targetNodeId: transformation.id,
        placement: "during",
        selectorIds: [
          `${model.input.tax.id}.taxed`,
          `${supply.id}.body`,
          `${taxedSupply.id}.body`,
          `${model.states.untaxed.id}.point`,
          `${model.states.taxed.id}.point`
        ],
        summary: "Follow the tax shift while original supply remains evidence."
      }]
    }),
    timeline: {
      id: KP_ECONOMICS_SUPPLY_TAX_TIMELINE_ID,
      durationMs: 960,
      beatCount: 32,
      markerIds: [
        "marker.economics.supply-tax.untaxed",
        "marker.economics.supply-tax.transit",
        "marker.economics.supply-tax.taxed"
      ]
    },
    layout: {
      id: "layout.economics.supply-tax-welfare",
      kind: "single",
      targetId: KP_ECONOMICS_SUPPLY_TAX_RENDER_TARGET_ID
    },
    renderTargets: [{
      id: KP_ECONOMICS_SUPPLY_TAX_RENDER_TARGET_ID,
      kind: "graph",
      objectIds: objects.map(({ id }) => id),
      selectorIds: objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: [transformation.id],
      timelineId: KP_ECONOMICS_SUPPLY_TAX_TIMELINE_ID,
      summary: "Native SVG market graph and exact welfare ledger.",
      metadata: {
        graphMotionKind: "economics-supply-tax-welfare",
        semanticAuthorityId: semantics.id,
        frameSamplerId: "sampler.economics.supply-tax-welfare.exact-v1",
        clockAuthority: "reader-timeline-playback-clock",
        originalSupplyId: supply.id,
        taxedSupplyId: taxedSupply.id
      }
    }],
    checks: [{
      id: "check.economics.supply-tax.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID
    }, {
      id: "check.economics.supply-tax.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: transformation.id
    }, {
      id: "check.economics.supply-tax.original-supply-retention",
      lawId: "law.economics.supply-tax.original-supply-retention",
      level: "strict",
      targetId: transformation.id
    }, {
      id: "check.economics.supply-tax.welfare-closes",
      lawId: "law.economics.supply-tax.welfare-closes",
      level: "strict",
      targetId: transformation.id
    }],
    exportTargets: [{
      id: "export.economics.supply-tax.static-step",
      kind: "static-step",
      artifactId: KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID,
      summary: "Untaxed and taxed semantic endpoints remain usable without motion."
    }],
    dashboard: {
      rowId: "animation-economics-supply-tax-welfare",
      tags: ["animation", "economics", "tax", "welfare", "graph"],
      sampleTargetIds: [KP_ECONOMICS_SUPPLY_TAX_RENDER_TARGET_ID],
      sourceRefIds: [semantics.id]
    },
    metadata: {
      domain: "economics",
      graphMotionKind: "economics-supply-tax-welfare",
      semanticAuthority: semantics.id,
      summary:
        "Shift buyer-facing supply by a per-unit tax, separate prices, and account for welfare.",
      visualStatus: "provisional-until-human-checkpoint"
    }
  });

  return Object.freeze({
    id: KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID,
    animation,
    semantics,
    accessibility: Object.freeze({
      title: "A per-unit tax changes a competitive market",
      description:
        "A tax shifts buyer-facing supply upward while original supply remains visible as marginal cost.",
      settledDescription:
        "Quantity falls from five to three, consumers pay nine, producers receive five, government receives twelve, and deadweight loss is four."
    })
  });
}

export function sampleKpEconomicsSupplyTaxAnimationFrame(input: {
  readonly asset: KpEconomicsSupplyTaxAnimationAsset;
  readonly progress: ExactRationalDto;
  readonly direction?: KpSupplyTaxFrameDirection | undefined;
}): KpPerUnitTaxWelfareFrameV1 {
  if (input.asset.animation.id !== KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID) {
    throw new Error("Supply-tax sampler received a mismatched animation asset.");
  }
  return sampleKpPerUnitTaxWelfareFrame({
    asset: input.asset.semantics,
    progress: input.progress,
    ...(input.direction === undefined ? {} : { direction: input.direction })
  });
}

function object<T>(
  id: string,
  objectType: string,
  title: string,
  value: T,
  selectors: readonly ReturnType<typeof selector>[]
): KpSemanticAssetObject<T> {
  return createKpSemanticAssetObject({ id, objectType, title, value, selectors });
}

function selector(id: string, kind: string, label: string) {
  return { id, kind, label };
}

function persistent(
  selectorId: string,
  preserves: readonly ("identity" | "value" | "role" | "structure")[]
) {
  return between(selectorId, selectorId, preserves);
}

function between(
  sourceSelectorId: string,
  targetSelectorId: string,
  preserves: readonly ("identity" | "value" | "role" | "structure")[]
) {
  return { sourceSelectorId, targetSelectorId, preserves };
}

function requiredCurve(
  semantics: KpPerUnitTaxWelfareAssetV1,
  role: KpPerUnitTaxWelfareAssetV1["entities"]["curves"][number]["role"]
) {
  const curve = semantics.entities.curves.find((candidate) =>
    candidate.role === role
  );
  if (curve === undefined) throw new Error(`Missing supply-tax curve ${role}.`);
  return curve;
}

function requiredPrice(
  semantics: KpPerUnitTaxWelfareAssetV1,
  role: KpPerUnitTaxWelfareAssetV1["entities"]["prices"][number]["role"]
) {
  const price = semantics.entities.prices.find((candidate) =>
    candidate.role === role
  );
  if (price === undefined) throw new Error(`Missing supply-tax price ${role}.`);
  return price;
}

function requiredRegion(
  regions: ReadonlyMap<string, KpPerUnitTaxWelfareAssetV1["entities"]["regions"][number]>,
  key: string
) {
  const region = regions.get(key);
  if (region === undefined) throw new Error(`Missing supply-tax region ${key}.`);
  return region;
}
