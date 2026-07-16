export interface KpGestaltStyleRef {
  readonly id: string;
  readonly version: string;
}

export const kpGestaltNumericChannelPaths = [
  "path.curvature",
  "path.diagonalPreference",
  "path.oppositeCornerPreference",
  "propagation.strength",
  "propagation.staggerStrength",
  "microMotion.amplitude",
  "deformation.tokenCeiling",
  "deformation.fragmentCeiling",
  "cohesion.strength",
  "focus.strength",
  "depth.strength",
  "context.dimming",
  "pacing.tempo",
  "pacing.recognitionDwell",
  "opacity.continuantFloor"
] as const;

export type KpGestaltNumericChannelPath =
  (typeof kpGestaltNumericChannelPaths)[number];

export const kpGestaltCategoricalChannelPaths = [
  "microMotion.function",
  "acceleration.character",
  "focus.profile",
  "depth.enabled"
] as const;

export type KpGestaltCategoricalChannelPath =
  (typeof kpGestaltCategoricalChannelPaths)[number];

export interface KpGestaltStyleAdaptation {
  readonly numericBounds: readonly {
    readonly path: KpGestaltNumericChannelPath;
    readonly minimum: number;
    readonly maximum: number;
  }[];
  readonly lockedChannelPaths: readonly KpGestaltCategoricalChannelPath[];
}

export interface KpGestaltStyleChannels {
  readonly path?: {
    readonly curvature: number;
    readonly diagonalPreference: number;
    readonly oppositeCornerPreference: number;
  } | undefined;
  readonly propagation?: {
    readonly strength: number;
    readonly staggerStrength: number;
  } | undefined;
  readonly microMotion?: {
    readonly function: "none" | "identity-sine" | "correlated-drift";
    readonly amplitude: number;
  } | undefined;
  readonly deformation?: {
    readonly tokenCeiling: number;
    readonly fragmentCeiling: number;
  } | undefined;
  readonly cohesion?: { readonly strength: number } | undefined;
  readonly acceleration?: {
    readonly character: "restrained" | "organic" | "editorial";
  } | undefined;
  readonly focus?: {
    readonly profile: "flat" | "elevated";
    readonly strength: number;
  } | undefined;
  readonly depth?: {
    readonly enabled: boolean;
    readonly strength: number;
  } | undefined;
  readonly context?: { readonly dimming: number } | undefined;
  readonly pacing?: {
    readonly tempo: number;
    readonly recognitionDwell: number;
  } | undefined;
  readonly opacity?: { readonly continuantFloor: number } | undefined;
}

export interface KpGestaltStylePackageInput extends KpGestaltStyleRef {
  readonly title: string;
  readonly base?: KpGestaltStyleRef | undefined;
  readonly channels: KpGestaltStyleChannels;
  readonly adaptation: KpGestaltStyleAdaptation;
  readonly lawIds: readonly string[];
  readonly requiredCapabilities: readonly string[];
  readonly optionalCapabilities: readonly string[];
  readonly trustedPrimitiveIds: readonly string[];
  readonly accessibilityProjectionIds: readonly string[];
  readonly conformance: {
    readonly fixtureIds: readonly string[];
    readonly resultIds: readonly string[];
  };
  readonly provenance: {
    readonly author: string;
    readonly sourceRef: string;
    readonly license: string;
  };
  readonly integrity: string;
}

export interface KpGestaltStylePackage extends KpGestaltStylePackageInput {
  readonly kind: "gestalt-style-package";
  readonly resolvedFingerprint: string;
}

export interface KpGestaltStyleIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpGestaltStylePackage(
  input: KpGestaltStylePackageInput
): KpGestaltStylePackage {
  const issues = validateKpGestaltStylePackage(input);
  if (issues.length > 0) throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  const cloned = structuredClone(input);
  return {
    kind: "gestalt-style-package",
    ...cloned,
    resolvedFingerprint: fingerprintKpGestaltStyleValue(cloned)
  };
}

export function validateKpGestaltStylePackage(
  input: KpGestaltStylePackageInput
): readonly KpGestaltStyleIssue[] {
  const issues: KpGestaltStyleIssue[] = [];
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(input.id)) {
    issue("id", "Gestalt style id must be a lowercase namespaced identifier.", issues);
  }
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(input.version)) {
    issue("version", "Gestalt style version must be an exact semantic version.", issues);
  }
  if (input.base !== undefined) {
    if (input.base.id === input.id && input.base.version === input.version) {
      issue("base", "Gestalt style package cannot depend on itself.", issues);
    }
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(input.base.version)) {
      issue("base.version", "Base style dependency must be exactly pinned.", issues);
    }
  }
  validateChannels(input.channels, issues);
  validateAdaptation(input, issues);
  requireIds(input.lawIds, "lawIds", issues);
  const requiredCapabilities = new Set(input.requiredCapabilities);
  input.optionalCapabilities.forEach((capability, index) => {
    if (requiredCapabilities.has(capability)) {
      issue(
        `optionalCapabilities[${index}]`,
        `Capability ${capability} cannot be both required and optional.`,
        issues
      );
    }
  });
  requireIds(input.trustedPrimitiveIds, "trustedPrimitiveIds", issues);
  requireIds(
    input.accessibilityProjectionIds,
    "accessibilityProjectionIds",
    issues
  );
  requireIds(input.conformance.fixtureIds, "conformance.fixtureIds", issues);
  requireIds(input.conformance.resultIds, "conformance.resultIds", issues);
  requireText(input.provenance.author, "provenance.author", issues);
  requireText(input.provenance.sourceRef, "provenance.sourceRef", issues);
  requireText(input.provenance.license, "provenance.license", issues);
  if (!/^sha256:[a-f0-9]{64}$/.test(input.integrity)) {
    issue("integrity", "Gestalt style integrity must be a lowercase sha256 digest.", issues);
  }
  rejectExecutableStyle(input, issues);
  return issues;
}

export function serializeKpGestaltStylePackage(
  style: KpGestaltStylePackage
): string {
  return stableStringify(style);
}

export function createKpGestaltStyleCatalog(
  styles: readonly KpGestaltStylePackage[]
): ReadonlyMap<string, KpGestaltStylePackage> {
  const catalog = new Map<string, KpGestaltStylePackage>();
  styles.forEach((style) => {
    const key = `${style.id}@${style.version}`;
    const existing = catalog.get(key);
    if (
      existing !== undefined &&
      existing.resolvedFingerprint !== style.resolvedFingerprint
    ) {
      throw new Error(`Published gestalt style ${key} is immutable.`);
    }
    catalog.set(key, structuredClone(style));
  });
  return catalog;
}

function validateAdaptation(
  input: KpGestaltStylePackageInput,
  issues: KpGestaltStyleIssue[]
): void {
  const knownNumericPaths = new Set<string>(kpGestaltNumericChannelPaths);
  const numericPaths = new Set<string>();
  input.adaptation.numericBounds.forEach((bound, index) => {
    const path = `adaptation.numericBounds[${index}]`;
    if (!knownNumericPaths.has(bound.path)) {
      issue(`${path}.path`, `Unknown numeric channel path ${bound.path}.`, issues);
    }
    if (numericPaths.has(bound.path)) {
      issue(`${path}.path`, `Duplicate numeric channel path ${bound.path}.`, issues);
    }
    numericPaths.add(bound.path);
    if (
      !Number.isFinite(bound.minimum) ||
      !Number.isFinite(bound.maximum) ||
      bound.minimum < 0 ||
      bound.maximum > 1 ||
      bound.minimum > bound.maximum
    ) {
      issue(
        path,
        "Adaptation bounds must be ordered normalized values between 0 and 1.",
        issues
      );
    }
    const channelValue = readChannelPath(input.channels, bound.path);
    if (
      typeof channelValue === "number" &&
      (channelValue < bound.minimum || channelValue > bound.maximum)
    ) {
      issue(
        path,
        `Published channel value ${channelValue} falls outside its adaptation bounds.`,
        issues
      );
    }
  });
  const knownLockedPaths = new Set<string>(kpGestaltCategoricalChannelPaths);
  const lockedPaths = new Set<string>();
  input.adaptation.lockedChannelPaths.forEach((path, index) => {
    if (!knownLockedPaths.has(path)) {
      issue(
        `adaptation.lockedChannelPaths[${index}]`,
        `Unknown categorical channel path ${path}.`,
        issues
      );
    }
    if (lockedPaths.has(path)) {
      issue(
        `adaptation.lockedChannelPaths[${index}]`,
        `Duplicate categorical channel path ${path}.`,
        issues
      );
    }
    lockedPaths.add(path);
  });
}

export function readKpGestaltChannelPath(
  channels: KpGestaltStyleChannels,
  path: KpGestaltNumericChannelPath | KpGestaltCategoricalChannelPath
): unknown {
  return readChannelPath(channels, path);
}

function readChannelPath(
  channels: KpGestaltStyleChannels,
  path: string
): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (typeof value !== "object" || value === null) return undefined;
    return (value as Record<string, unknown>)[key];
  }, channels);
}

function validateChannels(
  channels: KpGestaltStyleChannels,
  issues: KpGestaltStyleIssue[]
): void {
  const values: readonly [string, number | undefined][] = [
    ["channels.path.curvature", channels.path?.curvature],
    ["channels.path.diagonalPreference", channels.path?.diagonalPreference],
    ["channels.path.oppositeCornerPreference", channels.path?.oppositeCornerPreference],
    ["channels.propagation.strength", channels.propagation?.strength],
    ["channels.propagation.staggerStrength", channels.propagation?.staggerStrength],
    ["channels.microMotion.amplitude", channels.microMotion?.amplitude],
    ["channels.deformation.tokenCeiling", channels.deformation?.tokenCeiling],
    ["channels.deformation.fragmentCeiling", channels.deformation?.fragmentCeiling],
    ["channels.cohesion.strength", channels.cohesion?.strength],
    ["channels.focus.strength", channels.focus?.strength],
    ["channels.depth.strength", channels.depth?.strength],
    ["channels.context.dimming", channels.context?.dimming],
    ["channels.pacing.tempo", channels.pacing?.tempo],
    ["channels.pacing.recognitionDwell", channels.pacing?.recognitionDwell],
    ["channels.opacity.continuantFloor", channels.opacity?.continuantFloor]
  ];
  values.forEach(([path, value]) => {
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) {
      issue(path, "Gestalt style channel values must be normalized between 0 and 1.", issues);
    }
  });
}

function rejectExecutableStyle(
  value: unknown,
  issues: KpGestaltStyleIssue[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectExecutableStyle(item, issues, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    if (/^(code|script|functionBody|keyframes?|controlPoints?|coordinates?|css|javascript|wasm)$/i.test(key)) {
      issue(`${path}.${key}`, `Executable or raw style field ${key} is not allowed.`, issues);
    }
    rejectExecutableStyle(child, issues, `${path}.${key}`);
  });
}

export function fingerprintKpGestaltStyleValue(value: unknown): string {
  const input = stableStringify(value);
  let hash = 0xcbf29ce484222325n;
  for (const character of input) {
    hash ^= BigInt(character.codePointAt(0)!);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function requireIds(ids: readonly string[], path: string, issues: KpGestaltStyleIssue[]): void {
  if (ids.length === 0) issue(path, "Expected at least one pinned identifier.", issues);
  ids.forEach((id, index) => requireText(id, `${path}[${index}]`, issues));
}

function requireText(value: string, path: string, issues: KpGestaltStyleIssue[]): void {
  if (value.trim().length === 0) issue(path, "Expected non-empty text.", issues);
}

function issue(path: string, message: string, issues: KpGestaltStyleIssue[]): void {
  issues.push({ path, message });
}
