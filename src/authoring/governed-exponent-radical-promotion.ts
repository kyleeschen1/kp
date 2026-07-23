import {
  compileKpGovernedSemanticAuthoring,
  type KpGovernedProviderProvenance,
  type KpGovernedSemanticCompileResult,
  type KpGovernedSemanticSourceAuthority
} from "./governed-semantic-compiler.ts";
import {
  createKpGovernedSemanticAuthoringRequest,
  type KpGovernedNormalFormId,
  type KpGovernedSemanticAuthoringRequest
} from "./governed-semantic-request.ts";
import {
  resolveKpAnimationPromotionFacet,
  type KpArtifactPromotionFacet
} from "../animation/artifact-promotion.ts";
import {
  defaultExponentExpansionFixtureId,
  defaultExponentRadicalRewriteFixtureId
} from "../animation/exponent-radical-adapter.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import {
  getGeneratedExponentTutorialFixtureSpec,
  getGeneratedRadicalTutorialFixtureSpec
} from "../semantic/generated-algebra-fixture-registry.ts";
import {
  createGeneratedExponentTutorialFixture,
  createGeneratedRadicalTutorialFixture,
  type GeneratedExponentTutorialFixture,
  type GeneratedRadicalTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";

export const kpGovernedExponentRevisionId =
  "revision.generated.exponent.square-as-product.v1" as const;
export const kpGovernedRadicalRevisionId =
  "revision.generated.radical.square-root-as-power.v1" as const;

type KpAcceptedCompilation = Extract<
  KpGovernedSemanticCompileResult,
  { readonly status: "accepted" }
>;

export interface KpGovernedExponentRadicalPromotionCandidate {
  readonly id: "promotion-candidate.governed.exponent-radical.v1";
  readonly kind: "governed-symbolic-breadth-promotion-candidate";
  readonly status: "human-review-required";
  readonly providerProvenance: KpGovernedProviderProvenance;
  readonly sources: readonly KpGovernedSemanticSourceAuthority[];
  readonly recordedProviderResponses: readonly KpGovernedSemanticAuthoringRequest[];
  readonly compilations: readonly KpAcceptedCompilation[];
  readonly animationPromotion: {
    readonly exponent: KpArtifactPromotionFacet;
    readonly radical: KpArtifactPromotionFacet;
  };
  readonly review: {
    readonly canonicalAnimationIds: readonly string[];
    readonly canonicalRadicalBaselineId: "baseline.radical.material-junction.dashboard-v1";
    readonly requestedDecision:
      "approve exponent as a gold symbolic exemplar beside the promoted radical";
    readonly preservationBoundary: readonly string[];
  };
}

export function createKpGovernedExponentRadicalPromotionCandidate():
  KpGovernedExponentRadicalPromotionCandidate {
  const exponent = exponentFixture();
  const radical = radicalFixture();
  const exponentSource = sourceAuthority({
    fixture: exponent,
    revisionId: kpGovernedExponentRevisionId,
    supportedNormalFormIds: [
      "lowered-exponent-product",
      "expanded-product"
    ]
  });
  const radicalSource = sourceAuthority({
    fixture: radical,
    revisionId: kpGovernedRadicalRevisionId,
    supportedNormalFormIds: ["radical-expression"]
  });
  const providerProvenance = deepFreeze<KpGovernedProviderProvenance>({
    providerId: "openai.codex",
    modelId: "gpt-5",
    responseId: "session.kp.governed-exponent-radical.2026-07-23"
  });
  const requests = [
    lowerExponentRequest(exponent, exponentSource),
    unwrapExponentRequest(exponent, exponentSource),
    radicalRewriteRequest(radical, radicalSource)
  ];
  const compilations = requests.map((request) => {
    const result = compileKpGovernedSemanticAuthoring({
      request,
      sources: [exponentSource, radicalSource],
      provenance: providerProvenance
    });
    if (result.status !== "accepted") {
      throw new Error(
        result.diagnostics.map(({ path, message }) => `${path}: ${message}`).join("\n")
      );
    }
    return result;
  });

  return deepFreeze({
    id: "promotion-candidate.governed.exponent-radical.v1" as const,
    kind: "governed-symbolic-breadth-promotion-candidate" as const,
    status: "human-review-required" as const,
    providerProvenance,
    sources: [exponentSource, radicalSource],
    recordedProviderResponses: requests,
    compilations,
    animationPromotion: {
      exponent: resolveKpAnimationPromotionFacet({
        animationId: "animation.generated.exponent.square-as-product"
      }),
      radical: resolveKpAnimationPromotionFacet({
        animationId: "animation.generated.radical.square-root-as-power"
      })
    },
    review: {
      canonicalAnimationIds: [
        "animation.generated.exponent.square-as-product",
        "animation.generated.radical.square-root-as-power"
      ],
      canonicalRadicalBaselineId:
        "baseline.radical.material-junction.dashboard-v1" as const,
      requestedDecision:
        "approve exponent as a gold symbolic exemplar beside the promoted radical" as const,
      preservationBoundary: [
        "verified generated fixture semantics and trace order",
        "native KaTeX endpoints and structural artifact ownership",
        "measured material continuity and rewind",
        "existing editor catalog identity and routes",
        "renderer-owned geometry, timing, typography, and accessibility"
      ]
    }
  });
}

function lowerExponentRequest(
  fixture: GeneratedExponentTutorialFixture,
  source: KpGovernedSemanticSourceAuthority
): KpGovernedSemanticAuthoringRequest {
  const [initial, lowered] = fixture.bundle.objects;
  const transformation = transformationByType(fixture.transformations, "lowerExponent");
  return request({
    id: "request.governed.exponent.lower.v1",
    title: "Expose one factor while lowering the remaining exponent",
    source,
    operationId: "kp.algebra.lower-exponent",
    roleBindings: {
      "base-before": [selector(initial, "base")],
      "exponent-before": [selector(initial, "exponent")],
      "base-descendants": [
        selector(lowered, "factor-1"),
        selector(lowered, "residual-base")
      ],
      "exponent-descendants": [
        selector(lowered, "times-1"),
        selector(lowered, "residual-exponent")
      ]
    },
    transformation,
    focusIntent: {
      kind: "transmit",
      sourceEntityIds: [
        selector(initial, "base"),
        selector(initial, "exponent")
      ],
      targetEntityIds: [
        selector(lowered, "factor-1"),
        selector(lowered, "residual-base"),
        selector(lowered, "residual-exponent")
      ]
    },
    cadenceIntent: {
      kind: "one-at-a-time",
      branchEntityIds: [
        selector(lowered, "factor-1"),
        selector(lowered, "residual-base")
      ]
    },
    normalFormId: "lowered-exponent-product",
    sourceExpressionId: initial!.id,
    targetExpressionId: lowered!.id
  });
}

function unwrapExponentRequest(
  fixture: GeneratedExponentTutorialFixture,
  source: KpGovernedSemanticSourceAuthority
): KpGovernedSemanticAuthoringRequest {
  const [, lowered, expanded] = fixture.bundle.objects;
  const transformation = transformationByType(
    fixture.transformations,
    "unwrapUnitExponent"
  );
  return request({
    id: "request.governed.exponent.unwrap-unit.v1",
    title: "Remove the unit exponent after both factors are explicit",
    source,
    operationId: "kp.algebra.unwrap-unit-exponent",
    roleBindings: {
      "factors-before": [
        selector(lowered, "factor-1"),
        selector(lowered, "residual-base")
      ],
      "product-operators-before": [selector(lowered, "times-1")],
      "unit-exponent": [selector(lowered, "residual-exponent")],
      "factors-after": [
        selector(expanded, "factor-1"),
        selector(expanded, "factor-2")
      ],
      "product-operators-after": [selector(expanded, "times-1")]
    },
    transformation,
    focusIntent: {
      kind: "notice",
      targetEntityIds: [selector(lowered, "residual-exponent")]
    },
    cadenceIntent: {
      kind: "together",
      branchEntityIds: [
        selector(expanded, "factor-1"),
        selector(expanded, "factor-2")
      ]
    },
    normalFormId: "expanded-product",
    sourceExpressionId: lowered!.id,
    targetExpressionId: expanded!.id
  });
}

function radicalRewriteRequest(
  fixture: GeneratedRadicalTutorialFixture,
  source: KpGovernedSemanticSourceAuthority
): KpGovernedSemanticAuthoringRequest {
  const [power, radical] = fixture.bundle.objects;
  const transformation = transformationByType(
    fixture.transformations,
    "rewritePowerAsRoot"
  );
  return request({
    id: "request.governed.radical.rewrite.v1",
    title: "Reorganize rational exponent notation into a radical",
    source,
    operationId: "kp.algebra.rewrite-power-as-root",
    roleBindings: {
      "base-before": [selector(power, "base")],
      "exponent-fragments": [
        selector(power, "exponent-numerator"),
        selector(power, "exponent-fraction-line"),
        selector(power, "exponent-denominator")
      ],
      "radicand-after": [selector(radical, "radicand")],
      "radical-fragments": [
        selector(radical, "radical-hook"),
        selector(radical, "radical-overbar")
      ]
    },
    transformation,
    focusIntent: {
      kind: "transmit",
      sourceEntityIds: [
        selector(power, "base"),
        selector(power, "exponent-numerator"),
        selector(power, "exponent-fraction-line"),
        selector(power, "exponent-denominator")
      ],
      targetEntityIds: [
        selector(radical, "radicand"),
        selector(radical, "radical-hook"),
        selector(radical, "radical-overbar")
      ]
    },
    cadenceIntent: {
      kind: "stepped",
      branchEntityIds: [
        selector(radical, "radical-hook"),
        selector(radical, "radical-overbar")
      ]
    },
    normalFormId: "radical-expression",
    sourceExpressionId: power!.id,
    targetExpressionId: radical!.id
  });
}

function request(input: {
  readonly id: string;
  readonly title: string;
  readonly source: KpGovernedSemanticSourceAuthority;
  readonly operationId: string;
  readonly roleBindings: Readonly<Record<string, readonly string[]>>;
  readonly transformation: KpSemanticTransformation;
  readonly focusIntent: KpGovernedSemanticAuthoringRequest["focusIntent"];
  readonly cadenceIntent: KpGovernedSemanticAuthoringRequest["cadenceIntent"];
  readonly normalFormId: KpGovernedNormalFormId;
  readonly sourceExpressionId: string;
  readonly targetExpressionId: string;
}): KpGovernedSemanticAuthoringRequest {
  const correspondence = input.transformation.correspondenceMap?.records.map(
    (record) => ({
      relation: record.relation,
      sourceEntityIds: record.sourceSelectorIds,
      targetEntityIds: record.targetSelectorIds
    })
  ) ?? [];
  return createKpGovernedSemanticAuthoringRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v1",
    id: input.id,
    title: input.title,
    source: {
      kind: "verified-semantic-source",
      sourceId: input.source.sourceId,
      revisionId: input.source.revisionId,
      entityIds: input.source.entityIds,
      expressionIds: input.source.expressionIds,
      operationPacks: [
        { packId: "kp.core", version: "1.0.0" },
        { packId: "kp.algebra", version: "0.1.0" }
      ]
    },
    operationIntent: {
      operationId: input.operationId,
      roleBindings: input.roleBindings,
      correspondence
    },
    focusIntent: input.focusIntent,
    cadenceIntent: input.cadenceIntent,
    normalFormIntent: {
      normalFormId: input.normalFormId,
      sourceExpressionId: input.sourceExpressionId,
      targetExpressionId: input.targetExpressionId
    },
    compressionIntent: {
      level: "key-steps",
      preserve: ["law", "lineage"]
    }
  });
}

function sourceAuthority(input: {
  readonly fixture: GeneratedExponentTutorialFixture | GeneratedRadicalTutorialFixture;
  readonly revisionId: string;
  readonly supportedNormalFormIds: readonly KpGovernedNormalFormId[];
}): KpGovernedSemanticSourceAuthority {
  return deepFreeze({
    sourceId: input.fixture.id,
    revisionId: input.revisionId,
    entityIds: input.fixture.bundle.objects.flatMap((object) =>
      object.selectors.map(({ id }) => id)
    ),
    expressionIds: input.fixture.bundle.objects.map(({ id }) => id),
    supportedNormalFormIds: [...input.supportedNormalFormIds],
    evidenceIds: [
      input.fixture.trace.id,
      ...input.fixture.transformations.flatMap((transformation) =>
        transformation.lawRefs?.map(({ id }) => id) ?? []
      )
    ]
  });
}

function transformationByType(
  transformations: readonly KpSemanticTransformation[],
  transformType: string
): KpSemanticTransformation {
  const result = transformations.find((candidate) =>
    candidate.transformType === transformType
  );
  if (result === undefined) throw new Error(`Missing transformation ${transformType}.`);
  return result;
}

function selector(
  object: GeneratedExponentTutorialFixture["bundle"]["objects"][number] | undefined,
  suffix: string
): string {
  const result = object?.selectors.find((candidate) =>
    candidate.id.endsWith(`.${suffix}`)
  )?.id;
  if (result === undefined) {
    throw new Error(`Missing selector ${object?.id ?? "unknown"}.${suffix}.`);
  }
  return result;
}

function exponentFixture(): GeneratedExponentTutorialFixture {
  const spec = getGeneratedExponentTutorialFixtureSpec(
    defaultExponentExpansionFixtureId
  );
  if (spec === undefined) throw new Error("Missing canonical exponent fixture.");
  return createGeneratedExponentTutorialFixture(spec);
}

function radicalFixture(): GeneratedRadicalTutorialFixture {
  const spec = getGeneratedRadicalTutorialFixtureSpec(
    defaultExponentRadicalRewriteFixtureId
  );
  if (spec === undefined) throw new Error("Missing canonical radical fixture.");
  return createGeneratedRadicalTutorialFixture(spec);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
