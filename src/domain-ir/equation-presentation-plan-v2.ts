import {
  isKpCompiledEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationGrammarTransitionV2
} from "./equation-grammar-v2.ts";
import {
  resolveKpEquationGrammarV2Operations,
  type KpResolvedEquationTransitionOperationV2
} from "./equation-grammar-v2-operation-resolution.ts";
import {
  resolveKpEquationEvaluationAuthoritiesV2,
  type KpResolvedEquationEvaluationAuthorityV2
} from "./equation-evaluation-authority-registry-v2.ts";
import {
  resolveKpEquationProjectionChoreographiesV2,
  type KpResolvedEquationProjectionChoreographyV2
} from "./equation-projection-choreography-v2.ts";
import {
  resolveKpEquationTypographyV2,
  type KpResolvedEquationTypographyV2
} from "./equation-typography-policy-v2.ts";
import {
  compileKpEquationTransitObligationsV2,
  type KpEquationTransitionTransitIntentV2,
  type KpEquationTransitionTransitObligationsV2
} from "./equation-transit-obligations-v2.ts";
import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2,
  type KpVerifiedEquationEvaluationFamilyCertificateV2
} from "./equation-evaluation-family-certificate-v2.ts";

export const kpEquationPresentationPlanV2SchemaVersion =
  "kp.equation-presentation-plan.v2" as const;

/**
 * Families extend this with semantic data their own adapter understands.
 * Geometry and timing stay absent so adding a domain never expands a common
 * pose union or moves renderer decisions back into authored plans.
 */
export interface KpEquationPresentationDomainPayloadV2 {
  readonly kind: `equation-domain.${string}`;
  readonly transitionId: string;
  readonly authorityId: string;
}

export interface KpCompiledEquationPresentationTransitionV2<
  Payload extends KpEquationPresentationDomainPayloadV2 =
    KpEquationPresentationDomainPayloadV2
> {
  readonly id: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly semanticOperation: KpResolvedEquationTransitionOperationV2;
  readonly evaluationAuthority?:
    KpResolvedEquationEvaluationAuthorityV2 | undefined;
  readonly evaluationFamilyCertificate?:
    KpVerifiedEquationEvaluationFamilyCertificateV2 | undefined;
  readonly projection: KpResolvedEquationProjectionChoreographyV2;
  readonly typography: KpResolvedEquationTypographyV2;
  readonly transit: KpEquationTransitionTransitObligationsV2;
  readonly teachingIntent: KpEquationGrammarTransitionV2["teachingIntent"];
  readonly domainPayloads: readonly Payload[];
}

declare const kpCompiledEquationPresentationPlanV2Authority: unique symbol;

export type KpCompiledEquationPresentationPlanV2<
  Payload extends KpEquationPresentationDomainPayloadV2 =
    KpEquationPresentationDomainPayloadV2
> = Readonly<{
  readonly schemaVersion: typeof kpEquationPresentationPlanV2SchemaVersion;
  readonly kind: "compiled-equation-presentation-plan-v2";
  readonly id: string;
  readonly grammarId: string;
  readonly assetId: string;
  readonly clockAuthority: "kp.shared-normalized-clock.v1";
  readonly transitions:
    readonly KpCompiledEquationPresentationTransitionV2<Payload>[];
  readonly [kpCompiledEquationPresentationPlanV2Authority]: true;
}>;

export interface KpEquationPresentationPlanDiagnosticV2 {
  readonly code:
    | "presentation-plan.uncompiled-grammar"
    | "presentation-plan.operation"
    | "presentation-plan.evaluation"
    | "presentation-plan.evaluation-family-certificate"
    | "presentation-plan.projection"
    | "presentation-plan.typography"
    | "presentation-plan.transit"
    | "presentation-plan.payload-transition"
    | "presentation-plan.payload-duplicate"
    | "presentation-plan.payload-presentation";
  readonly transitionId?: string | undefined;
  readonly message: string;
}

export type KpEquationPresentationPlanCompilationV2<
  Payload extends KpEquationPresentationDomainPayloadV2
> =
  | {
      readonly status: "compiled";
      readonly plan: KpCompiledEquationPresentationPlanV2<Payload>;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationPresentationPlanDiagnosticV2[];
    };

const compiledPlans = new WeakSet<object>();

export function compileKpEquationPresentationPlanV2<
  Payload extends KpEquationPresentationDomainPayloadV2
>(input: {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly transitIntents?:
    readonly KpEquationTransitionTransitIntentV2[] | undefined;
  readonly domainPayloads?: readonly Payload[] | undefined;
  readonly evaluationFamilyCertificates?:
    readonly KpVerifiedEquationEvaluationFamilyCertificateV2[] | undefined;
}): KpEquationPresentationPlanCompilationV2<Payload> {
  if (!isKpCompiledEquationGrammarV2(input.grammar)) {
    return repair("presentation-plan.uncompiled-grammar",
      "Equation presentation plans require compiler-minted grammar v2.");
  }
  const operations = resolveKpEquationGrammarV2Operations(input.grammar);
  if (operations.status !== "resolved") {
    return repair("presentation-plan.operation",
      operations.diagnostics[0]?.message ?? "Operation resolution failed.");
  }
  const evaluations = resolveKpEquationEvaluationAuthoritiesV2({
    grammar: input.grammar
  });
  if (evaluations.status !== "resolved") {
    return repair("presentation-plan.evaluation",
      evaluations.diagnostics[0]?.message ?? "Evaluation resolution failed.");
  }
  const evaluationFamilyCertificateDiagnostics =
    validateEvaluationFamilyCertificates(
      evaluations.evaluations,
      input.evaluationFamilyCertificates ?? []
    );
  if (evaluationFamilyCertificateDiagnostics.length > 0) {
    return Object.freeze<KpEquationPresentationPlanCompilationV2<Payload>>({
      status: "repair-required" as const,
      diagnostics: Object.freeze(evaluationFamilyCertificateDiagnostics)
    });
  }
  const projections = resolveKpEquationProjectionChoreographiesV2({
    grammar: input.grammar,
    operations: operations.resolution
  });
  if (projections.status !== "resolved") {
    return repair("presentation-plan.projection",
      projections.diagnostics[0]?.message ?? "Projection resolution failed.");
  }
  const typography = resolveKpEquationTypographyV2({ grammar: input.grammar });
  if (typography.status !== "resolved") {
    return repair("presentation-plan.typography",
      typography.diagnostics[0]?.message ?? "Typography resolution failed.");
  }
  const transit = compileKpEquationTransitObligationsV2({
    grammar: input.grammar,
    choreography: projections.choreography,
    intents: input.transitIntents
  });
  if (transit.status !== "compiled") {
    return repair("presentation-plan.transit",
      transit.diagnostics[0]?.message ?? "Transit compilation failed.");
  }

  const diagnostics = validatePayloads(
    input.grammar,
    input.domainPayloads ?? []
  );
  if (diagnostics.length > 0) {
    return Object.freeze<KpEquationPresentationPlanCompilationV2<Payload>>({
      status: "repair-required" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }
  const operationsByTransition = new Map(
    operations.resolution.transitions.map((entry) =>
      [entry.transitionId, entry])
  );
  const evaluationsByTransition = new Map(
    evaluations.evaluations.map((entry) => [entry.transitionId, entry])
  );
  const familyCertificateByTransformation = new Map(
    (input.evaluationFamilyCertificates ?? []).map((certificate) =>
      [certificate.transformationId, certificate])
  );
  const projectionsByTransition = new Map(
    projections.choreography.transitions.map((entry) =>
      [entry.transitionId, entry])
  );
  const typographyByTransition = new Map(
    typography.typography.map((entry) => [entry.transitionId, entry])
  );
  const transitByTransition = new Map(
    transit.obligations.transitions.map((entry) =>
      [entry.transitionId, entry])
  );
  const payloadsByTransition = groupByTransition(input.domainPayloads ?? []);
  const transitions = input.grammar.transitions.map((transition) => {
    const semanticOperation = operationsByTransition.get(transition.id)!;
    const projection = projectionsByTransition.get(transition.id)!;
    const transitObligations = transitByTransition.get(transition.id)!;
    const evaluationAuthority = evaluationsByTransition.get(transition.id);
    if (projection.semanticOperation !== semanticOperation ||
        transitObligations.semanticOperation !== semanticOperation) {
      throw new Error(
        `Presentation transition ${transition.id} lost operation identity.`
      );
    }
    return Object.freeze({
      id: transition.id,
      sourceStateId: transition.sourceStateId,
      targetStateId: transition.targetStateId,
      semanticOperation,
      ...(evaluationAuthority === undefined
        ? {}
        : { evaluationAuthority }),
      ...(familyCertificateByTransformation.get(
        semanticOperation.transformationId
      ) === undefined
        ? {}
        : {
            evaluationFamilyCertificate:
              familyCertificateByTransformation.get(
                semanticOperation.transformationId
              )
          }),
      projection,
      typography: typographyByTransition.get(transition.id)!,
      transit: transitObligations,
      teachingIntent: transition.teachingIntent,
      domainPayloads: Object.freeze([
        ...(payloadsByTransition.get(transition.id) ?? [])
      ])
    });
  });
  const plan = Object.freeze({
    schemaVersion: kpEquationPresentationPlanV2SchemaVersion,
    kind: "compiled-equation-presentation-plan-v2" as const,
    id: `presentation.${input.grammar.id}`,
    grammarId: input.grammar.id,
    assetId: input.grammar.assetId,
    clockAuthority: input.grammar.clock.authority,
    transitions: Object.freeze(transitions)
  }) as unknown as KpCompiledEquationPresentationPlanV2<Payload>;
  compiledPlans.add(plan);
  return Object.freeze<KpEquationPresentationPlanCompilationV2<Payload>>({
    status: "compiled" as const,
    plan,
    diagnostics: Object.freeze([]) as readonly []
  });
}

function validateEvaluationFamilyCertificates(
  evaluations: readonly KpResolvedEquationEvaluationAuthorityV2[],
  certificates:
    readonly KpVerifiedEquationEvaluationFamilyCertificateV2[]
): KpEquationPresentationPlanDiagnosticV2[] {
  const diagnostics: KpEquationPresentationPlanDiagnosticV2[] = [];
  const transformationIds = new Set<string>();
  certificates.forEach((certificate) => {
    if (!isKpVerifiedEquationEvaluationFamilyCertificateV2(certificate)) {
      diagnostics.push({
        code: "presentation-plan.evaluation-family-certificate",
        message:
          "Equation presentation plans require compiler-minted evaluation-family certificates."
      });
      return;
    }
    if (transformationIds.has(certificate.transformationId)) {
      diagnostics.push({
        code: "presentation-plan.evaluation-family-certificate",
        message:
          `Duplicate evaluation-family certificate for ${certificate.transformationId}.`
      });
      return;
    }
    transformationIds.add(certificate.transformationId);
    const authority = evaluations.find((candidate) =>
      candidate.transformationId === certificate.transformationId
    );
    if (
      authority === undefined ||
      authority.authorityId !== certificate.authorityId ||
      authority.operationId !== certificate.operationId ||
      authority.presentationAuthority.kind !==
        "registered-operation-evaluation" ||
      authority.presentationAuthority.familyProfileId !==
        certificate.familyProfile.id
    ) {
      diagnostics.push({
        code: "presentation-plan.evaluation-family-certificate",
        transitionId: authority?.transitionId,
        message:
          `Evaluation-family certificate ${certificate.transformationId} does not match its resolved governance authority.`
      });
    }
  });
  return diagnostics;
}

export function isKpCompiledEquationPresentationPlanV2(
  value: unknown
): value is KpCompiledEquationPresentationPlanV2 {
  return typeof value === "object" && value !== null && compiledPlans.has(value);
}

export type KpEquationPresentationAdapterV2<
  Payload extends KpEquationPresentationDomainPayloadV2,
  Output
> =
  | {
      readonly id: string;
      readonly kind: "generic-equation-adapter-v2";
      readonly compile: (
        transition: KpCompiledEquationPresentationTransitionV2<Payload>
      ) => Output;
    }
  | {
      readonly id: string;
      readonly kind: "specialized-equation-adapter-v2";
      readonly accepts: (
        payload: KpEquationPresentationDomainPayloadV2
      ) => payload is Payload;
      readonly compile: (
        transition: KpCompiledEquationPresentationTransitionV2<Payload>,
        payloads: readonly Payload[]
      ) => Output;
    };

export function consumeKpEquationPresentationPlanV2<
  Payload extends KpEquationPresentationDomainPayloadV2,
  Output
>(input: {
  readonly plan: KpCompiledEquationPresentationPlanV2<Payload>;
  readonly adapter: KpEquationPresentationAdapterV2<Payload, Output>;
}): readonly Output[] {
  if (!compiledPlans.has(input.plan)) {
    throw new Error("Equation adapters require a nominal presentation plan.");
  }
  return Object.freeze<readonly Output[]>(input.plan.transitions.map((transition) => {
    if (input.adapter.kind === "generic-equation-adapter-v2") {
      return input.adapter.compile(transition);
    }
    const accepted = transition.domainPayloads.filter(input.adapter.accepts);
    if (accepted.length !== transition.domainPayloads.length) {
      throw new Error(
        `Specialized adapter ${input.adapter.id} does not accept every payload ` +
        `for ${transition.id}.`
      );
    }
    return input.adapter.compile(transition, accepted);
  }));
}

function validatePayloads<Payload extends KpEquationPresentationDomainPayloadV2>(
  grammar: KpCompiledEquationGrammarV2,
  payloads: readonly Payload[]
): KpEquationPresentationPlanDiagnosticV2[] {
  const diagnostics: KpEquationPresentationPlanDiagnosticV2[] = [];
  const transitionIds = new Set(grammar.transitions.map(({ id }) => id));
  const identities = new Set<string>();
  const forbidden = new Set([
    "arc", "coordinates", "delayMs", "displayMode", "durationMs", "easing",
    "keyframes", "opacity", "path", "progress", "timing", "transform",
    "translate"
  ]);
  payloads.forEach((payload) => {
    if (!transitionIds.has(payload.transitionId)) diagnostics.push({
      code: "presentation-plan.payload-transition",
      transitionId: payload.transitionId,
      message: `Domain payload ${payload.kind} names an unknown transition.`
    });
    const identity = `${payload.transitionId}:${payload.kind}`;
    if (identities.has(identity)) diagnostics.push({
      code: "presentation-plan.payload-duplicate",
      transitionId: payload.transitionId,
      message: `Domain payload ${payload.kind} is duplicated.`
    });
    identities.add(identity);
    visitKeys(payload, (key) => {
      if (forbidden.has(key)) diagnostics.push({
        code: "presentation-plan.payload-presentation",
        transitionId: payload.transitionId,
        message: `Domain payload ${payload.kind} cannot author ${key}.`
      });
    });
  });
  return diagnostics;
}

function groupByTransition<Payload extends KpEquationPresentationDomainPayloadV2>(
  payloads: readonly Payload[]
): ReadonlyMap<string, readonly Payload[]> {
  const grouped = new Map<string, Payload[]>();
  payloads.forEach((payload) => {
    const group = grouped.get(payload.transitionId) ?? [];
    group.push(payload);
    grouped.set(payload.transitionId, group);
  });
  return grouped;
}

function visitKeys(value: unknown, visit: (key: string) => void): void {
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    visit(key);
    visitKeys(child, visit);
  });
}

function repair<Payload extends KpEquationPresentationDomainPayloadV2>(
  code: KpEquationPresentationPlanDiagnosticV2["code"],
  message: string
): KpEquationPresentationPlanCompilationV2<Payload> {
  return Object.freeze<KpEquationPresentationPlanCompilationV2<Payload>>({
    status: "repair-required" as const,
    diagnostics: Object.freeze([{ code, message }])
  });
}
