export type HeadlessKernelBoundaryRole =
  | "registry"
  | "lens"
  | "surface-adapter"
  | "provider-contract"
  | "projection-contract"
  | "protocol"
  | "kernel-facade"
  | "activity-log";

export interface HeadlessKernelBoundaryConformanceEntry {
  readonly id: string;
  readonly title: string;
  readonly role: HeadlessKernelBoundaryRole;
  readonly rendererNeutral: boolean;
  readonly sourceFiles: readonly string[];
  readonly testFiles: readonly string[];
  readonly rationale: string;
}

export function headlessKernelBoundaryConformanceEntries(): readonly HeadlessKernelBoundaryConformanceEntry[] {
  return [
    {
      id: "kp-semantic-object-core",
      title: "KP Semantic Object Core",
      role: "registry",
      rendererNeutral: true,
      sourceFiles: [
        "src/semantic/document.ts",
        "src/semantic/graph.ts",
        "src/semantic/matrix.ts",
        "src/semantic/validation.ts"
      ],
      testFiles: ["tests/semantic.test.ts"],
      rationale:
        "Semantic objects are the renderer-neutral value layer for equations, matrices, graphs, and surfaces; renderers consume references to these immutable values rather than owning meaning."
    },
    {
      id: "kp-notation-transform-protocol",
      title: "KP Notation Transform Protocol",
      role: "protocol",
      rendererNeutral: true,
      sourceFiles: [
        "src/semantic/notation-transform.ts",
        "src/rendering/equation-motion-plan.ts",
        "src/rendering/visual-artifact-lifecycle.ts"
      ],
      testFiles: [
        "tests/notation-transform.test.ts",
        "tests/equation-motion-plan.test.ts"
      ],
      rationale:
        "Notation transforms describe identity-preserving semantic changes and visual artifact roles before any DOM, SVG, or WebGL surface decides how to animate them."
    },
    {
      id: "kp-animation-clock-protocol",
      title: "KP Animation Clock Protocol",
      role: "protocol",
      rendererNeutral: true,
      sourceFiles: [
        "src/animation/kernel.ts",
        "src/rendering/equation-motion-player.ts",
        "src/rendering/equation-motion-sampler.ts",
        "src/rendering/semantic-beat-compiler.ts"
      ],
      testFiles: [
        "tests/equation-motion-player.test.ts",
        "tests/equation-motion-sampler.test.ts"
      ],
      rationale:
        "The shared clock and sampler convert semantic motion plans into reversible progress frames, keeping playback, rewind, sliders, and scroll-linked timelines on one neutral contract."
    },
    {
      id: "kp-graph-projection-contract",
      title: "KP Graph Projection Contract",
      role: "projection-contract",
      rendererNeutral: true,
      sourceFiles: [
        "src/rendering/projection.ts",
        "src/rendering/depth-scene.ts",
        "src/rendering/graph-transitions.ts",
        "src/rendering/graph-space-intersections.ts"
      ],
      testFiles: [
        "tests/projection.test.ts",
        "tests/depth-scene.test.ts",
        "tests/graph-transitions.test.ts",
        "tests/graph-space-intersections.test.ts"
      ],
      rationale:
        "Graph projection, depth segmentation, and surface morph channels stay in pure data space so SVG and WebGL renderers can share the same sampled geometry semantics."
    },
    {
      id: "kp-katex-surface-adapters",
      title: "KP KaTeX Surface Adapters",
      role: "surface-adapter",
      rendererNeutral: false,
      sourceFiles: [
        "src/rendering/katex-adapter.ts",
        "src/rendering/equation-motion-dom.ts",
        "src/rendering/katex-transition-controller.ts",
        "src/rendering/katex-token-snapshot.ts"
      ],
      testFiles: [
        "tests/equation-motion-dom.test.ts",
        "tests/katex-transition-controller.test.ts",
        "tests/katex-token-snapshot.test.ts"
      ],
      rationale:
        "KaTeX adapters are intentionally host-facing: they turn semantic token plans into DOM measurement, snapshots, and overlays while preserving stable motion identifiers."
    },
    {
      id: "kp-webgl-graph-adapter",
      title: "KP WebGL Graph Adapter",
      role: "surface-adapter",
      rendererNeutral: false,
      sourceFiles: [
        "src/rendering/graph-webgl.ts",
        "src/rendering/graph-webgl-three.ts",
        "src/rendering/equation-cancel-particles-webgl.ts"
      ],
      testFiles: [
        "tests/graph-webgl.test.ts",
        "tests/katex-webgl-transition.test.ts"
      ],
      rationale:
        "WebGL adapters own GPU-oriented scene construction and renderer descriptors while the semantic graph and projection contracts remain renderer-neutral inputs."
    }
  ];
}
