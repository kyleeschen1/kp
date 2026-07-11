import type {
  SemanticObjectCapabilityId,
  SemanticObjectDefinitionStatus
} from "./object-registry.ts";
import { formatKpCapabilityKey } from "./capability-key.ts";

export type KpCapabilityPackageTarget =
  | "authoring"
  | "browser"
  | "media"
  | "runtime"
  | "static";

export type KpCapabilityPackageLoadPhase =
  | "authoring"
  | "export"
  | "initial-render"
  | "interaction"
  | "preload";

export interface KpCapabilityPackageSourceRef {
  readonly label: string;
  readonly href: string;
}

export interface KpCapabilityPackageManifestInput {
  readonly id: string;
  readonly title: string;
  readonly library: string;
  readonly capability: string;
  readonly objectType: string;
  readonly mode: string;
  readonly status: SemanticObjectDefinitionStatus;
  readonly target: KpCapabilityPackageTarget;
  readonly loadPhase: KpCapabilityPackageLoadPhase;
  readonly summary: string;
  readonly semanticCapabilities: readonly SemanticObjectCapabilityId[];
  readonly protocols: readonly string[];
  readonly views: readonly string[];
  readonly tags: readonly string[];
  readonly sourceRefs: readonly KpCapabilityPackageSourceRef[];
}

export interface KpCapabilityPackageManifest
  extends KpCapabilityPackageManifestInput {
  readonly capabilityKey: string;
}

export interface KpCapabilityPackageCatalog {
  listManifests(): readonly KpCapabilityPackageManifest[];
  getManifest(id: string): KpCapabilityPackageManifest | undefined;
  listManifestsByCapabilityKey(
    capabilityKey: string
  ): readonly KpCapabilityPackageManifest[];
  listManifestsForObjectType(
    objectType: string
  ): readonly KpCapabilityPackageManifest[];
}

const equationCapabilityPackageTheseusSourceRef = {
  label: "Theseus Equation capability package fixtures",
  href: "docs/theseus/nodes/next-actions/next-action.kp.semantic.next-kp-equation-capability-package-fixtures-v0.json"
} satisfies KpCapabilityPackageSourceRef;

const graphCapabilityPackageTheseusSourceRef = {
  label: "Theseus Graph capability package fixtures",
  href: "docs/theseus/nodes/next-actions/next-action.kp.semantic.next-kp-graph-capability-package-fixtures-v0.json"
} satisfies KpCapabilityPackageSourceRef;

const sourceFileCapabilityPackageTheseusSourceRef = {
  label: "Theseus SourceFile capability package fixtures",
  href: "docs/theseus/nodes/next-actions/next-action.kp.semantic.next-kp-programming-capability-package-fixtures-v0.json"
} satisfies KpCapabilityPackageSourceRef;

const matrixCapabilityPackageTheseusSourceRef = {
  label: "Theseus Matrix capability package fixture",
  href: "docs/theseus/nodes/next-actions/next-action.kp.semantic.next-kp-matrix-capability-package-fixtures-v0.json"
} satisfies KpCapabilityPackageSourceRef;

const capabilityPackageManifestTheseusSourceRef = {
  label: "Theseus capability package manifest",
  href: "docs/theseus/nodes/next-actions/next-action.kp.semantic.next-kp-capability-package-manifest-v0.json"
} satisfies KpCapabilityPackageSourceRef;

export function createKpCapabilityPackageManifest(
  input: KpCapabilityPackageManifestInput
): KpCapabilityPackageManifest {
  return {
    id: input.id,
    title: input.title,
    library: input.library,
    capability: input.capability,
    objectType: input.objectType,
    mode: input.mode,
    capabilityKey: formatKpCapabilityKey(input),
    status: input.status,
    target: input.target,
    loadPhase: input.loadPhase,
    summary: input.summary,
    semanticCapabilities: [...input.semanticCapabilities],
    protocols: [...input.protocols],
    views: [...input.views],
    tags: [...input.tags],
    sourceRefs: input.sourceRefs.map((sourceRef) => ({ ...sourceRef }))
  };
}

export function createKpCapabilityPackageCatalog(
  manifests: readonly KpCapabilityPackageManifestInput[]
): KpCapabilityPackageCatalog {
  const orderedManifests = manifests.map(createKpCapabilityPackageManifest);
  const manifestsById = new Map<string, KpCapabilityPackageManifest>();

  for (const manifest of orderedManifests) {
    if (manifestsById.has(manifest.id)) {
      throw new Error(`Duplicate capability package manifest ${manifest.id}.`);
    }

    manifestsById.set(manifest.id, manifest);
  }

  return {
    listManifests: () => cloneManifests(orderedManifests),
    getManifest: (id) => cloneManifest(manifestsById.get(id)),
    listManifestsByCapabilityKey: (capabilityKey) =>
      cloneManifests(
        orderedManifests.filter(
          (manifest) => manifest.capabilityKey === capabilityKey
        )
      ),
    listManifestsForObjectType: (objectType) =>
      cloneManifests(
        orderedManifests.filter(
          (manifest) => manifest.objectType === objectType
        )
      )
  };
}

export const defaultKpCapabilityPackageManifests:
  readonly KpCapabilityPackageManifestInput[] = [
    {
      id: "package.kp.equation.render.katex",
      title: "KaTeX Equation Renderer",
      library: "kp.equation",
      capability: "render.katex",
      objectType: "equation",
      mode: "*",
      status: "active",
      target: "browser",
      loadPhase: "initial-render",
      summary: "Render equation semantic objects through the KaTeX pipeline.",
      semanticCapabilities: ["render", "select"],
      protocols: ["renderEquationKatex"],
      views: ["katex"],
      tags: ["equation", "katex"],
      sourceRefs: [
        {
          label: "Equation motion sampler",
          href: "src/rendering/equation-motion-sampler.ts"
        },
        equationCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.equation.transform.semantic",
      title: "Semantic Equation Transformer",
      library: "kp.equation",
      capability: "transform.semantic",
      objectType: "equation",
      mode: "*",
      status: "active",
      target: "runtime",
      loadPhase: "interaction",
      summary:
        "Apply semantic equation transformations with stable correspondence metadata.",
      semanticCapabilities: ["transform", "select"],
      protocols: ["applyEquationTransformation", "createEquationMotionPlan"],
      views: ["transformation-plan"],
      tags: ["equation", "transform", "semantic-motion"],
      sourceRefs: [
        {
          label: "Equation transform semantics",
          href: "src/math/equation-transform.ts"
        },
        {
          label: "Equation motion plan",
          href: "src/rendering/equation-motion-plan.ts"
        },
        equationCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.equation.animate.motion-plan",
      title: "Equation Motion Plan Animator",
      library: "kp.equation",
      capability: "animate.motion-plan",
      objectType: "equation",
      mode: "*",
      status: "active",
      target: "browser",
      loadPhase: "interaction",
      summary:
        "Sample equation motion plans into reversible, scrub-ready animation frames.",
      semanticCapabilities: ["animate", "select"],
      protocols: ["createEquationMotionPlan", "sampleEquationMotionPlan"],
      views: ["motion-plan", "sampled-frame"],
      tags: ["equation", "animation", "timeline"],
      sourceRefs: [
        {
          label: "Equation motion plan",
          href: "src/rendering/equation-motion-plan.ts"
        },
        {
          label: "Equation motion sampler",
          href: "src/rendering/equation-motion-sampler.ts"
        },
        {
          label: "Equation animation catalog",
          href: "src/editor/equation-animation-catalog.ts"
        },
        equationCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.graph3d.render.webgl.surface-mesh",
      title: "WebGL Graph3D Surface Mesh Renderer",
      library: "kp.graph",
      capability: "render.webgl",
      objectType: "graph-3d",
      mode: "surface.mesh",
      status: "active",
      target: "browser",
      loadPhase: "interaction",
      summary: "Render Graph3D surface meshes through the WebGL graph adapter.",
      semanticCapabilities: ["render", "select", "animate"],
      protocols: ["renderGraphWebglSurfaceMesh"],
      views: ["webgl-surface"],
      tags: ["graph", "webgl", "surface"],
      sourceRefs: [
        {
          label: "Graph frame adapter",
          href: "src/tutorial/graph-frame-adapter.ts"
        },
        graphCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.graph2d.render.svg",
      title: "SVG Graph2D Renderer",
      library: "kp.graph",
      capability: "render.svg",
      objectType: "graph-2d",
      mode: "*",
      status: "planned",
      target: "browser",
      loadPhase: "initial-render",
      summary:
        "Render Graph2D scenes through the SVG graph renderer and scene model.",
      semanticCapabilities: ["render", "select"],
      protocols: ["renderGraph2dSvg"],
      views: ["svg-graph"],
      tags: ["graph", "svg", "2d"],
      sourceRefs: [
        {
          label: "Graph2D scene",
          href: "src/rendering/graph-2d-scene.ts"
        },
        {
          label: "Graph SVG renderer",
          href: "src/rendering/graph-svg.ts"
        },
        graphCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.graph2d.derive.latex",
      title: "Graph2D Exact LaTeX Deriver",
      library: "kp.graph",
      capability: "derive.latex",
      objectType: "graph-2d",
      mode: "*",
      status: "planned",
      target: "runtime",
      loadPhase: "interaction",
      summary:
        "Derive exact LaTeX forms from Graph2D symbolic provenance when available.",
      semanticCapabilities: ["derive"],
      protocols: ["deriveGraph2dExactLatex"],
      views: ["latex-form"],
      tags: ["graph", "latex", "provenance"],
      sourceRefs: [
        {
          label: "Equation graph derivation",
          href: "src/semantic/equation-graph.ts"
        },
        {
          label: "Semantic object registry",
          href: "src/semantic/object-registry.ts"
        },
        graphCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.graph3d.animate.surface-mode",
      title: "Graph3D Surface Mode Animator",
      library: "kp.graph",
      capability: "animate.surface-mode",
      objectType: "graph-3d",
      mode: "surface.mode",
      status: "active",
      target: "browser",
      loadPhase: "interaction",
      summary:
        "Animate Graph3D surface-mode changes through the shared motion-plan clock.",
      semanticCapabilities: ["animate", "select"],
      protocols: ["createGraphSurfaceModeMotionPlan"],
      views: ["surface-mode-motion"],
      tags: ["graph", "webgl", "surface", "timeline"],
      sourceRefs: [
        {
          label: "Graph transitions",
          href: "src/rendering/graph-transitions.ts"
        },
        {
          label: "Animation kernel",
          href: "src/animation/kernel.ts"
        },
        graphCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.source-file.render.code-panel",
      title: "SourceFile Code Panel Renderer",
      library: "kp.source-file",
      capability: "render.code-panel",
      objectType: "source-file",
      mode: "*",
      status: "active",
      target: "browser",
      loadPhase: "initial-render",
      summary:
        "Render SourceFile objects as synchronized programming tutorial code panels.",
      semanticCapabilities: ["render", "select"],
      protocols: [
        "createKpTutorialProgrammingPanelContract",
        "renderKpTutorialSourceFilePanelHtml"
      ],
      views: ["code-panel", "source-lines"],
      tags: ["source-file", "programming", "code-panel"],
      sourceRefs: [
        {
          label: "Programming panel contract",
          href: "src/tutorial/programming-panel.ts"
        },
        {
          label: "Tutorial card HTML shell",
          href: "src/tutorial/card-html-shell.ts"
        },
        sourceFileCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.source-file.select.range",
      title: "SourceFile Range Selector",
      library: "kp.source-file",
      capability: "select.range",
      objectType: "source-file",
      mode: "*",
      status: "active",
      target: "runtime",
      loadPhase: "interaction",
      summary:
        "Create and resolve stable one-based source-range selectors for SourceFile objects.",
      semanticCapabilities: ["select"],
      protocols: ["createSourceRangeSelector", "resolveSourceRangeSelector"],
      views: ["source-range"],
      tags: ["source-file", "programming", "selector"],
      sourceRefs: [
        {
          label: "SourceFile semantic object",
          href: "src/semantic/source-file.ts"
        },
        sourceFileCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.source-file.animate.execution-trace",
      title: "SourceFile Execution Trace Animator",
      library: "kp.source-file",
      capability: "animate.execution-trace",
      objectType: "source-file",
      mode: "trace",
      status: "active",
      target: "browser",
      loadPhase: "interaction",
      summary:
        "Synchronize SourceFile frames with execution-trace steps on the shared tutorial clock.",
      semanticCapabilities: ["animate", "select", "execute"],
      protocols: [
        "createKpTutorialSourceFileFrameAdapter",
        "createKpProgrammingExecutionTrace",
        "createKpProgrammingExecutionTraceFrame"
      ],
      views: ["source-frame", "execution-trace"],
      tags: ["source-file", "programming", "trace", "timeline"],
      sourceRefs: [
        {
          label: "SourceFile frame adapter",
          href: "src/tutorial/source-file-frame-adapter.ts"
        },
        {
          label: "Programming execution trace",
          href: "src/tutorial/programming-execution-trace.ts"
        },
        {
          label: "Programming execution trace panel",
          href: "src/tutorial/programming-execution-trace-panel.ts"
        },
        sourceFileCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.matrix.render.katex",
      title: "KaTeX Matrix Renderer",
      library: "kp.matrix",
      capability: "render.katex",
      objectType: "matrix",
      mode: "*",
      status: "active",
      target: "browser",
      loadPhase: "initial-render",
      summary: "Render matrix semantic objects as KaTeX or LaTeX forms.",
      semanticCapabilities: ["render", "select"],
      protocols: ["renderMatrixKatex"],
      views: ["katex", "matrix-grid"],
      tags: ["matrix", "katex", "linear-algebra"],
      sourceRefs: [
        {
          label: "Semantic object registry",
          href: "src/semantic/object-registry.ts"
        },
        matrixCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.matrix.execute.facts",
      title: "Matrix Facts Executor",
      library: "kp.matrix",
      capability: "execute.facts",
      objectType: "matrix",
      mode: "*",
      status: "active",
      target: "runtime",
      loadPhase: "interaction",
      summary: "Compute matrix facts such as shape and determinant metadata.",
      semanticCapabilities: ["execute"],
      protocols: ["matrixForm", "evaluate"],
      views: ["inspector"],
      tags: ["matrix", "execute", "linear-algebra"],
      sourceRefs: [
        {
          label: "Semantic computation protocols",
          href: "src/semantic/computation-protocols.ts"
        },
        matrixCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.matrix.derive.linear-map",
      title: "Matrix Linear Map Deriver",
      library: "kp.matrix",
      capability: "derive.linear-map",
      objectType: "matrix",
      mode: "*",
      status: "planned",
      target: "runtime",
      loadPhase: "interaction",
      summary:
        "Derive linear-map metadata from matrix objects with explicit basis provenance.",
      semanticCapabilities: ["derive"],
      protocols: ["deriveMatrixLinearMap"],
      views: ["linear-map"],
      tags: ["matrix", "derive", "linear-algebra"],
      sourceRefs: [
        {
          label: "Semantic object registry",
          href: "src/semantic/object-registry.ts"
        },
        {
          label: "Semantic computation protocols",
          href: "src/semantic/computation-protocols.ts"
        },
        matrixCapabilityPackageTheseusSourceRef
      ]
    },
    {
      id: "package.kp.export.encode.gif",
      title: "GIF Encoder Export Package",
      library: "kp.export",
      capability: "encode.gif",
      objectType: "*",
      mode: "*",
      status: "planned",
      target: "media",
      loadPhase: "export",
      summary: "Advertise GIF export encoding for frame-sequence artifacts.",
      semanticCapabilities: ["link"],
      protocols: ["encodeGifFromFrameSequence"],
      views: ["media-export"],
      tags: ["export", "gif", "frame-sequence"],
      sourceRefs: [
        {
          label: "Frame sequence artifact",
          href: "src/tutorial/frame-sequence-artifact.ts"
        },
        capabilityPackageManifestTheseusSourceRef
      ]
    }
  ];

function cloneManifest(
  manifest: KpCapabilityPackageManifest | undefined
): KpCapabilityPackageManifest | undefined {
  return manifest === undefined
    ? undefined
    : createKpCapabilityPackageManifest(manifest);
}

function cloneManifests(
  manifests: readonly KpCapabilityPackageManifest[]
): readonly KpCapabilityPackageManifest[] {
  return manifests.map((manifest) => createKpCapabilityPackageManifest(manifest));
}
