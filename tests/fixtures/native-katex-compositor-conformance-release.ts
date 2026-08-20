export type KpNativeKatexConformanceLifecycleAction =
  | "direct-seek"
  | "reverse"
  | "interruption"
  | "font-invalidation"
  | "viewport-resize"
  | "dpr-change"
  | "theme-change"
  | "reduced-motion";

export interface KpNativeKatexConformanceLifecycleScenario {
  readonly id: `release.${string}`;
  readonly action: KpNativeKatexConformanceLifecycleAction;
  readonly animationId: string;
  readonly initialPlayhead: number;
  readonly theme: "dark" | "light";
}

const twoCarrierAnimationId =
  "animation.operation-evaluation.two-times-one-carrier";
const addZeroAnimationId = "animation.generated.add-zero";

const lifecycleScenarios = Object.freeze([
  {
    id: "release.direct-seek",
    action: "direct-seek",
    animationId: twoCarrierAnimationId,
    initialPlayhead: 0.42,
    theme: "dark"
  },
  {
    id: "release.reverse",
    action: "reverse",
    animationId: addZeroAnimationId,
    initialPlayhead: 0.35,
    theme: "dark"
  },
  {
    id: "release.interruption",
    action: "interruption",
    animationId: twoCarrierAnimationId,
    initialPlayhead: 0.05,
    theme: "dark"
  },
  {
    id: "release.font-invalidation",
    action: "font-invalidation",
    animationId: addZeroAnimationId,
    initialPlayhead: 0.41,
    theme: "dark"
  },
  {
    id: "release.viewport-resize",
    action: "viewport-resize",
    animationId: twoCarrierAnimationId,
    initialPlayhead: 0.36,
    theme: "dark"
  },
  {
    id: "release.dpr-change",
    action: "dpr-change",
    animationId: addZeroAnimationId,
    initialPlayhead: 0.59,
    theme: "dark"
  },
  {
    id: "release.theme-change",
    action: "theme-change",
    animationId: twoCarrierAnimationId,
    initialPlayhead: 0.57,
    theme: "dark"
  },
  {
    id: "release.reduced-motion",
    action: "reduced-motion",
    animationId: addZeroAnimationId,
    initialPlayhead: 0.2,
    theme: "light"
  }
] as const satisfies readonly KpNativeKatexConformanceLifecycleScenario[]);

export const kpNativeKatexConformanceReleaseProfile = Object.freeze({
  kind: "native-katex-conformance-release-profile" as const,
  engines: Object.freeze(["chromium", "firefox", "webkit"] as const),
  baselineTraceScenarios: 2,
  lifecycleScenarios,
  scenariosPerEngine: 2 + lifecycleScenarios.length,
  pagesPerEngine: 1,
  workers: 1,
  routineScreenshots: 0,
  reusePage: true,
  failureDiagnostics: "structured-data" as const
});
