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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
