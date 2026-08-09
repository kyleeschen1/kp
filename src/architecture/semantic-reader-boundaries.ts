export type KpSemanticReaderLayerId =
  | "document"
  | "compiler"
  | "runtime"
  | "renderers"
  | "app";

export interface KpSemanticReaderLayer {
  readonly id: KpSemanticReaderLayerId;
  readonly root: string;
  readonly publicEntryPoint: string;
  readonly additionalPublicEntryPoints?: readonly string[];
  readonly mayImport: readonly KpSemanticReaderLayerId[];
}

// The reader is a one-way enhancement pipeline: authored documents compile to
// static output, while the browser runtime and leaf renderers only hydrate it.
export const kpSemanticReaderLayers = [
  {
    id: "document",
    root: "src/reader/document",
    publicEntryPoint: "src/reader/document/public-api.ts",
    mayImport: []
  },
  {
    id: "compiler",
    root: "src/reader/compiler",
    publicEntryPoint: "src/reader/compiler/public-api.ts",
    mayImport: ["document"]
  },
  {
    id: "runtime",
    root: "src/reader/runtime",
    publicEntryPoint: "src/reader/runtime/public-api.ts",
    additionalPublicEntryPoints: [
      "src/reader/runtime/learner-public-api.ts"
    ],
    mayImport: ["document"]
  },
  {
    id: "renderers",
    root: "src/reader/renderers",
    publicEntryPoint: "src/reader/renderers/public-api.ts",
    additionalPublicEntryPoints: [
      "src/reader/renderers/learner-public-api.ts"
    ],
    mayImport: ["document", "runtime"]
  },
  {
    id: "app",
    root: "src/reader/app",
    publicEntryPoint: "src/reader/app/public-api.ts",
    mayImport: ["document", "runtime", "renderers"]
  }
] as const satisfies readonly KpSemanticReaderLayer[];

export const kpSemanticReaderExemplarContract = {
  id: "semantic-document-reader.x-plus-3.v0",
  canonicalReferences: [
    "src/animation/linear-solve-adapter.ts",
    "src/animation/runtime-sampler.ts",
    "src/app-adapters/linear-equation-story-scroll-coordinator.ts",
    "src/rendering/equation-material-layer-dom.ts",
    "docs/project/reviews/2026-07-20-semantic-reader-current-baseline.md"
  ],
  preservationBoundary: [
    "Keep the canonical semantic asset, transformation identity, URL/provenance/provider contracts, and existing editor behavior intact.",
    "Keep the legacy repository read-only and adapt behavior through new current-repository contracts.",
    "Keep FTC, economics, programming, graph, diagram, provider, and WebGL breadth outside the exemplar."
  ],
  promotionCriteria: [
    "The static route is searchable, printable, and meaningful without JavaScript.",
    "Scroll supplies deterministic, reversible local progress rather than triggering a fixed-duration seek.",
    "The learner route imports neither editor modules nor Three.js.",
    "A human accepts the visual exemplar before any contract is generalized."
  ],
  rollbackUnit:
    "Remove the isolated src/reader path and route integration while leaving the current semantic asset, editor player, and concept route behavior intact."
} as const;
