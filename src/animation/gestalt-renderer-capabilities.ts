import type { KpGestaltStylePackage } from "./gestalt-style.ts";

export interface KpGestaltRendererFallback {
  readonly capabilityId: string;
  readonly fallbackCapabilityId: string;
  readonly summary: string;
}

export interface KpGestaltRendererDeclaration {
  readonly id: string;
  readonly kind:
    | "equation-dom"
    | "diagram-svg"
    | "css-2_5d"
    | "webgl-fragment";
  readonly supportedCapabilities: readonly string[];
  readonly fallbacks: readonly KpGestaltRendererFallback[];
}

export interface KpGestaltCapabilityGap {
  readonly kind: "gestalt-capability-gap";
  readonly capabilityId: string;
  readonly rendererId: string;
  readonly reason: "missing-required-capability";
  readonly promotable: false;
  readonly message: string;
}

export interface KpGestaltCapabilityDiagnostic {
  readonly code:
    | "style.capability.optional-fallback"
    | "style.capability.optional-omitted";
  readonly capabilityId: string;
  readonly severity: "info" | "warning";
  readonly message: string;
}

export interface KpGestaltRendererCapabilityResolution {
  readonly status: "compatible" | "incompatible";
  readonly rendererId: string;
  readonly realizedCapabilityIds: readonly string[];
  readonly fallbackCapabilityIds: readonly string[];
  readonly gaps: readonly KpGestaltCapabilityGap[];
  readonly diagnostics: readonly KpGestaltCapabilityDiagnostic[];
}

export function resolveKpGestaltRendererCapabilities(input: {
  readonly style: Pick<
    KpGestaltStylePackage,
    "id" | "version" | "requiredCapabilities" | "optionalCapabilities"
  >;
  readonly renderer: KpGestaltRendererDeclaration;
}): KpGestaltRendererCapabilityResolution {
  const supported = new Set(input.renderer.supportedCapabilities);
  const fallbacks = new Map(
    input.renderer.fallbacks.map((fallback) => [
      fallback.capabilityId,
      fallback
    ])
  );
  const realizedCapabilityIds: string[] = [];
  const fallbackCapabilityIds: string[] = [];
  const gaps: KpGestaltCapabilityGap[] = [];
  const diagnostics: KpGestaltCapabilityDiagnostic[] = [];

  input.style.requiredCapabilities.forEach((capabilityId) => {
    if (supported.has(capabilityId)) {
      realizedCapabilityIds.push(capabilityId);
      return;
    }
    gaps.push({
      kind: "gestalt-capability-gap",
      capabilityId,
      rendererId: input.renderer.id,
      reason: "missing-required-capability",
      promotable: false,
      message:
        `Renderer ${input.renderer.id} cannot realize required capability ${capabilityId} for ${input.style.id}@${input.style.version}.`
    });
  });

  input.style.optionalCapabilities.forEach((capabilityId) => {
    if (supported.has(capabilityId)) {
      realizedCapabilityIds.push(capabilityId);
      return;
    }
    const fallback = fallbacks.get(capabilityId);
    if (
      fallback !== undefined &&
      supported.has(fallback.fallbackCapabilityId)
    ) {
      fallbackCapabilityIds.push(fallback.fallbackCapabilityId);
      diagnostics.push({
        code: "style.capability.optional-fallback",
        capabilityId,
        severity: "info",
        message:
          `Renderer ${input.renderer.id} uses ${fallback.fallbackCapabilityId} for optional ${capabilityId}: ${fallback.summary}`
      });
      return;
    }
    diagnostics.push({
      code: "style.capability.optional-omitted",
      capabilityId,
      severity: "warning",
      message:
        `Renderer ${input.renderer.id} omits unsupported optional capability ${capabilityId}.`
    });
  });

  return {
    status: gaps.length === 0 ? "compatible" : "incompatible",
    rendererId: input.renderer.id,
    realizedCapabilityIds: unique(realizedCapabilityIds),
    fallbackCapabilityIds: unique(fallbackCapabilityIds),
    gaps,
    diagnostics
  };
}

export const kpEquationDomGestaltRenderer: KpGestaltRendererDeclaration = {
  id: "renderer.kp.equation-dom",
  kind: "equation-dom",
  supportedCapabilities: [
    "motion.path.direct",
    "motion.path.arc",
    "motion.seek.direct-sampling",
    "focus.flat",
    "opacity.token",
    "fragment.dom"
  ],
  fallbacks: [{
    capabilityId: "focus.depth.css-2_5d",
    fallbackCapabilityId: "focus.flat",
    summary: "Preserve semantic focus without depth or shadow."
  }]
};

export const kpDiagramSvgGestaltRenderer: KpGestaltRendererDeclaration = {
  id: "renderer.kp.diagram-svg",
  kind: "diagram-svg",
  supportedCapabilities: [
    "motion.path.direct",
    "motion.path.arc",
    "motion.seek.direct-sampling",
    "focus.flat",
    "opacity.token",
    "fragment.svg"
  ],
  fallbacks: [{
    capabilityId: "focus.depth.css-2_5d",
    fallbackCapabilityId: "focus.flat",
    summary: "Keep the salient SVG group flat."
  }]
};

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
