import {
  compileKpGovernedSemanticAuthoring,
  type KpGovernedProviderProvenance,
  type KpGovernedSemanticCompileResult,
  type KpGovernedSemanticSourceAuthority
} from "./governed-semantic-compiler.ts";
import {
  createKpGovernedSemanticAuthoringRequest,
  type KpGovernedSemanticAuthoringRequest
} from "./governed-semantic-request.ts";
import {
  createKpOpaqueFractionFanOutFixture
} from "../semantic/fraction-fan-out-fixture.ts";
import {
  listKpStructuredExpressionSubtrees
} from "../semantic/structured-expression.ts";

export const kpGovernedFractionFanOutRevisionId =
  "revision.fixture.fraction-fan-out.v1" as const;

type KpAcceptedGovernedSemanticCompilation = Extract<
  KpGovernedSemanticCompileResult,
  { readonly status: "accepted" }
>;

export interface KpGovernedFractionFanOutExemplar {
  readonly id: "exemplar.governed-authoring.fraction-fan-out.v1";
  readonly kind: "governed-semantic-authoring-exemplar";
  readonly recordedProviderResponse: KpGovernedSemanticAuthoringRequest;
  readonly sourceAuthority: KpGovernedSemanticSourceAuthority;
  readonly providerProvenance: KpGovernedProviderProvenance;
  readonly compilation: KpAcceptedGovernedSemanticCompilation;
  readonly authorityAudit: {
    readonly providerSelected: readonly string[];
    readonly compilerDerived: readonly string[];
    readonly explicitlyExcluded: readonly string[];
  };
}

export function createKpGovernedFractionFanOutExemplar():
  KpGovernedFractionFanOutExemplar {
  const fixture = createKpOpaqueFractionFanOutFixture();
  const sourceAuthority = deepFreeze<KpGovernedSemanticSourceAuthority>({
    sourceId: fixture.id,
    revisionId: kpGovernedFractionFanOutRevisionId,
    entityIds: [
      ...listKpStructuredExpressionSubtrees(fixture.source).map(({ id }) => id),
      ...listKpStructuredExpressionSubtrees(fixture.target).map(({ id }) => id)
    ],
    expressionIds: [fixture.source.root.id, fixture.target.root.id],
    supportedNormalFormIds: [fixture.normalFormPlan.targetForm],
    evidenceIds: [
      fixture.normalFormPlan.rewriteLawId,
      fixture.normalFormPlan.intentId
    ]
  });
  const recordedProviderResponse = createKpGovernedSemanticAuthoringRequest({
    schemaVersion: "kp.governed-semantic-authoring-request.v1",
    id: "request.governed.fraction-fan-out.v1",
    title: "Show the common fraction factor reaching both addends",
    source: {
      kind: "verified-semantic-source",
      sourceId: fixture.id,
      revisionId: kpGovernedFractionFanOutRevisionId,
      entityIds: sourceAuthority.entityIds,
      expressionIds: sourceAuthority.expressionIds,
      operationPacks: [
        { packId: "kp.core", version: "1.0.0" },
        { packId: "kp.algebra", version: "0.1.0" }
      ]
    },
    operationIntent: {
      operationId: "kp.algebra.distribute-multiplication",
      roleBindings: {
        "factor-before": ["fraction-fan-out.source.factor"],
        "addends-before": [
          "fraction-fan-out.source.addend.x",
          "fraction-fan-out.source.addend.6"
        ],
        "factor-copies": [
          "fraction-fan-out.target.factor.x",
          "fraction-fan-out.target.factor.6"
        ],
        "products-after": [
          "fraction-fan-out.target.term.x",
          "fraction-fan-out.target.term.6"
        ]
      },
      correspondence: [{
        relation: "fan-out",
        sourceEntityIds: ["fraction-fan-out.source.factor"],
        targetEntityIds: [
          "fraction-fan-out.target.factor.x",
          "fraction-fan-out.target.factor.6"
        ]
      }]
    },
    focusIntent: {
      kind: "transmit",
      sourceEntityIds: ["fraction-fan-out.source.factor"],
      targetEntityIds: [
        "fraction-fan-out.target.factor.x",
        "fraction-fan-out.target.factor.6"
      ]
    },
    cadenceIntent: {
      kind: "one-at-a-time",
      branchEntityIds: [
        "fraction-fan-out.target.factor.x",
        "fraction-fan-out.target.factor.6"
      ]
    },
    normalFormIntent: {
      normalFormId: fixture.normalFormPlan.targetForm,
      sourceExpressionId: fixture.normalFormPlan.sourceRootId,
      targetExpressionId: fixture.normalFormPlan.targetRootId
    },
    compressionIntent: {
      level: "key-steps",
      preserve: ["law", "lineage"]
    }
  });
  const providerProvenance = deepFreeze<KpGovernedProviderProvenance>({
    providerId: "openai.codex",
    modelId: "gpt-5",
    responseId: "session.kp.governed-fraction-fan-out.2026-07-23"
  });
  const compilation = compileKpGovernedSemanticAuthoring({
    request: recordedProviderResponse,
    sources: [sourceAuthority],
    provenance: providerProvenance
  });
  if (compilation.status !== "accepted") {
    throw new Error(
      compilation.diagnostics.map(({ path, message }) => `${path}: ${message}`).join("\n")
    );
  }

  return deepFreeze({
    id: "exemplar.governed-authoring.fraction-fan-out.v1" as const,
    kind: "governed-semantic-authoring-exemplar" as const,
    recordedProviderResponse,
    sourceAuthority,
    providerProvenance,
    compilation,
    authorityAudit: {
      providerSelected: [
        "verified semantic references",
        "registered operation and role bindings",
        "semantic correspondence",
        "focus intent",
        "named cadence",
        "registered normal form",
        "evidence-preserving compression"
      ],
      compilerDerived: [
        "source revision resolution",
        "operation pack resolution",
        "canonical composition",
        "laws and witnesses",
        "motif requirements",
        "semantic pacing units",
        "stable fingerprint"
      ],
      explicitlyExcluded: [
        "raw mathematical text",
        "DOM, HTML, SVG, and CSS",
        "geometry and coordinates",
        "timing and keyframes",
        "typography",
        "renderer selection"
      ]
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
