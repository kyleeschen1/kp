import {
  createKpEquationOperationDiscoveryApi,
  type KpEquationOperationCandidate,
  type KpEquationOperationDiscoveryApi
} from "./equation-operation-discovery-api.ts";
import {
  isKpVerifiedCarrierPreservingSimplificationEvidence,
  type KpVerifiedCarrierPreservingSimplificationEvidence
} from "../semantic/carrier-preserving-simplification-evidence.ts";

export interface KpBoundedEquationOperationPlannerPort {
  readonly id: string;
  readonly choose: (
    prompt: KpBoundedEquationOperationPlannerPrompt
  ) => Promise<unknown>;
}

export interface KpBoundedEquationOperationPlannerPrompt {
  readonly schemaVersion: "kp.bounded-equation-operation-planner-prompt.v1";
  readonly kind: "bounded-equation-operation-planner-prompt";
  readonly naturalLanguageIntent: string;
  readonly authorityRule:
    "model-chooses-shortlisted-alias-kp-binds-evidence-and-authority";
  readonly states: readonly Readonly<{ id: string; latex: string }>[];
  readonly adjacencies: readonly Readonly<{
    index: number;
    fromStateId: string;
    toStateId: string;
    candidates: readonly Readonly<{
      operationId: string;
      friendlyName: string;
      aliases: readonly string[];
      meaning: string;
    }>[];
  }>[];
}

export interface KpBoundedEquationOperationEvidenceBinding {
  readonly operationId: string;
  readonly verifiedEvidenceIds: readonly string[];
  readonly carrierEvidence?:
    KpVerifiedCarrierPreservingSimplificationEvidence | undefined;
}

type KpEquationOperationEvidenceValidator = (
  binding: KpBoundedEquationOperationEvidenceBinding
) => boolean;

// Evidence policy is registry data so adding a governed operation does not
// grow a planner switch. Discovery narrows; this registry verifies authority.
const evidenceValidators = new Map<
  string,
  KpEquationOperationEvidenceValidator
>([
  "kp.semantic-motion.absorb-additive-identity",
  "kp.semantic-motion.absorb-multiplicative-identity"
].map((operationId) => [operationId, (binding) =>
  isKpVerifiedCarrierPreservingSimplificationEvidence(
    binding.carrierEvidence
  )
] as const));

export interface KpBoundedEquationOperationSelection {
  readonly adjacencyIndex: number;
  readonly requestedOperation: string;
  readonly operationId: string;
  readonly aliasResolution: "canonical" | "alias";
  readonly evidenceBinding: KpBoundedEquationOperationEvidenceBinding;
}

export interface KpBoundedEquationOperationPlan {
  readonly schemaVersion: "kp.bounded-equation-operation-plan.v1";
  readonly kind: "bounded-equation-operation-plan";
  readonly plannerId: string;
  readonly selections: readonly KpBoundedEquationOperationSelection[];
}

export type KpBoundedEquationOperationPlannerResult =
  | Readonly<{
      readonly status: "accepted";
      readonly plan: KpBoundedEquationOperationPlan;
      readonly lastValidPlan: KpBoundedEquationOperationPlan;
    }>
  | Readonly<{
      readonly status: "clarification-required";
      readonly code:
        | "invalid-states"
        | "no-eligible-operation"
        | "planner-error"
        | "invalid-response"
        | "operation-outside-shortlist"
        | "missing-verified-evidence";
      readonly message: string;
      readonly shortlist: readonly Readonly<{
        adjacencyIndex: number;
        candidates: readonly KpEquationOperationCandidate[];
      }>[];
      readonly lastValidPlan?: KpBoundedEquationOperationPlan | undefined;
    }>;

export async function runKpBoundedEquationOperationPlanner(input: {
  readonly naturalLanguageIntent: string;
  readonly states: readonly Readonly<{ id: string; latex: string }>[];
  readonly port: KpBoundedEquationOperationPlannerPort;
  readonly evidenceBindings:
    readonly KpBoundedEquationOperationEvidenceBinding[];
  readonly lastValidPlan?: KpBoundedEquationOperationPlan | undefined;
  readonly discoveryApi?: KpEquationOperationDiscoveryApi | undefined;
}): Promise<KpBoundedEquationOperationPlannerResult> {
  const api = input.discoveryApi ?? createKpEquationOperationDiscoveryApi();
  const narrowed = api.narrow({ states: input.states });
  if (narrowed.status === "invalid-request") return clarification({
    code: "invalid-states",
    message: narrowed.diagnostics.join(" "),
    shortlist: [],
    lastValidPlan: input.lastValidPlan
  });
  const shortlist = narrowed.adjacencies.map((adjacency) => ({
    adjacencyIndex: adjacency.index,
    candidates: adjacency.candidates
  }));
  if (shortlist.some(({ candidates }) => candidates.length === 0)) {
    return clarification({
      code: "no-eligible-operation",
      message:
        "At least one adjacency has no deterministic eligible operation; clarify the intended transformation.",
      shortlist,
      lastValidPlan: input.lastValidPlan
    });
  }
  const prompt = createPrompt({
    naturalLanguageIntent: input.naturalLanguageIntent,
    states: input.states,
    shortlist,
    api
  });
  let response: unknown;
  try {
    response = await input.port.choose(prompt);
  } catch (error) {
    return clarification({
      code: "planner-error",
      message: `Planner ${input.port.id} failed: ${errorMessage(error)}.`,
      shortlist,
      lastValidPlan: input.lastValidPlan
    });
  }
  const parsed = parseResponse(response, input.port.id, shortlist, api);
  if (parsed.status !== "parsed") return clarification({
    code: parsed.code,
    message: parsed.message,
    shortlist,
    lastValidPlan: input.lastValidPlan
  });
  const bindingsByOperation = new Map(input.evidenceBindings.map((binding) =>
    [binding.operationId, binding] as const
  ));
  const selections: KpBoundedEquationOperationSelection[] = [];
  for (const choice of parsed.choices) {
    const candidate = shortlist[choice.adjacencyIndex]?.candidates.find(
      ({ operationId }) => operationId === choice.operationId
    );
    const capability = api.inspect(choice.operationId);
    const binding = bindingsByOperation.get(choice.operationId);
    if (
      candidate === undefined ||
      capability.status !== "resolved" ||
      binding === undefined ||
      !hasRequiredEvidence(
        capability.capability.requiredEvidenceIds,
        binding.verifiedEvidenceIds
      ) ||
      !(evidenceValidators.get(choice.operationId)?.(binding) ?? true)
    ) return clarification({
      code: "missing-verified-evidence",
      message:
        `Operation ${choice.operationId} lacks KP-verified evidence required ` +
        "to bind this candidate.",
      shortlist,
      lastValidPlan: input.lastValidPlan
    });
    selections.push(Object.freeze({
      adjacencyIndex: choice.adjacencyIndex,
      requestedOperation: choice.requestedOperation,
      operationId: choice.operationId,
      aliasResolution: choice.aliasResolution,
      evidenceBinding: cloneEvidenceBinding(binding)
    }));
  }
  const plan = deepFreeze({
    schemaVersion: "kp.bounded-equation-operation-plan.v1" as const,
    kind: "bounded-equation-operation-plan" as const,
    plannerId: input.port.id,
    selections
  });
  return Object.freeze({
    status: "accepted" as const,
    plan,
    lastValidPlan: plan
  });
}

function createPrompt(input: {
  readonly naturalLanguageIntent: string;
  readonly states: readonly Readonly<{ id: string; latex: string }>[];
  readonly shortlist: readonly Readonly<{
    adjacencyIndex: number;
    candidates: readonly KpEquationOperationCandidate[];
  }>[];
  readonly api: KpEquationOperationDiscoveryApi;
}): KpBoundedEquationOperationPlannerPrompt {
  return deepFreeze({
    schemaVersion: "kp.bounded-equation-operation-planner-prompt.v1" as const,
    kind: "bounded-equation-operation-planner-prompt" as const,
    naturalLanguageIntent: input.naturalLanguageIntent,
    authorityRule:
      "model-chooses-shortlisted-alias-kp-binds-evidence-and-authority" as const,
    states: input.states.map((state) => ({ ...state })),
    adjacencies: input.shortlist.map(({ adjacencyIndex, candidates }) => ({
      index: adjacencyIndex,
      fromStateId: input.states[adjacencyIndex]!.id,
      toStateId: input.states[adjacencyIndex + 1]!.id,
      candidates: candidates.map((candidate) => {
        const inspected = input.api.inspect(candidate.operationId);
        if (inspected.status !== "resolved") {
          throw new Error(`Shortlisted operation ${candidate.operationId} vanished.`);
        }
        return {
          operationId: candidate.operationId,
          friendlyName: inspected.capability.friendlyName,
          aliases: inspected.capability.aliases,
          meaning: inspected.capability.meaning
        };
      })
    }))
  });
}

type ParsedResponse =
  | Readonly<{
      status: "parsed";
      choices: readonly Readonly<{
        adjacencyIndex: number;
        requestedOperation: string;
        operationId: string;
        aliasResolution: "canonical" | "alias";
      }>[];
    }>
  | Readonly<{
      status: "repair";
      code: "invalid-response" | "operation-outside-shortlist";
      message: string;
    }>;

function parseResponse(
  value: unknown,
  plannerId: string,
  shortlist: readonly Readonly<{
    adjacencyIndex: number;
    candidates: readonly KpEquationOperationCandidate[];
  }>[],
  api: KpEquationOperationDiscoveryApi
): ParsedResponse {
  if (!isRecord(value) ||
    !onlyKeys(value, ["schemaVersion", "kind", "plannerId", "choices"]) ||
    value["schemaVersion"] !== "kp.bounded-equation-operation-planner-choice.v1" ||
    value["kind"] !== "bounded-equation-operation-planner-choice" ||
    value["plannerId"] !== plannerId ||
    !Array.isArray(value["choices"]) ||
    value["choices"].length !== shortlist.length
  ) return repair("invalid-response",
    "Planner response must contain exactly one minimal choice per adjacency.");
  const choices = value["choices"].map((choice, index) => {
    if (!isRecord(choice) || !onlyKeys(choice, ["adjacencyIndex", "operation"]) ||
      choice["adjacencyIndex"] !== index ||
      typeof choice["operation"] !== "string"
    ) return undefined;
    const inspected = api.inspect(choice["operation"]);
    if (inspected.status !== "resolved") return undefined;
    return {
      adjacencyIndex: index,
      requestedOperation: choice["operation"],
      operationId: inspected.capability.operationId,
      aliasResolution: inspected.resolution
    } as const;
  });
  if (choices.some((choice) => choice === undefined)) return repair(
    "invalid-response",
    "Every planner choice must use a known canonical ID or friendly alias."
  );
  const typed = choices as readonly NonNullable<(typeof choices)[number]>[];
  const outside = typed.find((choice) =>
    !shortlist[choice.adjacencyIndex]?.candidates.some(
      ({ operationId }) => operationId === choice.operationId
    )
  );
  if (outside !== undefined) return repair(
    "operation-outside-shortlist",
    `Operation ${outside.operationId} is not eligible for adjacency ` +
    `${outside.adjacencyIndex}.`
  );
  return deepFreeze({ status: "parsed" as const, choices: typed });
}

function hasRequiredEvidence(
  required: readonly string[],
  provided: readonly string[]
): boolean {
  const available = new Set(provided);
  return required.every((evidenceId) => available.has(evidenceId));
}

function cloneEvidenceBinding(
  binding: KpBoundedEquationOperationEvidenceBinding
): KpBoundedEquationOperationEvidenceBinding {
  return Object.freeze({
    operationId: binding.operationId,
    verifiedEvidenceIds: Object.freeze([...binding.verifiedEvidenceIds]),
    carrierEvidence: binding.carrierEvidence
  });
}

function clarification(input: Omit<Extract<
  KpBoundedEquationOperationPlannerResult,
  { readonly status: "clarification-required" }
>, "status">): KpBoundedEquationOperationPlannerResult {
  return deepFreeze({ status: "clarification-required" as const, ...input });
}

function repair(
  code: "invalid-response" | "operation-outside-shortlist",
  message: string
): ParsedResponse {
  return Object.freeze({ status: "repair" as const, code, message });
}

function onlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowed: readonly string[]
): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length &&
    keys.every((key) => allowed.includes(key));
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
