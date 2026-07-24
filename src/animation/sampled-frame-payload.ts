export const kpEquationSampledFramePayloadSchemaVersion =
  "kp.sampled-frame-payload.equation.v1" as const;
export const kpGraphDiagramSampledFramePayloadSchemaVersion =
  "kp.sampled-frame-payload.graph-diagram.v1" as const;
export const kpProgramTraceSampledFramePayloadSchemaVersion =
  "kp.sampled-frame-payload.program-trace.v1" as const;

export type KpEquationSampledFrameObjectRole =
  | "source"
  | "target"
  | "current"
  | "context";

export type KpEquationSampledFrameSelectorRole =
  | "persistent"
  | "introduced"
  | "exiting"
  | "focus"
  | "context";

export interface KpEquationSampledFramePayload {
  readonly domain: "equation";
  readonly schemaVersion: typeof kpEquationSampledFramePayloadSchemaVersion;
  readonly kind: "equation-frame-payload";
  readonly frameId: string;
  readonly assetId: string;
  readonly surface: "katex-dom" | "static-latex" | "custom";
  readonly objects: readonly {
    readonly objectId: string;
    readonly role?: KpEquationSampledFrameObjectRole | undefined;
  }[];
  readonly selectors: readonly {
    readonly selectorId: string;
    readonly objectId: string;
    readonly role?: KpEquationSampledFrameSelectorRole | undefined;
  }[];
  readonly correspondences: readonly {
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
    readonly preserves: readonly string[];
  }[];
}

export interface KpGraphDiagramSampledFramePayload {
  readonly domain: "graph-diagram";
  readonly schemaVersion: typeof kpGraphDiagramSampledFramePayloadSchemaVersion;
  readonly kind: "graph-diagram-frame-payload";
  readonly frameId: string;
  readonly sceneId: string;
  readonly surface: "graph" | "diagram";
  readonly entityIds: readonly string[];
  readonly relationIds: readonly string[];
  readonly groupIds: readonly string[];
  readonly regionIds: readonly string[];
  readonly activeSelectorIds: readonly string[];
  readonly numericSamples: readonly {
    readonly entityId: string;
    readonly components: readonly number[];
  }[];
}

export type KpProgramTraceSampledFrameStepKind =
  | "call"
  | "evaluate"
  | "return"
  | "output";

export interface KpProgramTraceSampledFramePayload {
  readonly domain: "program-trace";
  readonly schemaVersion: typeof kpProgramTraceSampledFramePayloadSchemaVersion;
  readonly kind: "program-trace-frame-payload";
  readonly frameId: string;
  readonly traceId: string;
  readonly sourceFileId: string;
  readonly sharedClockId: string;
  readonly step: {
    readonly index: number;
    readonly id: string;
    readonly kind: KpProgramTraceSampledFrameStepKind;
    readonly summary?: string | undefined;
  };
  readonly activeSelectorIds: readonly string[];
  readonly stack: readonly {
    readonly frameId: string;
    readonly functionName: string;
    readonly sourceFileId: string;
    readonly selectorId?: string | undefined;
  }[];
  readonly locals: readonly {
    readonly name: string;
    readonly value: string;
    readonly type?: string | undefined;
  }[];
  readonly output: readonly string[];
}

export type KpSampledFrameDomainPayload =
  | KpEquationSampledFramePayload
  | KpGraphDiagramSampledFramePayload
  | KpProgramTraceSampledFramePayload;

export interface KpSampledFrameDomainPayloadIssue {
  readonly path: string;
  readonly code:
    | "payload.required"
    | "payload.discriminant"
    | "payload.shape"
    | "payload.reference";
  readonly message: string;
}

export function createKpSampledFrameDomainPayload(
  input: KpSampledFrameDomainPayload
): KpSampledFrameDomainPayload {
  const issues = validateKpSampledFrameDomainPayload(input);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  return clonePayload(input);
}

export function parseKpSampledFrameDomainPayload(
  value: unknown
): KpSampledFrameDomainPayload {
  if (!isKpSampledFrameDomainPayload(value)) {
    const issues = validateKpSampledFrameDomainPayload(value);
    throw new Error(issues.map(({ message }) => message).join(" "));
  }
  return clonePayload(value);
}

export function isKpSampledFrameDomainPayload(
  value: unknown
): value is KpSampledFrameDomainPayload {
  return validateKpSampledFrameDomainPayload(value).length === 0;
}

export function validateKpSampledFrameDomainPayload(
  value: unknown
): readonly KpSampledFrameDomainPayloadIssue[] {
  if (!isRecord(value)) {
    return [issue("$", "payload.required", "Domain frame payload must be an object.")];
  }
  if (value["domain"] === "equation") {
    return Object.freeze(validateEquationPayload(value));
  }
  if (value["domain"] === "graph-diagram") {
    return Object.freeze(validateGraphDiagramPayload(value));
  }
  if (value["domain"] === "program-trace") {
    return Object.freeze(validateProgramTracePayload(value));
  }
  return [issue(
    "$.domain",
    "payload.discriminant",
    "Domain frame payload must declare equation, graph-diagram, or program-trace."
  )];
}

function validateEquationPayload(
  value: Readonly<Record<string, unknown>>
): KpSampledFrameDomainPayloadIssue[] {
  const issues: KpSampledFrameDomainPayloadIssue[] = [];
  exactKeys(value, [
    "domain",
    "schemaVersion",
    "kind",
    "frameId",
    "assetId",
    "surface",
    "objects",
    "selectors",
    "correspondences"
  ], "$", issues);
  literal(value["schemaVersion"], kpEquationSampledFramePayloadSchemaVersion, "$.schemaVersion", issues);
  literal(value["kind"], "equation-frame-payload", "$.kind", issues);
  requiredString(value["frameId"], "$.frameId", issues);
  requiredString(value["assetId"], "$.assetId", issues);
  enumValue(value["surface"], ["katex-dom", "static-latex", "custom"], "$.surface", issues);
  recordArray(value["objects"], "$.objects", issues, (object, path) => {
    exactKeys(object, ["objectId", "role"], path, issues);
    requiredString(object["objectId"], `${path}.objectId`, issues);
    optionalEnum(
      object["role"],
      ["source", "target", "current", "context"],
      `${path}.role`,
      issues
    );
  });
  uniqueRecordStringKey(value["objects"], "objectId", "$.objects", issues);
  recordArray(value["selectors"], "$.selectors", issues, (selector, path) => {
    exactKeys(selector, ["selectorId", "objectId", "role"], path, issues);
    requiredString(selector["selectorId"], `${path}.selectorId`, issues);
    requiredString(selector["objectId"], `${path}.objectId`, issues);
    optionalEnum(
      selector["role"],
      ["persistent", "introduced", "exiting", "focus", "context"],
      `${path}.role`,
      issues
    );
  });
  uniqueRecordStringKey(value["selectors"], "selectorId", "$.selectors", issues);
  recordArray(
    value["correspondences"],
    "$.correspondences",
    issues,
    (correspondence, path) => {
      exactKeys(
        correspondence,
        ["sourceSelectorId", "targetSelectorId", "preserves"],
        path,
        issues
      );
      requiredString(
        correspondence["sourceSelectorId"],
        `${path}.sourceSelectorId`,
        issues
      );
      requiredString(
        correspondence["targetSelectorId"],
        `${path}.targetSelectorId`,
        issues
      );
      uniqueStringArray(correspondence["preserves"], `${path}.preserves`, issues);
    }
  );
  validateEquationReferences(value, issues);
  return issues;
}

function validateGraphDiagramPayload(
  value: Readonly<Record<string, unknown>>
): KpSampledFrameDomainPayloadIssue[] {
  const issues: KpSampledFrameDomainPayloadIssue[] = [];
  exactKeys(value, [
    "domain",
    "schemaVersion",
    "kind",
    "frameId",
    "sceneId",
    "surface",
    "entityIds",
    "relationIds",
    "groupIds",
    "regionIds",
    "activeSelectorIds",
    "numericSamples"
  ], "$", issues);
  literal(
    value["schemaVersion"],
    kpGraphDiagramSampledFramePayloadSchemaVersion,
    "$.schemaVersion",
    issues
  );
  literal(value["kind"], "graph-diagram-frame-payload", "$.kind", issues);
  requiredString(value["frameId"], "$.frameId", issues);
  requiredString(value["sceneId"], "$.sceneId", issues);
  enumValue(value["surface"], ["graph", "diagram"], "$.surface", issues);
  for (const key of [
    "entityIds",
    "relationIds",
    "groupIds",
    "regionIds",
    "activeSelectorIds"
  ] as const) {
    uniqueStringArray(value[key], `$.${key}`, issues);
  }
  recordArray(value["numericSamples"], "$.numericSamples", issues, (sample, path) => {
    exactKeys(sample, ["entityId", "components"], path, issues);
    requiredString(sample["entityId"], `${path}.entityId`, issues);
    finiteNumberArray(sample["components"], `${path}.components`, issues);
  });
  uniqueRecordStringKey(
    value["numericSamples"],
    "entityId",
    "$.numericSamples",
    issues
  );
  validateNumericSampleReferences(value, issues);
  return issues;
}

function validateProgramTracePayload(
  value: Readonly<Record<string, unknown>>
): KpSampledFrameDomainPayloadIssue[] {
  const issues: KpSampledFrameDomainPayloadIssue[] = [];
  exactKeys(value, [
    "domain",
    "schemaVersion",
    "kind",
    "frameId",
    "traceId",
    "sourceFileId",
    "sharedClockId",
    "step",
    "activeSelectorIds",
    "stack",
    "locals",
    "output"
  ], "$", issues);
  literal(
    value["schemaVersion"],
    kpProgramTraceSampledFramePayloadSchemaVersion,
    "$.schemaVersion",
    issues
  );
  literal(value["kind"], "program-trace-frame-payload", "$.kind", issues);
  requiredString(value["frameId"], "$.frameId", issues);
  requiredString(value["traceId"], "$.traceId", issues);
  requiredString(value["sourceFileId"], "$.sourceFileId", issues);
  requiredString(value["sharedClockId"], "$.sharedClockId", issues);
  if (!isRecord(value["step"])) {
    issues.push(issue("$.step", "payload.shape", "Program trace step must be an object."));
  } else {
    const step = value["step"];
    exactKeys(step, ["index", "id", "kind", "summary"], "$.step", issues);
    nonNegativeInteger(step["index"], "$.step.index", issues);
    requiredString(step["id"], "$.step.id", issues);
    enumValue(step["kind"], ["call", "evaluate", "return", "output"], "$.step.kind", issues);
    optionalString(step["summary"], "$.step.summary", issues);
  }
  uniqueStringArray(value["activeSelectorIds"], "$.activeSelectorIds", issues);
  recordArray(value["stack"], "$.stack", issues, (frame, path) => {
    exactKeys(
      frame,
      ["frameId", "functionName", "sourceFileId", "selectorId"],
      path,
      issues
    );
    requiredString(frame["frameId"], `${path}.frameId`, issues);
    requiredString(frame["functionName"], `${path}.functionName`, issues);
    requiredString(frame["sourceFileId"], `${path}.sourceFileId`, issues);
    optionalString(frame["selectorId"], `${path}.selectorId`, issues);
  });
  uniqueRecordStringKey(value["stack"], "frameId", "$.stack", issues);
  recordArray(value["locals"], "$.locals", issues, (local, path) => {
    exactKeys(local, ["name", "value", "type"], path, issues);
    requiredString(local["name"], `${path}.name`, issues);
    requiredString(local["value"], `${path}.value`, issues);
    optionalString(local["type"], `${path}.type`, issues);
  });
  uniqueRecordStringKey(value["locals"], "name", "$.locals", issues);
  stringArray(value["output"], "$.output", issues);
  return issues;
}

function validateEquationReferences(
  value: Readonly<Record<string, unknown>>,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (!Array.isArray(value["objects"]) || !Array.isArray(value["selectors"])) return;
  const objectIds = new Set(
    value["objects"]
      .filter(isRecord)
      .map((object) => object["objectId"])
      .filter((id): id is string => typeof id === "string")
  );
  value["selectors"].forEach((selector, index) => {
    if (
      isRecord(selector) &&
      typeof selector["objectId"] === "string" &&
      !objectIds.has(selector["objectId"])
    ) {
      issues.push(issue(
        `$.selectors[${index}].objectId`,
        "payload.reference",
        `Equation selector references missing object ${selector["objectId"]}.`
      ));
    }
  });
  const selectorIds = new Set(
    value["selectors"]
      .filter(isRecord)
      .map((selector) => selector["selectorId"])
      .filter((id): id is string => typeof id === "string")
  );
  if (!Array.isArray(value["correspondences"])) return;
  value["correspondences"].forEach((correspondence, index) => {
    if (!isRecord(correspondence)) return;
    for (const key of ["sourceSelectorId", "targetSelectorId"] as const) {
      const selectorId = correspondence[key];
      if (typeof selectorId === "string" && !selectorIds.has(selectorId)) {
        issues.push(issue(
          `$.correspondences[${index}].${key}`,
          "payload.reference",
          `Equation correspondence references missing selector ${selectorId}.`
        ));
      }
    }
  });
}

function validateNumericSampleReferences(
  value: Readonly<Record<string, unknown>>,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (!Array.isArray(value["entityIds"]) || !Array.isArray(value["numericSamples"])) return;
  const entityIds = new Set(
    value["entityIds"].filter((id): id is string => typeof id === "string")
  );
  value["numericSamples"].forEach((sample, index) => {
    if (
      isRecord(sample) &&
      typeof sample["entityId"] === "string" &&
      !entityIds.has(sample["entityId"])
    ) {
      issues.push(issue(
        `$.numericSamples[${index}].entityId`,
        "payload.reference",
        `Numeric sample references missing entity ${sample["entityId"]}.`
      ));
    }
  });
}

function clonePayload(
  payload: KpSampledFrameDomainPayload
): KpSampledFrameDomainPayload {
  switch (payload.domain) {
    case "equation":
      return Object.freeze({
        ...payload,
        objects: Object.freeze(payload.objects.map((object) => Object.freeze({ ...object }))),
        selectors: Object.freeze(
          payload.selectors.map((selector) => Object.freeze({ ...selector }))
        ),
        correspondences: Object.freeze(
          payload.correspondences.map((correspondence) =>
            Object.freeze({
              ...correspondence,
              preserves: Object.freeze([...correspondence.preserves])
            })
          )
        )
      });
    case "graph-diagram":
      return Object.freeze({
        ...payload,
        entityIds: Object.freeze([...payload.entityIds]),
        relationIds: Object.freeze([...payload.relationIds]),
        groupIds: Object.freeze([...payload.groupIds]),
        regionIds: Object.freeze([...payload.regionIds]),
        activeSelectorIds: Object.freeze([...payload.activeSelectorIds]),
        numericSamples: Object.freeze(
          payload.numericSamples.map((sample) =>
            Object.freeze({
              ...sample,
              components: Object.freeze([...sample.components])
            })
          )
        )
      });
    case "program-trace":
      return Object.freeze({
        ...payload,
        step: Object.freeze({ ...payload.step }),
        activeSelectorIds: Object.freeze([...payload.activeSelectorIds]),
        stack: Object.freeze(payload.stack.map((frame) => Object.freeze({ ...frame }))),
        locals: Object.freeze(payload.locals.map((local) => Object.freeze({ ...local }))),
        output: Object.freeze([...payload.output])
      });
  }
}

function exactKeys(
  value: Readonly<Record<string, unknown>>,
  allowed: readonly string[],
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issues.push(issue(
        `${path}.${key}`,
        "payload.shape",
        `Domain frame payload does not allow property ${path}.${key}.`
      ));
    }
  }
}

function recordArray(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[],
  validate: (record: Readonly<Record<string, unknown>>, path: string) => void
): void {
  if (!Array.isArray(value)) {
    issues.push(issue(path, "payload.shape", `${path} must be an array.`));
    return;
  }
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(issue(`${path}[${index}]`, "payload.shape", `${path} entries must be objects.`));
      return;
    }
    validate(entry, `${path}[${index}]`);
  });
}

function uniqueStringArray(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  stringArray(value, path, issues);
  if (Array.isArray(value) && new Set(value).size !== value.length) {
    issues.push(issue(path, "payload.shape", `${path} must contain unique values.`));
  }
}

function uniqueRecordStringKey(
  value: unknown,
  key: string,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (!Array.isArray(value)) return;
  const ids = value
    .filter(isRecord)
    .map((entry) => entry[key])
    .filter((id): id is string => typeof id === "string");
  if (new Set(ids).size !== ids.length) {
    issues.push(issue(
      path,
      "payload.shape",
      `${path} must contain unique ${key} values.`
    ));
  }
}

function stringArray(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || entry.length === 0)
  ) {
    issues.push(issue(path, "payload.shape", `${path} must contain non-empty strings.`));
  }
}

function finiteNumberArray(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((entry) => typeof entry !== "number" || !Number.isFinite(entry))
  ) {
    issues.push(issue(path, "payload.shape", `${path} must contain finite numbers.`));
  }
}

function requiredString(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (typeof value !== "string" || value.length === 0) {
    issues.push(issue(path, "payload.shape", `${path} must be a non-empty string.`));
  }
}

function optionalString(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (value !== undefined) requiredString(value, path, issues);
}

function nonNegativeInteger(
  value: unknown,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    issues.push(issue(path, "payload.shape", `${path} must be a non-negative integer.`));
  }
}

function literal(
  value: unknown,
  expected: string,
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (value !== expected) {
    issues.push(issue(
      path,
      "payload.discriminant",
      `${path} must equal ${expected}.`
    ));
  }
}

function enumValue(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push(issue(path, "payload.shape", `${path} must be one of ${allowed.join(", ")}.`));
  }
}

function optionalEnum(
  value: unknown,
  allowed: readonly string[],
  path: string,
  issues: KpSampledFrameDomainPayloadIssue[]
): void {
  if (value !== undefined) enumValue(value, allowed, path, issues);
}

function issue(
  path: string,
  code: KpSampledFrameDomainPayloadIssue["code"],
  message: string
): KpSampledFrameDomainPayloadIssue {
  return { path, code, message };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
