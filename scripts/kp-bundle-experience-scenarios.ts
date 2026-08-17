import {
  defineKpBundleExperienceScenario,
  type KpBundleBuildId,
  type KpBundleExperienceScenario,
  type KpBundleExperienceScenarioId
} from "./bundle-experience-scenario.ts";

export interface KpBundleBuildDeclaration {
  readonly id: KpBundleBuildId;
  readonly outputRoot: string;
  readonly buildCommand: string;
}

const MAIN_BUILD = "bundle-build.main" as const;
const NATIVE_KATEX_FEATURE_PACK_OWNER =
  "src/rendering/native-katex-feature-pack-implementation.ts";

/**
 * Build ownership stays declarative so measurement can select an existing
 * artifact without importing the Vite configs or application implementations.
 */
export const kpBundleBuildDeclarations: readonly KpBundleBuildDeclaration[] =
  Object.freeze([
    build(MAIN_BUILD, "dist", "npm run build:bundle"),
    build(
      "bundle-build.internal-studio",
      "dist/internal-studio",
      "npm run build:internal-studio"
    ),
    build(
      "bundle-build.public-typescript",
      "dist/public-typescript",
      "npm run build:public-typescript"
    ),
    build(
      "bundle-build.public-fraction-composition",
      "dist/public-fraction-composition",
      "npm run build:public-fraction-composition"
    ),
    build(
      "bundle-build.public-normal-matrices",
      "dist/public-normal-matrices",
      "npm run build:public-normal-matrices"
    ),
    build(
      "bundle-build.public-eigenvectors",
      "dist/public-eigenvectors",
      "npm run build:public-eigenvectors"
    )
  ]);

export const kpBundleExperienceScenarios:
  readonly KpBundleExperienceScenario[] = Object.freeze([
    scenario({
      id: "bundle-experience.catalogue.empty",
      title: "Svelte catalogue before a selected capability",
      entryRoots: [
        "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
      ],
      expectedOwners: [
        "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
      ],
      forbiddenOwners: [
        "src/editor/equation-surface-capability.ts",
        "src/editor/place-value-addition-surface-capability.ts",
        "src/rendering/graph-webgl-three.ts",
        NATIVE_KATEX_FEATURE_PACK_OWNER
      ],
      budgets: []
    }),
    selectedCatalogueScenario({
      id: "bundle-experience.catalogue.solve-x",
      title: "Catalogue with solve-x equation selected",
      packRoot: "src/animation/catalog-packs/algebra-linear-solve.ts",
      surfaceRoot: "src/editor/equation-surface-capability.ts",
      forbiddenOwners: [
        "src/editor/programming-surface-capability.ts",
        "src/rendering/graph-webgl-three.ts"
      ]
    }),
    selectedCatalogueScenario({
      id: "bundle-experience.catalogue.economics",
      title: "Catalogue with economics graph selected",
      packRoot: "src/animation/catalog-packs/economics.ts",
      surfaceRoot: "src/editor/economics-graph-svg-surface-capability.ts",
      forbiddenOwners: [
        "src/editor/programming-surface-capability.ts",
        "src/rendering/graph-webgl-three.ts",
        NATIVE_KATEX_FEATURE_PACK_OWNER
      ],
      budgets: [{
        phase: "experience",
        resource: "script",
        gzipBytes: 190_000
      }]
    }),
    selectedCatalogueScenario({
      id: "bundle-experience.catalogue.programming-trace",
      title: "Catalogue with programming trace selected",
      packRoot: "src/animation/catalog-packs/programming.ts",
      surfaceRoot: "src/editor/programming-surface-capability.ts",
      forbiddenOwners: [
        "src/editor/equation-surface-capability.ts",
        "src/rendering/graph-webgl-three.ts",
        NATIVE_KATEX_FEATURE_PACK_OWNER
      ]
    }),
    selectedCatalogueScenario({
      id: "bundle-experience.catalogue.graph-3d",
      title: "Catalogue with Graph3D selected",
      packRoot: "src/animation/catalog-packs/graph.ts",
      surfaceRoot: "src/editor/graph-3d-surface-capability.ts",
      rendererRoot: "src/rendering/graph-webgl-three.ts",
      forbiddenOwners: [
        "src/editor/programming-surface-capability.ts",
        NATIVE_KATEX_FEATURE_PACK_OWNER
      ]
    }),
    selectedCatalogueScenario({
      id: "bundle-experience.catalogue.place-value",
      title: "Catalogue with place-value addition initially selected",
      packRoot: "src/animation/catalog-packs/place-value.ts",
      surfaceRoot: "src/editor/place-value-addition-surface-adapter.ts",
      forbiddenOwners: [
        "src/editor/programming-surface-capability.ts",
        "src/rendering/graph-webgl-three.ts",
        NATIVE_KATEX_FEATURE_PACK_OWNER
      ],
      budgets: [{
        phase: "incremental",
        resource: "total",
        gzipBytes: 75_000
      }],
      comparisonBaseId: "bundle-experience.catalogue.solve-x"
    }),
    selectedCatalogueScenario({
      id: "bundle-experience.catalogue.place-value-motion",
      title: "Catalogue after place-value native motion is requested",
      packRoot: "src/animation/catalog-packs/place-value.ts",
      surfaceRoot: "src/editor/place-value-addition-surface-adapter.ts",
      rendererRoot: NATIVE_KATEX_FEATURE_PACK_OWNER,
      forbiddenOwners: [
        "src/editor/programming-surface-capability.ts",
        "src/rendering/graph-webgl-three.ts"
      ],
      budgets: [{
        phase: "incremental",
        resource: "total",
        gzipBytes: 60_000
      }],
      comparisonBaseId: "bundle-experience.catalogue.place-value"
    }),
    scenario({
      id: "bundle-experience.compatibility.legacy-root",
      title: "Legacy route-selection root",
      // Several compatibility HTML inputs share this emitted chunk, so its
      // content hash is resolved through Vite's stable chunk name.
      entryRoots: ["@name:bootstrap"],
      expectedOwners: ["bootstrap"],
      forbiddenOwners: [
        "src/main.ts",
        "src/compatibility/legacy-concept-room-entry.ts",
        "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
        "src/tutorial/economics-demand-shift/economics-demand-shift-route-entry.ts",
        "src/tutorial/lisp-function-application/lisp-function-application-tutorial-entry.ts",
        "src/tutorial/scheme-factorial/scheme-factorial-tutorial-entry.ts",
        "src/dev-toolbar/development-toolbar-bootstrap.ts"
      ],
      budgets: [{ phase: "entry", resource: "total", gzipBytes: 10_000 }]
    }),
    scenario({
      id: "bundle-experience.studio.internal-host",
      title: "Internal Studio dedicated host",
      buildId: "bundle-build.internal-studio",
      entryRoots: ["studio/index.html"],
      activations: [{
        id: "load-default-editor",
        manifestRoots: ["src/main.ts"]
      }],
      expectedOwners: [
        "studio/index.html",
        "src/main.ts"
      ],
      forbiddenOwners: [
        "src/bootstrap.ts",
        "src/dev-toolbar/development-toolbar-bootstrap.ts",
        "src/dev-review/editor-animation-library-review-bootstrap.ts",
        "src/public-web/typescript-free-shipping-entry.ts",
        "src/public-web/fraction-composition-public-entry.ts",
        "src/public-web/normal-matrix-proof-public-entry.ts",
        "src/public-web/eigenvector-attentional-surface-public-entry.ts"
      ],
      budgets: [{ phase: "entry", resource: "total", gzipBytes: 490_000 }]
    }),
    scenario({
      id: "bundle-experience.studio.dashboard",
      title: "Internal Studio dashboard data then selected renderer",
      buildId: "bundle-build.internal-studio",
      entryRoots: ["studio/index.html"],
      activations: [
        { id: "load-default-editor", manifestRoots: ["src/main.ts"] },
        {
          id: "discover-dashboard-data",
          manifestRoots: ["src/project-dashboard/data.ts"]
        },
        {
          id: "render-selected-dashboard",
          manifestRoots: ["src/project-dashboard/render.ts"]
        }
      ],
      expectedOwners: [
        "studio/index.html",
        "src/main.ts",
        "src/project-dashboard/data.ts",
        "src/project-dashboard/render.ts"
      ],
      forbiddenOwners: [
        "src/bootstrap.ts",
        "src/dev-toolbar/development-toolbar-bootstrap.ts",
        "src/dev-review/workbench-review-bootstrap.ts"
      ],
      budgets: [],
      comparisonBaseId: "bundle-experience.studio.internal-host"
    }),
    publicScenario(
      "bundle-experience.public.typescript-free-shipping",
      "Public TypeScript free-shipping lesson",
      "bundle-build.public-typescript",
      "learn/code/free-shipping/index.html",
      24_000
    ),
    publicScenario(
      "bundle-experience.public.fraction-composition",
      "Public fraction-composition lesson",
      "bundle-build.public-fraction-composition",
      "learn/math/fraction-composition/index.html"
    ),
    publicScenario(
      "bundle-experience.public.normal-matrices",
      "Public normal-matrices proof",
      "bundle-build.public-normal-matrices",
      "learn/math/normal-matrices/index.html",
      undefined,
      [{
        id: "activate-proof-stage",
        manifestRoots: [
          "src/tutorial/normal-matrix-proof/normal-matrix-proof-stage-capability.ts"
        ]
      }]
    ),
    publicScenario(
      "bundle-experience.public.eigenvectors",
      "Public eigenvector concept experience",
      "bundle-build.public-eigenvectors",
      "learn/math/eigenvectors/index.html"
    )
  ]);

export function findKpBundleBuildDeclaration(
  id: KpBundleBuildId
): KpBundleBuildDeclaration {
  const declaration = kpBundleBuildDeclarations.find((entry) => entry.id === id);
  if (declaration === undefined) throw new Error(`Unknown bundle build ${id}.`);
  return declaration;
}

export function findKpBundleExperienceScenario(
  id: KpBundleExperienceScenarioId
): KpBundleExperienceScenario {
  const declaration = kpBundleExperienceScenarios.find((entry) => entry.id === id);
  if (declaration === undefined) throw new Error(`Unknown bundle scenario ${id}.`);
  return declaration;
}

function scenario(input: Omit<
  Parameters<typeof defineKpBundleExperienceScenario>[0],
  "buildId" | "activations" | "comparisonBaseId" | "budgets"
> & {
  readonly buildId?: KpBundleBuildId;
  readonly activations?: KpBundleExperienceScenario["activations"];
  readonly comparisonBaseId?: KpBundleExperienceScenarioId;
  readonly budgets?: KpBundleExperienceScenario["budgets"];
}): KpBundleExperienceScenario {
  return defineKpBundleExperienceScenario({
    ...input,
    buildId: input.buildId ?? MAIN_BUILD,
    activations: input.activations ?? [],
    budgets: input.budgets ?? []
  });
}

function selectedCatalogueScenario(input: {
  readonly id: KpBundleExperienceScenarioId;
  readonly title: string;
  readonly packRoot: string;
  readonly surfaceRoot: string;
  readonly rendererRoot?: string;
  readonly forbiddenOwners: readonly string[];
  readonly budgets?: KpBundleExperienceScenario["budgets"];
  readonly comparisonBaseId?: KpBundleExperienceScenarioId;
}): KpBundleExperienceScenario {
  const activations: { id: string; manifestRoots: readonly string[] }[] = [
    { id: "load-domain-pack", manifestRoots: [input.packRoot] },
    { id: "load-selected-surface", manifestRoots: [input.surfaceRoot] }
  ];
  if (input.rendererRoot !== undefined) {
    activations.push({
      id: "load-selected-renderer",
      manifestRoots: [input.rendererRoot]
    });
  }
  return scenario({
    id: input.id,
    title: input.title,
    entryRoots: [
      "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"
    ],
    activations,
    comparisonBaseId: input.comparisonBaseId ??
      "bundle-experience.catalogue.empty",
    expectedOwners: [
      input.packRoot,
      input.surfaceRoot,
      ...(input.rendererRoot === undefined ? [] : [input.rendererRoot])
    ],
    forbiddenOwners: input.forbiddenOwners,
    ...(input.budgets === undefined ? {} : { budgets: input.budgets })
  });
}

function publicScenario(
  id: KpBundleExperienceScenarioId,
  title: string,
  buildId: KpBundleBuildId,
  entryRoot: string,
  totalBudget?: number,
  activations: KpBundleExperienceScenario["activations"] = []
): KpBundleExperienceScenario {
  return scenario({
    id,
    title,
    buildId,
    entryRoots: [entryRoot],
    activations,
    expectedOwners: [entryRoot],
    forbiddenOwners: [
      "src/bootstrap.ts",
      "src/internal-studio/internal-studio-entry.ts",
      "src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts",
      "src/main.ts",
      "src/dev-toolbar/development-toolbar-bootstrap.ts",
      "src/dev-review/editor-animation-library-review-bootstrap.ts",
      "src/dev-review/reader-review-bootstrap.ts",
      "src/dev-review/tutorial-review-bootstrap.ts",
      "src/dev-review/workbench-review-bootstrap.ts"
    ],
    budgets: totalBudget === undefined
      ? []
      : [{ phase: "entry", resource: "total", gzipBytes: totalBudget }]
  });
}

function build(
  id: KpBundleBuildId,
  outputRoot: string,
  buildCommand: string
): KpBundleBuildDeclaration {
  return Object.freeze({ id, outputRoot, buildCommand });
}
