import {
  fingerprintKpGestaltStyleValue,
  readKpGestaltChannelPath,
  type KpGestaltStyleChannels,
  type KpGestaltStylePackage,
  type KpGestaltStyleRef
} from "./gestalt-style.ts";

export interface KpGestaltStyleOverrideLayer {
  readonly id: string;
  readonly channels: KpGestaltStyleChannels;
}

export interface KpGestaltStyleResolutionInput {
  readonly pinnedStyle: KpGestaltStyleRef;
  readonly catalog: ReadonlyMap<string, KpGestaltStylePackage>;
  readonly trustedPrimitiveDefaults?: KpGestaltStyleChannels | undefined;
  readonly project?: KpGestaltStyleOverrideLayer | undefined;
  readonly animation?: KpGestaltStyleOverrideLayer | undefined;
  readonly motif?: KpGestaltStyleOverrideLayer | undefined;
  readonly viewerSubstitution?: KpGestaltStyleRef | undefined;
  readonly accessibility?: KpGestaltStyleOverrideLayer | undefined;
  readonly motifConstraints?: KpGestaltStyleOverrideLayer | undefined;
}

export interface KpGestaltStyleResolutionDiagnostic {
  readonly code:
    | "style.missing-package"
    | "style.base-cycle"
    | "style.semantic-override"
    | "style.adaptation-bound-exceeded"
    | "style.locked-channel"
    | "style.motif-constraint-applied";
  readonly path: string;
  readonly severity: "info" | "error";
  readonly message: string;
}

export interface KpResolvedGestaltStyle {
  readonly kind: "resolved-gestalt-style";
  readonly pinnedStyle: KpGestaltStyleRef;
  readonly selectedStyle: KpGestaltStyleRef;
  readonly channels: KpGestaltStyleChannels;
  readonly appliedLayerIds: readonly string[];
  readonly diagnostics: readonly KpGestaltStyleResolutionDiagnostic[];
  readonly fingerprint: string;
}

export function resolveKpGestaltStyle(
  input: KpGestaltStyleResolutionInput
): KpResolvedGestaltStyle {
  const diagnostics: KpGestaltStyleResolutionDiagnostic[] = [];
  const selectedStyle = input.viewerSubstitution ?? input.pinnedStyle;
  const chain = resolvePackageChain(selectedStyle, input.catalog, diagnostics);
  const selectedPackage = chain.at(-1);
  let selectedChannels = input.trustedPrimitiveDefaults ?? {};
  chain.forEach((style) => {
    selectedChannels = mergeChannels(selectedChannels, style.channels);
  });
  const layers: Array<
    readonly [string, KpGestaltStyleChannels | undefined]
  > = [
    ["trusted-primitive-defaults", input.trustedPrimitiveDefaults],
    ...chain.map((style) => [`${style.id}@${style.version}`, style.channels] as const),
    [
      input.project?.id ?? "project",
      constrainLayerToAdaptation(
        input.project?.channels,
        selectedPackage,
        selectedChannels,
        input.project?.id ?? "project",
        diagnostics
      )
    ],
    [
      input.animation?.id ?? "animation",
      constrainLayerToAdaptation(
        input.animation?.channels,
        selectedPackage,
        selectedChannels,
        input.animation?.id ?? "animation",
        diagnostics
      )
    ],
    [
      input.motif?.id ?? "motif",
      constrainLayerToAdaptation(
        input.motif?.channels,
        selectedPackage,
        selectedChannels,
        input.motif?.id ?? "motif",
        diagnostics
      )
    ],
    [
      input.viewerSubstitution === undefined
        ? "viewer"
        : `viewer:${selectedStyle.id}@${selectedStyle.version}`,
      undefined
    ],
    [input.accessibility?.id ?? "accessibility", input.accessibility?.channels]
  ];
  const appliedLayerIds: string[] = [];
  let channels: KpGestaltStyleChannels = {};
  layers.forEach(([id, layer]) => {
    if (layer === undefined) return;
    rejectSemanticOverrides(layer, id, diagnostics);
    channels = mergeChannels(channels, layer);
    appliedLayerIds.push(id);
  });
  if (input.motifConstraints !== undefined) {
    rejectSemanticOverrides(
      input.motifConstraints.channels,
      input.motifConstraints.id,
      diagnostics
    );
    const before = fingerprintKpGestaltStyleValue(channels);
    channels = mergeChannels(channels, input.motifConstraints.channels);
    appliedLayerIds.push(input.motifConstraints.id);
    if (before !== fingerprintKpGestaltStyleValue(channels)) {
      diagnostics.push({
        code: "style.motif-constraint-applied",
        path: "motifConstraints",
        severity: "info",
        message:
          `Canonical motif constraints ${input.motifConstraints.id} overrode style preferences.`
      });
    }
  }
  const fingerprint = fingerprintKpGestaltStyleValue({
    pinnedStyle: input.pinnedStyle,
    selectedStyle,
    channels,
    appliedLayerIds
  });
  return {
    kind: "resolved-gestalt-style",
    pinnedStyle: { ...input.pinnedStyle },
    selectedStyle: { ...selectedStyle },
    channels,
    appliedLayerIds,
    diagnostics,
    fingerprint
  };
}

function constrainLayerToAdaptation(
  layer: KpGestaltStyleChannels | undefined,
  style: KpGestaltStylePackage | undefined,
  selectedChannels: KpGestaltStyleChannels,
  layerId: string,
  diagnostics: KpGestaltStyleResolutionDiagnostic[]
): KpGestaltStyleChannels | undefined {
  if (layer === undefined || style === undefined) return layer;
  const constrained = structuredClone(layer);
  style.adaptation.numericBounds.forEach((bound) => {
    const value = readKpGestaltChannelPath(constrained, bound.path);
    if (
      typeof value !== "number" ||
      (value >= bound.minimum && value <= bound.maximum)
    ) {
      return;
    }
    diagnostics.push({
      code: "style.adaptation-bound-exceeded",
      path: `${layerId}.channels.${bound.path}`,
      severity: "error",
      message:
        `Gestalt style layer ${layerId} requested ${bound.path}=${value}, outside ${style.id}@${style.version} bounds ${bound.minimum}–${bound.maximum}.`
    });
    deleteChannelPath(constrained, bound.path);
  });
  style.adaptation.lockedChannelPaths.forEach((path) => {
    const value = readKpGestaltChannelPath(constrained, path);
    const expected = readKpGestaltChannelPath(selectedChannels, path);
    if (value === undefined || value === expected) return;
    diagnostics.push({
      code: "style.locked-channel",
      path: `${layerId}.channels.${path}`,
      severity: "error",
      message:
        `Gestalt style layer ${layerId} cannot change locked ${path} for ${style.id}@${style.version}.`
    });
    deleteChannelPath(constrained, path);
  });
  return constrained;
}

function deleteChannelPath(
  channels: KpGestaltStyleChannels,
  path: string
): void {
  const [group, property] = path.split(".");
  if (group === undefined || property === undefined) return;
  const record = channels as unknown as Record<string, Record<string, unknown> | undefined>;
  const channel = record[group];
  if (channel === undefined) return;
  delete channel[property];
  if (Object.keys(channel).length === 0) delete record[group];
}

function resolvePackageChain(
  ref: KpGestaltStyleRef,
  catalog: ReadonlyMap<string, KpGestaltStylePackage>,
  diagnostics: KpGestaltStyleResolutionDiagnostic[]
): readonly KpGestaltStylePackage[] {
  const chain: KpGestaltStylePackage[] = [];
  const visiting = new Set<string>();
  let current: KpGestaltStyleRef | undefined = ref;
  while (current !== undefined) {
    const key = `${current.id}@${current.version}`;
    if (visiting.has(key)) {
      diagnostics.push({
        code: "style.base-cycle",
        path: "base",
        severity: "error",
        message: `Gestalt style base dependency contains a cycle through ${key}.`
      });
      break;
    }
    visiting.add(key);
    const style = catalog.get(key);
    if (style === undefined) {
      diagnostics.push({
        code: "style.missing-package",
        path: "catalog",
        severity: "error",
        message: `Missing gestalt style package ${key}.`
      });
      break;
    }
    chain.unshift(style);
    current = style.base;
  }
  return chain;
}

function mergeChannels(
  base: KpGestaltStyleChannels,
  override: KpGestaltStyleChannels
): KpGestaltStyleChannels {
  const result = structuredClone(base) as Record<string, unknown>;
  const allowedChannels = new Set([
    "path",
    "propagation",
    "microMotion",
    "deformation",
    "cohesion",
    "acceleration",
    "focus",
    "depth",
    "context",
    "pacing",
    "opacity"
  ]);
  Object.entries(override).forEach(([channel, value]) => {
    if (value === undefined || !allowedChannels.has(channel)) return;
    const prior =
      typeof result[channel] === "object" && result[channel] !== null
        ? result[channel] as Record<string, unknown>
        : {};
    result[channel] = { ...prior, ...structuredClone(value) };
  });
  return result as KpGestaltStyleChannels;
}

function rejectSemanticOverrides(
  value: unknown,
  layerId: string,
  diagnostics: KpGestaltStyleResolutionDiagnostic[],
  path = "channels"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectSemanticOverrides(item, layerId, diagnostics, `${path}[${index}]`)
    );
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    if (
      /^(operation|roles?|identity|lineage|representationalLineage|envelope|dependencies|traversal|compression|correctness|disclosure|endpoints?)$/i.test(
        key
      )
    ) {
      diagnostics.push({
        code: "style.semantic-override",
        path: `${layerId}.${path}.${key}`,
        severity: "error",
        message: `Gestalt style layer ${layerId} cannot override semantic choreography field ${key}.`
      });
    }
    rejectSemanticOverrides(
      child,
      layerId,
      diagnostics,
      `${path}.${key}`
    );
  });
}
