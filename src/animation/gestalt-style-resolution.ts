import {
  fingerprintKpGestaltStyleValue,
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
  const layers: Array<
    readonly [string, KpGestaltStyleChannels | undefined]
  > = [
    ["trusted-primitive-defaults", input.trustedPrimitiveDefaults],
    ...chain.map((style) => [`${style.id}@${style.version}`, style.channels] as const),
    [input.project?.id ?? "project", input.project?.channels],
    [input.animation?.id ?? "animation", input.animation?.channels],
    [input.motif?.id ?? "motif", input.motif?.channels],
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
