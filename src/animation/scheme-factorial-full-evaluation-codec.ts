import type {
  KpSchemeFactorialFullEvaluation
} from "./scheme-factorial-full-evaluation.ts";

/**
 * Keeps repeated material provenance out of learner payloads. The compiler
 * remains the authority; this codec only preserves its validated output.
 */
export function packKpSchemeFactorialFullEvaluation(
  evaluation: KpSchemeFactorialFullEvaluation
): object {
  const materials = new Map(evaluation.states.flatMap(({ tokens }) =>
    tokens.map((token) => [token.id, token] as const)));
  const materialList = [...materials.values()];
  const indexes = new Map(materialList.map((material, index) => [material.id, index]));
  return {
    packed: "kp.scheme-factorial-full-evaluation.pack.v1",
    schemaVersion: evaluation.schemaVersion,
    id: evaluation.id,
    materials: materialList.map(({ id, lexeme, provenance }) =>
      [id, lexeme, provenance]),
    states: evaluation.states.map(({ id, kind, nativeCode, tokens }) =>
      [id, kind, nativeCode, tokens.map(({ id: materialId, span }) =>
        [indexes.get(materialId), span.start, span.end])]),
    actions: evaluation.actions,
    transitions: evaluation.transitions,
    sourceStateId: evaluation.sourceStateId,
    targetStateId: evaluation.targetStateId,
    accessibleDescription: evaluation.accessibleDescription
  };
}

export function unpackKpSchemeFactorialFullEvaluation(
  value: Record<string, unknown>
): KpSchemeFactorialFullEvaluation {
  if (value["packed"] !== "kp.scheme-factorial-full-evaluation.pack.v1" ||
      !Array.isArray(value["materials"]) || !Array.isArray(value["states"]) ||
      !Array.isArray(value["actions"]) || !Array.isArray(value["transitions"])) {
    return value as unknown as KpSchemeFactorialFullEvaluation;
  }
  const materials = value["materials"].map((entry) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" ||
        typeof entry[1] !== "string" || !isRecord(entry[2])) {
      throw new Error("Packed factorial material is invalid.");
    }
    return { id: entry[0], lexeme: entry[1], provenance: entry[2] };
  });
  const states = value["states"].map((entry) => {
    if (!Array.isArray(entry) || typeof entry[0] !== "string" ||
        typeof entry[1] !== "string" || typeof entry[2] !== "string" ||
        !Array.isArray(entry[3])) {
      throw new Error("Packed factorial state is invalid.");
    }
    return {
      id: entry[0],
      kind: entry[1],
      nativeCode: entry[2],
      tokens: entry[3].map((placement) => {
        if (!Array.isArray(placement) || typeof placement[0] !== "number" ||
            typeof placement[1] !== "number" || typeof placement[2] !== "number") {
          throw new Error("Packed factorial placement is invalid.");
        }
        const material = materials[placement[0]];
        if (material === undefined) throw new Error("Packed material is missing.");
        return { ...material, span: { start: placement[1], end: placement[2] } };
      })
    };
  });
  return {
    schemaVersion: value["schemaVersion"],
    id: value["id"],
    states,
    actions: value["actions"],
    transitions: value["transitions"],
    sourceStateId: value["sourceStateId"],
    targetStateId: value["targetStateId"],
    accessibleDescription: value["accessibleDescription"]
  } as unknown as KpSchemeFactorialFullEvaluation;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
