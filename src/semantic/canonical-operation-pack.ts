import {
  kpCanonicalOperationCore,
  kpCanonicalOperationCoreVersion
} from "./canonical-operation.ts";

export type KpCanonicalOperationPackScope =
  | "core"
  | "shared-domain"
  | "project";

export interface KpCanonicalOperationPackDependency {
  readonly packId: string;
  readonly version: string;
}

export interface KpCanonicalOperationPack {
  readonly id: string;
  readonly kind: "canonical-operation-pack";
  readonly scope: KpCanonicalOperationPackScope;
  readonly version: string;
  readonly title: string;
  readonly operationIds: readonly string[];
  readonly dependencies: readonly KpCanonicalOperationPackDependency[];
}

export interface KpCanonicalOperationPackPin {
  readonly packId: string;
  readonly version: string;
}

export interface KpCanonicalOperationProjectPins {
  readonly schemaVersion: "kp.canonical-operation-pins.v1";
  readonly packs: readonly KpCanonicalOperationPackPin[];
}

export interface KpCanonicalOperationPackIssue {
  readonly path: string;
  readonly message: string;
}

export const kpCanonicalOperationCorePack: KpCanonicalOperationPack =
  createKpCanonicalOperationPack({
    id: "kp.core",
    scope: "core",
    version: kpCanonicalOperationCoreVersion,
    title: "KP canonical operation core",
    operationIds: kpCanonicalOperationCore.map((operation) => operation.id)
  });

export function createKpCanonicalOperationPack(input: {
  readonly id: string;
  readonly scope: KpCanonicalOperationPackScope;
  readonly version: string;
  readonly title: string;
  readonly operationIds: readonly string[];
  readonly dependencies?: readonly KpCanonicalOperationPackDependency[] | undefined;
}): KpCanonicalOperationPack {
  const pack: KpCanonicalOperationPack = {
    id: input.id,
    kind: "canonical-operation-pack",
    scope: input.scope,
    version: input.version,
    title: input.title,
    operationIds: [...input.operationIds],
    dependencies: (input.dependencies ?? []).map((dependency) => ({ ...dependency }))
  };
  const issues = validateKpCanonicalOperationPack(pack);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  }
  return pack;
}

export function createKpCanonicalOperationProjectPins(
  packs: readonly KpCanonicalOperationPackPin[]
): KpCanonicalOperationProjectPins {
  const pins: KpCanonicalOperationProjectPins = {
    schemaVersion: "kp.canonical-operation-pins.v1",
    packs: packs.map((pack) => ({ ...pack }))
  };
  const issues = validateKpCanonicalOperationProjectPins(pins);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n"));
  }
  return pins;
}

export function validateKpCanonicalOperationPack(
  pack: KpCanonicalOperationPack
): readonly KpCanonicalOperationPackIssue[] {
  const issues: KpCanonicalOperationPackIssue[] = [];
  requireNamespacedId(pack.id, "id", issues);
  requireVersion(pack.version, "version", issues);
  if (pack.title.trim().length === 0) {
    issues.push({ path: "title", message: "Operation pack title must not be empty." });
  }
  if (pack.operationIds.length === 0) {
    issues.push({ path: "operationIds", message: "Operation pack must declare an operation." });
  }
  uniqueValues(pack.operationIds, "operationIds", "operation id", issues);
  pack.operationIds.forEach((operationId, index) => {
    requireNamespacedId(operationId, `operationIds[${index}]`, issues);
  });
  uniqueValues(
    pack.dependencies.map((dependency) => dependency.packId),
    "dependencies",
    "dependency pack id",
    issues
  );
  pack.dependencies.forEach((dependency, index) => {
    requireNamespacedId(dependency.packId, `dependencies[${index}].packId`, issues);
    requireVersion(dependency.version, `dependencies[${index}].version`, issues);
    if (dependency.packId === pack.id) {
      issues.push({
        path: `dependencies[${index}].packId`,
        message: `Operation pack ${pack.id} must not depend on itself.`
      });
    }
  });
  if (pack.scope === "core" && pack.id !== "kp.core") {
    issues.push({ path: "id", message: "The core operation pack id must be kp.core." });
  }
  if (pack.scope === "project" && !pack.id.startsWith("project.")) {
    issues.push({ path: "id", message: "Project operation pack ids must start with project." });
  }
  return issues;
}

export function validateKpCanonicalOperationProjectPins(
  pins: KpCanonicalOperationProjectPins
): readonly KpCanonicalOperationPackIssue[] {
  const issues: KpCanonicalOperationPackIssue[] = [];
  uniqueValues(
    pins.packs.map((pin) => pin.packId),
    "packs",
    "pack pin",
    issues
  );
  pins.packs.forEach((pin, index) => {
    requireNamespacedId(pin.packId, `packs[${index}].packId`, issues);
    requireVersion(pin.version, `packs[${index}].version`, issues);
  });
  return issues;
}

export function kpCanonicalOperationPackMatchesPin(
  pack: KpCanonicalOperationPack,
  pin: KpCanonicalOperationPackPin
): boolean {
  return pack.id === pin.packId && pack.version === pin.version;
}

function requireNamespacedId(
  value: string,
  path: string,
  issues: KpCanonicalOperationPackIssue[]
): void {
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(value)) {
    issues.push({
      path,
      message: `${value || "<empty>"} must be a lowercase namespaced id.`
    });
  }
}

function requireVersion(
  value: string,
  path: string,
  issues: KpCanonicalOperationPackIssue[]
): void {
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/.test(value)) {
    issues.push({ path, message: `${value || "<empty>"} must be an exact semantic version.` });
  }
}

function uniqueValues(
  values: readonly string[],
  path: string,
  label: string,
  issues: KpCanonicalOperationPackIssue[]
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) {
      issues.push({ path: `${path}[${index}]`, message: `Duplicate ${label} ${value}.` });
    }
    seen.add(value);
  });
}

