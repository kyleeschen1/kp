export function createKpEquationSeriesLiveModelBatchResponseSchema(input: {
  readonly plannerId: string;
  readonly resultCount: number;
}): Readonly<Record<string, unknown>> {
  if (input.plannerId.trim() === "" || !Number.isSafeInteger(input.resultCount) ||
      input.resultCount < 1) {
    throw new TypeError("Batch schema requires planner identity and result count.");
  }
  const single = {
    type: "object",
    additionalProperties: false,
    required: ["adjacencyId", "kind", "operationId"],
    properties: {
      adjacencyId: { type: "string" },
      kind: { type: "string", const: "single" },
      operationId: { type: "string" }
    }
  };
  const multiple = (kind: "sequence" | "alternatives") => ({
    type: "object",
    additionalProperties: false,
    required: ["adjacencyId", "kind", "operationIds"],
    properties: {
      adjacencyId: { type: "string" },
      kind: { type: "string", const: kind },
      operationIds: {
        type: "array",
        minItems: 2,
        items: { type: "string" }
      }
    }
  });
  const common = {
    schemaVersion: {
      type: "string",
      const: "kp.equation-series-planner-record.v1"
    },
    kind: { type: "string", const: "equation-series-planner-record" },
    requestId: { type: "string" },
    plannerId: { type: "string", const: input.plannerId },
    diagnostics: {
      type: "array",
      maxItems: 0,
      items: { type: "string" }
    }
  };
  const proposed = {
    type: "object",
    additionalProperties: false,
    required: [
      "schemaVersion",
      "kind",
      "requestId",
      "plannerId",
      "status",
      "proposals",
      "diagnostics"
    ],
    properties: {
      ...common,
      status: { type: "string", const: "proposed" },
      proposals: {
        type: "array",
        minItems: 1,
        items: {
          anyOf: [single, multiple("sequence"), multiple("alternatives")]
        }
      }
    }
  };
  const unsupported = {
    type: "object",
    additionalProperties: false,
    required: [
      "schemaVersion",
      "kind",
      "requestId",
      "plannerId",
      "status",
      "reason",
      "unsupportedAdjacencyIds",
      "diagnostics"
    ],
    properties: {
      ...common,
      status: { type: "string", const: "unsupported" },
      reason: { type: "string", minLength: 1 },
      unsupportedAdjacencyIds: {
        type: "array",
        minItems: 1,
        items: { type: "string" }
      }
    }
  };
  return deepFreeze({
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "results"],
    properties: {
      schemaVersion: {
        type: "string",
        const: "kp.equation-series-planner-batch.v1"
      },
      results: {
        type: "array",
        minItems: input.resultCount,
        maxItems: input.resultCount,
        items: { oneOf: [proposed, unsupported] }
      }
    }
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
