import type { ProjectDashboardData } from "./model.ts";

export const projectDashboardDataContract = {
  sourceFile: "src/project-dashboard/data.ts",
  designDocHref:
    "docs/superpowers/specs/2026-07-08-project-dashboard-v1-design.md",
  completionRule:
    "When Codex completes a phase, update the matching work card or child card, refresh blockers and report evidence, run dashboard verification, then commit the data change with the phase.",
  notes: [
    "Browser edits are not persisted in V1.",
    "Priority, status, blocker, report-card, and gallery changes are made in the typed source file.",
    "Persistent browser editing is deferred until the dashboard records move to structured docs or JSON with validation.",
    "Authoring metadata should point rows back to source refs and verification commands so Codex can update project state from the same agenda surface."
  ]
} as const;

export const projectDashboardData: ProjectDashboardData = {
  cards: [
    {
      id: "work-rendering-time-protocol",
      title: "Rendering/time protocol",
      category: "ts-api",
      status: "active",
      priority: "critical",
      summary:
        "Define the shared clock, playhead, sampler, selector, and render-index contract across equations, graphs, simulations, and code.",
      tags: ["protocol", "timeline", "rendering", "identity"],
      sourceRefs: [
        { label: "Animation kernel", href: "src/animation/kernel.ts" },
        {
          label: "Equation sampler",
          href: "src/rendering/equation-motion-sampler.ts"
        },
        {
          label: "Graph transitions",
          href: "src/rendering/graph-transitions.ts"
        }
      ],
      verification: [
        "npm run typecheck",
        "npm test -- tests/equation-motion-sampler.test.ts tests/graph-transitions.test.ts"
      ],
      relatedIds: [
        "gallery-rendering-time-api",
        "animation-cancelation",
        "visual-webgl-graph"
      ]
    },
    {
      id: "work-equation-cancelation",
      title: "Equation cancelation animation",
      category: "animation",
      status: "active",
      priority: "high",
      summary:
        "Treat cancelation as a semantic transformation where related tokens overlap, dissolve, and then leave the remaining equation to shift.",
      tags: ["equation", "katex", "cancelation", "semantic-motion"],
      relatedIds: ["animation-cancelation", "semantic-equation"]
    },
    {
      id: "work-equation-final-simplify",
      title: "Equation final simplify crossfade",
      category: "animation",
      status: "active",
      priority: "high",
      summary:
        "Resolve the 7 - 3 to 4 simplification with a slight shrink and fade instead of a heavy liquid WebGL effect.",
      tags: ["equation", "simplification", "katex"],
      relatedIds: ["animation-final-crossfade", "semantic-equation"]
    },
    {
      id: "work-graph-surface-morphs",
      title: "Graph surface morphs",
      category: "visual",
      status: "active",
      priority: "high",
      summary:
        "Expose graph surface-mode morphs through the same playhead and sampler vocabulary as equation transitions.",
      tags: ["graph", "webgl", "surface", "timeline"],
      sourceRefs: [
        {
          label: "Graph transition clock",
          href: "src/rendering/graph-transitions.ts"
        },
        { label: "WebGL shell", href: "src/rendering/graph-webgl.ts" }
      ],
      verification: [
        "npm test -- tests/graph-transitions.test.ts tests/graph-webgl.test.ts",
        "npm run typecheck"
      ],
      relatedIds: ["visual-webgl-graph", "gallery-rendering-time-api"]
    },
    {
      id: "work-semantic-object-registry",
      title: "Semantic object registry",
      category: "semantic-object",
      status: "active",
      priority: "critical",
      summary:
        "Move toward namespaced object records with render, select, transform, execute, compare, diagnose, and link capabilities.",
      tags: ["objects", "selectors", "capabilities", "registry"],
      sourceRefs: [
        {
          label: "Semantic computation protocols",
          href: "src/semantic/computation-protocols.ts"
        },
        { label: "Expression object", href: "src/semantic/expression-object.ts" }
      ],
      verification: [
        "npm test -- tests/math-expression.test.ts tests/semantic.test.ts",
        "npm run typecheck"
      ],
      relatedIds: ["semantic-matrix", "semantic-equation", "semantic-vector"]
    },
    {
      id: "work-project-dashboard-v1",
      title: "Project dashboard v1",
      category: "todo",
      status: "done",
      priority: "critical",
      summary:
        "Build the prototype dashboard that tracks work, blockers, report-card themes, and object galleries from one shared data set.",
      tags: ["dashboard", "operations", "codex", "planning"],
      children: [
        {
          id: "work-project-dashboard-v1-phase-1",
          title: "Phase 1 prototype shell",
          category: "todo",
          status: "done",
          priority: "critical",
          summary:
            "Add typed seed data and a button-accessible dashboard shell while keeping the current editor as the default page.",
          tags: ["dashboard", "phase-1"],
          relatedIds: ["report-dashboard-operations"]
        },
        {
          id: "work-project-dashboard-v1-phase-2",
          title: "Phase 2 work cards",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Render grouped work cards with status lanes, priorities, blockers, children, and related links.",
          tags: ["dashboard", "phase-2", "codex-update"],
          relatedIds: ["report-dashboard-operations"]
        },
        {
          id: "work-project-dashboard-v1-phase-3",
          title: "Phase 3 object galleries",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Add searchable animation, visual, semantic object, and protocol API galleries.",
          tags: ["dashboard", "phase-3", "codex-update"],
          relatedIds: ["report-dashboard-operations"]
        },
        {
          id: "work-project-dashboard-v1-phase-4",
          title: "Phase 4 report cards",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Add report-card themes with evidence, risks, review metadata, and recommended next actions.",
          tags: ["dashboard", "phase-4", "codex-update"],
          relatedIds: ["report-dashboard-operations"]
        },
        {
          id: "work-project-dashboard-v1-phase-5",
          title: "Phase 5 write protocol",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Document and expose the source-backed write protocol for keeping dashboard cards current.",
          tags: ["dashboard", "phase-5", "codex-update"],
          relatedIds: ["report-dashboard-operations"]
        },
        {
          id: "work-project-dashboard-v1-phase-6",
          title: "Phase 6 browser verification",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Add browser coverage for the dashboard round trip, editor rehydration, equation scrubbing, and graph control updates.",
          tags: ["dashboard", "phase-6", "browser-verification", "codex-update"],
          relatedIds: ["report-dashboard-operations"]
        },
        {
          id: "work-project-dashboard-v1-phase-7",
          title: "Phase 7 authoring catalog",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Promote agenda rows into an authoring catalog with source refs, verification hooks, coverage, maturity, blockers, and searchable generated catalogue rows.",
          tags: ["dashboard", "phase-7", "authoring-catalog"],
          sourceRefs: [
            { label: "Dashboard model", href: "src/project-dashboard/model.ts" },
            { label: "Dashboard renderer", href: "src/project-dashboard/render.ts" },
            { label: "Dashboard data", href: "src/project-dashboard/data.ts" }
          ],
          verification: [
            "npm test -- tests/project-dashboard.test.ts tests/api-catalog.test.ts tests/project-dashboard-theseus-adapter.test.ts",
            "npm run test:browser:dashboard"
          ],
          relatedIds: ["report-dashboard-operations", "gallery-rendering-time-api"]
        },
        {
          id: "work-project-dashboard-v1-phase-8",
          title: "Phase 8 live sample actions",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Wire selected dashboard preview links to live fixture-backed samples so catalogue rows can open their current KaTeX sample surface.",
          tags: ["dashboard", "phase-8", "live-samples", "codex-update"],
          sourceRefs: [
            { label: "Dashboard renderer", href: "src/project-dashboard/render.ts" },
            { label: "Dashboard controller", href: "src/main.ts" },
            { label: "Dashboard browser spec", href: "tests/project-dashboard.browser.spec.ts" }
          ],
          verification: [
            "npm test -- tests/project-dashboard.test.ts",
            "npm run test:browser:dashboard"
          ],
          relatedIds: ["report-dashboard-operations", "gallery-rendering-time-api"]
        },
        {
          id: "work-project-dashboard-v1-phase-9",
          title: "Phase 9 sample target metadata",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Add typed sample targets so gallery rows can advertise and launch their current live visual or object sample.",
          tags: ["dashboard", "phase-9", "sample-targets", "codex-update"],
          sourceRefs: [
            { label: "Dashboard model", href: "src/project-dashboard/model.ts" },
            { label: "Dashboard renderer", href: "src/project-dashboard/render.ts" },
            { label: "Dashboard adapter", href: "src/project-dashboard/theseus-adapter.ts" },
            { label: "Dashboard controller", href: "src/main.ts" }
          ],
          verification: [
            "npm test -- tests/project-dashboard.test.ts tests/project-dashboard-theseus-adapter.test.ts",
            "npm run test:browser:dashboard"
          ],
          relatedIds: ["report-dashboard-operations", "visual-webgl-graph"]
        },
        {
          id: "work-project-dashboard-v1-phase-10",
          title: "Phase 10 API sample targets",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Wire semantic object dashboard rows to editor API outline sample cards through typed sample targets.",
          tags: ["dashboard", "phase-10", "api-samples", "codex-update"],
          sourceRefs: [
            { label: "Dashboard controller", href: "src/main.ts" },
            { label: "Dashboard data", href: "src/project-dashboard/data.ts" },
            { label: "Dashboard renderer", href: "src/project-dashboard/render.ts" },
            {
              label: "Dashboard browser spec",
              href: "tests/project-dashboard.browser.spec.ts"
            }
          ],
          verification: [
            "npm test -- tests/project-dashboard.test.ts tests/project-dashboard-theseus-adapter.test.ts",
            "npm run test:browser:dashboard"
          ],
          relatedIds: ["report-dashboard-operations", "semantic-matrix"]
        },
        {
          id: "work-project-dashboard-v1-phase-11",
          title: "Phase 11 API sample target coverage",
          category: "todo",
          status: "done",
          priority: "high",
          summary:
            "Broaden semantic object dashboard sample links so Equation and Vector rows open their matching API outline samples.",
          tags: ["dashboard", "phase-11", "api-samples", "codex-update"],
          sourceRefs: [
            { label: "Dashboard data", href: "src/project-dashboard/data.ts" },
            { label: "Dashboard test", href: "tests/project-dashboard.test.ts" }
          ],
          verification: [
            "npm test -- tests/project-dashboard.test.ts",
            "npm run theseus -- validate"
          ],
          relatedIds: [
            "report-dashboard-operations",
            "semantic-equation",
            "semantic-vector"
          ]
        }
      ],
      relatedIds: ["report-dashboard-operations"]
    }
  ],
  gallery: [
    {
      id: "animation-cancelation",
      title: "Equation cancelation",
      kind: "animation",
      status: "active",
      summary:
        "A semantic animation type where inverse terms collapse out of an equation before the remaining tokens settle.",
      tags: ["equation", "cancelation", "particles"],
      domains: ["math", "katex"],
      interfaces: ["sample(progress)", "semantic token lifecycle"],
      maturity: "active reusable motif",
      coverage: [
        "semantic lifecycle",
        "visual motif phases",
        "rewindable sampler"
      ],
      sourceRefs: [
        {
          label: "Equation motion plan",
          href: "src/rendering/equation-motion-plan.ts"
        },
        { label: "Visual motif module", href: "src/rendering/visual-motif.ts" }
      ],
      verification: [
        "tests/equation-motion-plan.test.ts",
        "tests/equation-motion-sampler.test.ts"
      ],
      relatedIds: ["work-equation-cancelation"]
    },
    {
      id: "animation-final-crossfade",
      title: "Final simplify crossfade",
      kind: "animation",
      status: "active",
      summary:
        "A compact simplification style where source expression tokens slightly shrink and fade into the evaluated result.",
      tags: ["equation", "simplification", "crossfade"],
      domains: ["math", "katex"],
      interfaces: ["sample(progress)", "simplify-into relation"],
      relatedIds: ["work-equation-final-simplify"]
    },
    {
      id: "sample-synced-equation-graph-linear-solve",
      title: "Synchronized equation graph sample",
      kind: "animation",
      status: "planned",
      summary:
        "A dashboard launch target for scrubbing an equation animation and graph view from the same semantic clock.",
      tags: ["sync", "equation", "graph", "shared-clock"],
      domains: ["math", "graphs", "runtime"],
      interfaces: [
        "shared playhead",
        "equation animation sample",
        "graph state sample"
      ],
      maturity: "sample target metadata",
      coverage: [
        "equation animation id",
        "graph id",
        "shared semantic clock id"
      ],
      sourceRefs: [
        { label: "Animation kernel", href: "src/animation/kernel.ts" },
        {
          label: "Equation animation catalog",
          href: "src/editor/equation-animation-catalog.ts"
        },
        {
          label: "Graph transition sampler",
          href: "src/rendering/graph-transitions.ts"
        },
        {
          label: "Dashboard sample target",
          href: "src/project-dashboard/data.ts"
        }
      ],
      verification: [
        "tests/project-dashboard.test.ts",
        "tests/project-dashboard-theseus-adapter.test.ts"
      ],
      sampleTargets: [
        {
          kind: "synchronized-equation-graph",
          label: "Open synchronized solve sample",
          animationId: "linear-equation-solve-x",
          graphId: "saddle-orbit-graph",
          sharedClockId: "solve-x-shared-clock",
          surfaceMode: "mesh"
        }
      ],
      relatedIds: [
        "work-rendering-time-protocol",
        "visual-webgl-graph",
        "semantic-equation"
      ]
    },
    {
      id: "transform-subtract-both-sides",
      title: "subtractBothSides",
      kind: "semantic-transform",
      status: "active",
      summary:
        "SemanticTransformation that introduces an inverse term on each side while preserving equation balance and selector provenance.",
      tags: ["equation", "algebra", "correspondence"],
      domains: ["math", "katex"],
      interfaces: ["SemanticTransformation", "CorrespondenceMap", "subtractBothSides(term)"],
      relatedIds: [
        "work-rendering-time-protocol",
        "work-equation-cancelation",
        "semantic-equation"
      ]
    },
    {
      id: "transform-cancel-additive-inverse",
      title: "cancelAdditiveInverse",
      kind: "semantic-transform",
      status: "active",
      summary:
        "SemanticTransformation that identifies additive inverse selectors and hands them to the cancelation visual motif.",
      tags: ["equation", "cancelation", "correspondence"],
      domains: ["math", "katex"],
      interfaces: ["SemanticTransformation", "CorrespondenceMap", "cancelled-by relation"],
      relatedIds: [
        "work-equation-cancelation",
        "animation-cancelation",
        "semantic-equation"
      ]
    },
    {
      id: "transform-evaluate-constant-expression",
      title: "evaluateConstantExpression",
      kind: "semantic-transform",
      status: "active",
      summary:
        "SemanticTransformation that evaluates a constant expression group into a simplified target object with explicit provenance.",
      tags: ["equation", "simplification", "execute"],
      domains: ["math", "katex"],
      interfaces: ["SemanticTransformation", "CorrespondenceMap", "simplify-into relation"],
      relatedIds: [
        "work-equation-final-simplify",
        "animation-final-crossfade",
        "semantic-equation"
      ]
    },
    {
      id: "transform-matrix-multiply",
      title: "matrixMultiply",
      kind: "semantic-transform",
      status: "planned",
      summary:
        "SemanticTransformation that composes row-column dot products into a matrix product with nested step provenance.",
      tags: ["matrix", "dot product", "composition"],
      domains: ["math", "linear algebra"],
      interfaces: ["SemanticTransformation", "Matrix.execute", "dot-product substeps"],
      relatedIds: ["work-semantic-object-registry", "semantic-matrix"]
    },
    {
      id: "transform-compute-jacobian",
      title: "computeJacobian",
      kind: "semantic-transform",
      status: "planned",
      summary:
        "SemanticTransformation that derives a vector-valued function's local linear map and links it to matrix and graph views.",
      tags: ["calculus", "linearization", "matrix"],
      domains: ["math", "calculus"],
      interfaces: ["SemanticTransformation", "Function.derive", "matrix view"],
      relatedIds: ["work-semantic-object-registry", "semantic-matrix"]
    },
    {
      id: "transform-compute-hessian",
      title: "computeHessian",
      kind: "semantic-transform",
      status: "planned",
      summary:
        "SemanticTransformation that derives a second-derivative matrix and curvature evidence from a scalar function.",
      tags: ["calculus", "curvature", "matrix"],
      domains: ["math", "calculus"],
      interfaces: ["SemanticTransformation", "Function.derive", "curvature view"],
      relatedIds: ["work-semantic-object-registry", "semantic-matrix"]
    },
    {
      id: "transform-rename-variable",
      title: "renameVariable",
      kind: "semantic-transform",
      status: "planned",
      summary:
        "SemanticTransformation that preserves binding and reference identity while labels change across programming views.",
      tags: ["programming", "refactor", "identity"],
      domains: ["programming", "typescript", "rust"],
      interfaces: ["SemanticTransformation", "SourceFile.select", "binding correspondence"],
      relatedIds: ["work-semantic-object-registry", "visual-code"]
    },
    {
      id: "notation-inline-to-stacked-fraction",
      title: "inlineFractionToStackedFraction",
      kind: "notation-transform",
      status: "planned",
      summary:
        "NotationTransform that keeps an expression's semantic identity while changing inline slash notation into stacked fraction layout.",
      tags: ["fraction", "katex", "artifact"],
      domains: ["math", "katex"],
      interfaces: ["NotationTransform", "renderArtifactRoles", "fraction-bar"],
      relatedIds: ["semantic-equation", "visual-webgl-graph"]
    },
    {
      id: "notation-radical-to-exponent",
      title: "radicalToExponent",
      kind: "notation-transform",
      status: "planned",
      summary:
        "NotationTransform that switches between radical notation and exponent notation while preserving the represented value.",
      tags: ["radical", "script", "katex"],
      domains: ["math", "katex"],
      interfaces: ["NotationTransform", "renderArtifactRoles", "radical-line"],
      relatedIds: ["semantic-equation"]
    },
    {
      id: "notation-implicit-to-explicit-multiply",
      title: "implicitToExplicitMultiplication",
      kind: "notation-transform",
      status: "planned",
      summary:
        "NotationTransform that adds or removes an explicit multiplication operator while preserving product identity.",
      tags: ["multiplication", "operator", "katex"],
      domains: ["math", "katex"],
      interfaces: ["NotationTransform", "renderArtifactRoles", "explicit-operator"],
      relatedIds: ["semantic-equation"]
    },
    {
      id: "visual-webgl-graph",
      title: "WebGL graph",
      kind: "visual",
      status: "active",
      summary:
        "Interactive graph rendering with retained 3D scene data, surface modes, lighting, and future timeline-controlled morphs.",
      tags: ["graph", "webgl", "surface"],
      domains: ["graphs", "calculus"],
      interfaces: ["camera controls", "surface mode", "render shell"],
      maturity: "active renderer",
      coverage: [
        "mesh surface mode",
        "donut surface mode",
        "hyperplane surface mode",
        "shared clock sampler"
      ],
      sourceRefs: [
        { label: "WebGL graph shell", href: "src/rendering/graph-webgl.ts" },
        {
          label: "Graph transition sampler",
          href: "src/rendering/graph-transitions.ts"
        },
        { label: "Graph semantic objects", href: "src/semantic/graph.ts" }
      ],
      verification: [
        "tests/graph-webgl.test.ts",
        "tests/graph-transitions.test.ts",
        "tests/project-dashboard.browser.spec.ts"
      ],
      sampleTargets: [
        {
          kind: "graph-surface-mode",
          label: "Open mesh graph sample",
          graphId: "saddle-orbit-graph",
          surfaceMode: "mesh"
        },
        {
          kind: "graph-surface-mode",
          label: "Open donut graph sample",
          graphId: "saddle-orbit-graph",
          surfaceMode: "donut"
        },
        {
          kind: "graph-surface-mode",
          label: "Open hyperplane graph sample",
          graphId: "saddle-orbit-graph",
          surfaceMode: "hyperplanes"
        }
      ],
      relatedIds: ["work-graph-surface-morphs"]
    },
    {
      id: "visual-mesh-graph",
      title: "Mesh graph",
      kind: "visual",
      status: "active",
      summary:
        "A rendered Graph3D surface form that exposes the sampled saddle as a visible mesh.",
      tags: ["mesh", "graph", "surface-mode", "rendered-form"],
      domains: ["graphs", "calculus"],
      interfaces: ["Graph3D.surfaceMode=mesh", "WebGL surface mesh"],
      sampleTargets: [
        {
          kind: "graph-surface-mode",
          label: "Open mesh graph sample",
          graphId: "saddle-orbit-graph",
          surfaceMode: "mesh"
        }
      ],
      relatedIds: ["work-graph-surface-morphs", "visual-webgl-graph"]
    },
    {
      id: "visual-donut-surface",
      title: "Donut surface",
      kind: "visual",
      status: "active",
      summary:
        "A rendered Graph3D form for the torus-like surface mode used by graph morph previews.",
      tags: ["donut", "torus", "surface-mode", "rendered-form"],
      domains: ["graphs", "calculus"],
      interfaces: ["Graph3D.surfaceMode=donut", "WebGL surface morph target"],
      sampleTargets: [
        {
          kind: "graph-surface-mode",
          label: "Open donut graph sample",
          graphId: "saddle-orbit-graph",
          surfaceMode: "donut"
        }
      ],
      relatedIds: ["work-graph-surface-morphs", "visual-webgl-graph"]
    },
    {
      id: "visual-hyperplane-slices",
      title: "Hyperplane slices",
      kind: "visual",
      status: "active",
      summary:
        "A rendered Graph3D form that shows the surface as coordinated hyperplane slices.",
      tags: ["hyperplanes", "slices", "surface-mode", "rendered-form"],
      domains: ["graphs", "calculus"],
      interfaces: ["Graph3D.surfaceMode=hyperplanes", "WebGL surface channels"],
      sampleTargets: [
        {
          kind: "graph-surface-mode",
          label: "Open hyperplane graph sample",
          graphId: "saddle-orbit-graph",
          surfaceMode: "hyperplanes"
        }
      ],
      relatedIds: ["work-graph-surface-morphs", "visual-webgl-graph"]
    },
    {
      id: "visual-table",
      title: "Table",
      kind: "visual",
      status: "planned",
      summary:
        "A dense visual surface for structured rows, computed values, diagnostics, and future spreadsheet-like lenses.",
      tags: ["table", "data", "lens"],
      domains: ["data", "math", "programming"],
      interfaces: ["row selectors", "column selectors", "cell lenses"],
      relatedIds: ["work-semantic-object-registry"]
    },
    {
      id: "visual-network",
      title: "Network",
      kind: "visual",
      status: "planned",
      summary:
        "A graph-of-objects view for dependencies, semantic links, execution traces, and project knowledge relationships.",
      tags: ["network", "links", "relationships"],
      domains: ["project", "programming", "knowledge graph"],
      interfaces: ["node selectors", "edge selectors", "layout lens"],
      relatedIds: ["work-project-dashboard-v1"]
    },
    {
      id: "visual-code",
      title: "Code",
      kind: "visual",
      status: "planned",
      summary:
        "A programming visual that can render source ranges, AST anchors, diagnostics, execution traces, and refactors.",
      tags: ["code", "programming", "source"],
      domains: ["programming", "rust", "typescript"],
      interfaces: ["source range selectors", "AST lenses", "diagnostic overlays"],
      relatedIds: ["work-semantic-object-registry"]
    },
    {
      id: "visual-timeline",
      title: "Timeline",
      kind: "visual",
      status: "planned",
      summary:
        "A visual surface for composed animation tracks, markers, scroll clocks, and lifecycle inspection.",
      tags: ["timeline", "animation", "scroll"],
      domains: ["runtime", "authoring"],
      interfaces: ["track markers", "scroll clock", "playhead lens"],
      relatedIds: ["work-rendering-time-protocol"]
    },
    {
      id: "semantic-matrix",
      title: "Matrix",
      kind: "semantic-object",
      status: "active",
      summary:
        "A structured linear-algebra object with stable row, column, and entry identity for rendering and future operations.",
      tags: ["matrix", "linear-algebra", "selectors"],
      domains: ["math", "linear algebra"],
      interfaces: ["latex render", "entry selectors"],
      maturity: "active semantic object",
      coverage: [
        "toLatex protocol",
        "matrixForm protocol",
        "determinant evaluation"
      ],
      sourceRefs: [
        { label: "Matrix object", href: "src/semantic/matrix.ts" },
        {
          label: "Computation protocols",
          href: "src/semantic/computation-protocols.ts"
        }
      ],
      verification: ["tests/semantic.test.ts", "tests/rendering.test.ts"],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open Matrix API sample",
          itemId: "semantic-matrix"
        }
      ],
      relatedIds: ["work-semantic-object-registry"]
    },
    {
      id: "semantic-equation",
      title: "Equation",
      kind: "semantic-object",
      status: "active",
      summary:
        "A symbolic object whose authored operations emit lifecycle-aware transitions for KaTeX and future render backends.",
      tags: ["equation", "transform", "selectors"],
      domains: ["math", "algebra"],
      interfaces: ["subtractBothSides", "simplifySide", "token selectors"],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open Equation API sample",
          itemId: "semantic-equation"
        }
      ],
      relatedIds: ["work-semantic-object-registry"]
    },
    {
      id: "semantic-vector",
      title: "Vector",
      kind: "semantic-object",
      status: "planned",
      summary:
        "A planned semantic object for coordinate, geometric, and transformation views.",
      tags: ["vector", "linear-algebra"],
      domains: ["math", "linear algebra"],
      interfaces: ["component selectors", "geometric render"],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open Vector API sample",
          itemId: "semantic-vector"
        }
      ],
      relatedIds: ["work-semantic-object-registry"]
    },
    {
      id: "gallery-rendering-time-api",
      title: "Rendering/time API",
      kind: "protocol-api",
      status: "active",
      summary:
        "The shared KP API for resolving object state plus time into deterministic frames across render backends.",
      tags: ["clock", "playhead", "sampler", "render-index", "timeline"],
      domains: ["runtime", "authoring"],
      interfaces: ["KpClock", "KpPlayhead", "KpSampler", "KpRendererAdapter"],
      maturity: "active TS API",
      coverage: [
        "renderer-neutral motion plan",
        "sampled animation frame",
        "progress player"
      ],
      sourceRefs: [
        { label: "Animation kernel", href: "src/animation/kernel.ts" },
        { label: "Public SDK", href: "src/public/kp-animation-sdk.ts" }
      ],
      verification: ["tests/kp-animation-sdk.test.ts"],
      relatedIds: ["work-rendering-time-protocol"]
    }
  ],
  reportThemes: [
    {
      id: "report-animation-protocol",
      title: "Animation protocol maturity",
      status: "planned",
      grade: "B-",
      lastReviewedOn: "2026-07-08",
      scope:
        "Assess whether equation, graph, simulation, and programming animations share the same lifecycle and time model.",
      questions: [
        "Can each animation be sampled at arbitrary progress?",
        "Does rewind use the same timeline as forward playback?",
        "Are semantic selectors preserved across render backends?"
      ],
      evidence: [
        {
          label: "Rendering/time protocol design",
          href: "docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md"
        },
        {
          label: "Operation-first equation motion design",
          href: "docs/superpowers/specs/2026-07-08-operation-first-equation-motion-design.md"
        }
      ],
      risks: [
        "Graph playback still needs the shared playhead contract.",
        "Programming animation has selectors in concept but no implementation slice yet."
      ],
      recommendedNextActions: [
        "Adapt graph surface morphs to the shared playhead.",
        "Add one programming object render-node registration slice."
      ],
      tags: ["animation", "protocol", "quality"],
      relatedIds: ["work-rendering-time-protocol", "animation-cancelation"]
    },
    {
      id: "report-semantic-animation-readiness",
      title: "Semantic animation readiness",
      status: "active",
      grade: "C",
      lastReviewedOn: "2026-07-09",
      scope:
        "Checklist for promoting semantic transforms and visual motifs from prototypes into reusable animation objects.",
      questions: [
        "Does the transform declare semantic source and target objects, operation intent, and selector provenance?",
        "Does every persisted, entered, exited, artifact, and many-to-one token have explicit correspondence identity?",
        "Can the timeline be sampled at arbitrary progress and rewound through the same beats?",
        "Are layout shifts, visual motifs, focus phases, annotations, and render artifacts separated from semantic truth?"
      ],
      evidence: [
        {
          label: "KaTeX transform taxonomy design",
          href: "docs/superpowers/specs/2026-07-09-katex-transform-taxonomy-design.md"
        },
        {
          label: "Rendering/time protocol design",
          href: "docs/superpowers/specs/2026-07-08-rendering-time-protocol-design.md"
        },
        {
          label: "Semantic beat compiler checkpoint",
          href: "docs/theseus/events/2026-07-09-semantic-beat-compiler-slice-20.md"
        }
      ],
      risks: [
        "Some current fixtures are still geometry records rather than executable SemanticTransformation definitions.",
        "Graph and programming animations still need equivalent readiness gates before cross-domain claims."
      ],
      recommendedNextActions: [
        "Run this checklist before promoting a fixture or motif to active gallery status.",
        "Add one readiness assertion when each new SemanticTransformation or NotationTransform fixture is introduced.",
        "Use the checklist to separate semantic identity gaps from visual motif polish gaps."
      ],
      tags: ["animation", "semantic-transform", "readiness", "checklist"],
      relatedIds: [
        "work-rendering-time-protocol",
        "animation-cancelation",
        "gallery-rendering-time-api"
      ]
    },
    {
      id: "report-semantic-object-api",
      title: "Semantic object API",
      status: "planned",
      grade: "C+",
      lastReviewedOn: "2026-07-08",
      scope:
        "Assess whether the object model has stable records, selectors, capabilities, and migration space for math, graph, and code objects.",
      questions: [
        "Are selectors semantic rather than renderer-derived?",
        "Can object definitions expose optional capabilities cleanly?",
        "Can invalid and partial instructional objects still be represented?"
      ],
      evidence: [
        {
          label: "Structured instructional objects design",
          href: "docs/superpowers/specs/2026-07-08-structured-instructional-objects-design.md"
        }
      ],
      risks: [
        "Current runtime still uses the older closed semantic object union.",
        "Capability loading is designed but not implemented."
      ],
      recommendedNextActions: [
        "Introduce a lightweight object-definition registry shell.",
        "Register Matrix and Equation definitions through the new API first."
      ],
      tags: ["semantic-objects", "selectors", "capabilities"],
      relatedIds: ["work-semantic-object-registry", "semantic-matrix", "semantic-equation"]
    },
    {
      id: "report-graph-rendering",
      title: "Graph rendering",
      status: "planned",
      grade: "B",
      lastReviewedOn: "2026-07-08",
      scope:
        "Assess graph rendering quality, mode coverage, semantic identity, and readiness for unified timeline playback.",
      questions: [
        "Do graph renderers expose stable roles and ids?",
        "Can morph targets be sampled deterministically?",
        "Are 3D-to-2D and surface-mode transitions ready for a common playhead?"
      ],
      evidence: [
        {
          label: "Graph rendering next plan",
          href: "docs/superpowers/plans/2026-07-08-graph-rendering-next/README.md"
        }
      ],
      risks: [
        "Surface morphs have samplers but no public dashboard scrubber.",
        "2D and 3D graph paths are not yet one visual protocol."
      ],
      recommendedNextActions: [
        "Expose graph morph progress through the rendering/time protocol.",
        "Add a dashboard gallery preview for surface modes after search stabilizes."
      ],
      tags: ["graph", "webgl", "morph", "rendering"],
      relatedIds: ["work-graph-surface-morphs", "visual-webgl-graph"]
    },
    {
      id: "report-programming-readiness",
      title: "Programming object readiness",
      status: "planned",
      scope:
        "Assess whether KP can represent code objects, source ranges, diagnostics, execution traces, and refactors in the same object/time protocol.",
      questions: [
        "What is the first code-domain object slice?",
        "Can source ranges register stable selectors?",
        "Can execution or refactor timelines share the same sampler contract?"
      ],
      evidence: [],
      risks: [
        "No code-domain object implementation exists yet.",
        "The code-domain parser and selector strategy are still unspecified."
      ],
      recommendedNextActions: [
        "Define a minimal SourceFile semantic object.",
        "Render static source range selectors before attempting execution animation."
      ],
      tags: ["programming", "code", "source", "execution"],
      relatedIds: ["visual-code", "gallery-rendering-time-api"]
    },
    {
      id: "report-dashboard-operations",
      title: "Dashboard operations",
      status: "active",
      grade: "B",
      lastReviewedOn: "2026-07-08",
      scope:
        "Track whether the dashboard is giving the user useful project state, blockers, and reprioritization handles.",
      questions: [
        "Are active tasks visible and current?",
        "Can Codex update statuses after completing work?",
        "Do gallery entries expose the right interfaces and test points?"
      ],
      evidence: [
        {
          label: "Project dashboard v1 plan",
          href: "docs/superpowers/plans/2026-07-08-project-dashboard-v1/README.md"
        },
        {
          label: "Project dashboard v1 write protocol",
          href: "docs/superpowers/specs/2026-07-08-project-dashboard-v1-design.md"
        },
        {
          label: "Project dashboard browser spec",
          href: "tests/project-dashboard.browser.spec.ts"
        }
      ],
      risks: [
        "Browser edits are not persistent in v1.",
        "Card status updates still require Codex to edit seed data until persistent editing lands."
      ],
      recommendedNextActions: [
        "Choose the next dashboard slice: persistent writeback, richer gallery previews, or report-card generation.",
        "Apply the write protocol after each future dashboard-related commit."
      ],
      tags: ["dashboard", "codex", "project-health"],
      relatedIds: ["work-project-dashboard-v1"]
    }
  ]
};
