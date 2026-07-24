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
      projectRefs: [
        {
          kind: "roadmap",
          label: "KP roadmap",
          href: "docs/project/roadmap.md"
        },
        {
          kind: "thread",
          label: "Semantic runtime thread",
          href: "docs/project/threads/semantic-runtime.md"
        },
        {
          kind: "review",
          label: "July 10 next-step review",
          href: "docs/project/reviews/2026-07-10-next-step-review.md"
        },
        {
          kind: "decision",
          label: "Semantic runtime roadmap decision",
          href: "docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json",
          id: "decision.kp.semantic-animation-runtime-roadmap"
        },
        {
          kind: "theseus",
          label: "Semantic runtime roadmap loop",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.semantic-runtime-roadmap-loop-v1.json",
          id: "run-contract.kp.semantic-runtime-roadmap-loop-v1"
        }
      ],
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
      id: "work-kp-asset-calculus",
      title: "KP Asset Calculus",
      category: "ts-api",
      status: "active",
      priority: "critical",
      summary:
        "Formalize the shared asset, transformation, diagram, behavior, interpreter, port, flashcard, and law protocol that future KP authoring composes through.",
      tags: [
        "asset-calculus",
        "semantics",
        "composition",
        "denotational-time",
        "llm-authoring"
      ],
      projectRefs: [
        {
          kind: "roadmap",
          label: "KP roadmap",
          href: "docs/project/roadmap.md"
        },
        {
          kind: "thread",
          label: "Semantic runtime thread",
          href: "docs/project/threads/semantic-runtime.md"
        },
        {
          kind: "decision",
          label: "KP Asset Calculus priority decision",
          href: "docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md"
        },
        {
          kind: "theseus",
          label: "KP Asset Calculus run contract",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.asset-calculus-denotational-protocol-v0.json",
          id: "run-contract.kp.asset-calculus-denotational-protocol-v0"
        }
      ],
      sourceRefs: [
        {
          label: "Asset Calculus doctrine",
          href: "docs/project/principles/kp-asset-calculus.md"
        },
        {
          label: "Composition laws",
          href: "docs/project/principles/kp-composition-laws.md"
        },
        {
          label: "Asset authoring guide",
          href: "docs/project/authoring/kp-asset-authoring-guide.md"
        }
      ],
      verification: [
        "npm run theseus -- validate",
        "npm test -- tests/project-dashboard.test.ts tests/project-dashboard-theseus-adapter.test.ts"
      ],
      relatedIds: [
        "work-rendering-time-protocol",
        "work-semantic-object-registry",
        "gallery-kp-asset-calculus",
        "gallery-kp-composition-laws",
        "gallery-kp-asset-authoring-guide"
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
        {
          label: "Visual motif module",
          href: "src/animation/motifs/visual-motif.ts"
        }
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
      status: "active",
      summary:
        "A live tutorial card sample that scrubs equation and graph frames from the same semantic clock.",
      tags: ["sync", "equation", "graph", "shared-clock", "tutorial-card"],
      domains: ["math", "graphs", "runtime"],
      interfaces: [
        "shared playhead",
        "equation animation sample",
        "graph state sample",
        "tutorial card sample(progress)"
      ],
      maturity: "active live sample",
      coverage: [
        "equation animation id",
        "graph id",
        "synchronized panel layout id",
        "shared semantic clock id",
        "tutorial card frame sampler",
        "equation frame adapter",
        "graph frame adapter"
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
          label: "Synchronized panel layout sample",
          href: "src/layout/synchronized-panel.ts"
        },
        {
          label: "Tutorial card frame sampler",
          href: "src/tutorial/card-frame-sampler.ts"
        },
        {
          label: "Linear solve live sample",
          href: "src/tutorial/linear-solve-card-sample.ts"
        },
        {
          label: "Dashboard sample target",
          href: "src/project-dashboard/data.ts"
        }
      ],
      verification: [
        "tests/linear-solve-tutorial-card-sample.test.ts",
        "tests/tutorial-card-frame-sampler.test.ts",
        "tests/project-dashboard.test.ts",
        "tests/project-dashboard-theseus-adapter.test.ts"
      ],
      sampleTargets: [
        {
          kind: "synchronized-equation-graph",
          label: "Open synchronized solve sample",
          animationId: "linear-equation-solve-x",
          graphId: "saddle-orbit-graph",
          layoutId: "layout.sample.linear-solve-synchronized-panel",
          sharedClockId: "solve-x-shared-clock",
          surfaceMode: "mesh"
        },
        {
          kind: "tutorial-card",
          label: "Open live tutorial card sample",
          sampleId: "tutorial.linear-solve.card.live-sample",
          manifestId: "tutorial.linear-solve.card",
          layoutId: "layout.sample.linear-solve-synchronized-panel",
          sharedClockId: "solve-x-shared-clock"
        }
      ],
      relatedIds: [
        "work-rendering-time-protocol",
        "visual-webgl-graph",
        "semantic-equation",
        "tutorial-card-manifest-v0"
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
      id: "semantic-source-file",
      title: "SourceFile",
      kind: "semantic-object",
      status: "active",
      summary:
        "A programming semantic object with stable source text, language metadata, revision identity, and one-based source range selectors.",
      tags: ["code", "programming", "selectors"],
      domains: ["programming", "typescript", "runtime"],
      interfaces: ["sourceFileLines", "source range selectors", "line/column positions"],
      maturity: "active semantic object",
      coverage: [
        "SourceFile object shell",
        "one-based source range selectors",
        "document validation"
      ],
      sourceRefs: [
        { label: "SourceFile object", href: "src/semantic/source-file.ts" },
        { label: "Semantic document union", href: "src/semantic/document.ts" },
        { label: "Semantic validation", href: "src/semantic/validation.ts" }
      ],
      verification: ["tests/semantic.test.ts", "npm run typecheck"],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open SourceFile API sample",
          itemId: "semantic-source-file"
        }
      ],
      relatedIds: [
        "work-semantic-object-registry",
        "visual-code",
        "report-programming-readiness"
      ]
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
    },
    {
      id: "gallery-kp-asset-calculus",
      title: "KP Asset Calculus",
      kind: "protocol-api",
      status: "active",
      summary:
        "Project doctrine for immutable semantic assets, structure-preserving transformations, diagrams, denotational behaviors, interpreters, ports, flashcards, and renderer boundaries.",
      tags: [
        "asset-calculus",
        "semantic-object",
        "semantic-transformation",
        "diagram",
        "behavior",
        "interpreter",
        "port",
        "flashcard"
      ],
      domains: ["runtime", "authoring", "math", "programming"],
      interfaces: [
        "SemanticObject",
        "SemanticTransformation",
        "SemanticDiagram",
        "KpBehavior",
        "Interpreter",
        "Port",
        "FlashcardSpec",
        "AssetBundle"
      ],
      maturity: "active doctrine",
      coverage: [
        "semantic truth vs presentation boundary",
        "composition forms",
        "denotational time",
        "linear-solve vertical proof target"
      ],
      projectRefs: [
        {
          kind: "decision",
          label: "KP Asset Calculus priority decision",
          href: "docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md"
        },
        {
          kind: "theseus",
          label: "KP Asset Calculus run contract",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.asset-calculus-denotational-protocol-v0.json",
          id: "run-contract.kp.asset-calculus-denotational-protocol-v0"
        }
      ],
      sourceRefs: [
        {
          label: "Asset Calculus doctrine",
          href: "docs/project/principles/kp-asset-calculus.md"
        }
      ],
      verification: ["npm run theseus -- validate"],
      relatedIds: [
        "work-kp-asset-calculus",
        "gallery-rendering-time-api",
        "semantic-equation"
      ]
    },
    {
      id: "gallery-kp-composition-laws",
      title: "KP composition laws",
      kind: "protocol-api",
      status: "active",
      summary:
        "Law vocabulary and enforcement levels for identity, associativity, selector closure, correspondence, deterministic sampling, rewind, interpreters, ports, and flashcards.",
      tags: [
        "composition",
        "laws",
        "identity",
        "associativity",
        "rewind",
        "diagnostics"
      ],
      domains: ["runtime", "verification", "authoring"],
      interfaces: [
        "identity law",
        "associativity law",
        "selector closure",
        "correspondence preservation",
        "rewind equivalence",
        "loss diagnostics"
      ],
      maturity: "active doctrine",
      coverage: [
        "strict laws",
        "sampled laws",
        "lax laws",
        "qualitative review",
        "failure policy"
      ],
      projectRefs: [
        {
          kind: "decision",
          label: "KP Asset Calculus priority decision",
          href: "docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md"
        }
      ],
      sourceRefs: [
        {
          label: "Composition laws",
          href: "docs/project/principles/kp-composition-laws.md"
        }
      ],
      verification: ["npm run theseus -- validate"],
      relatedIds: [
        "work-kp-asset-calculus",
        "gallery-kp-asset-calculus",
        "gallery-rendering-time-api"
      ]
    },
    {
      id: "gallery-kp-asset-authoring-guide",
      title: "KP asset authoring guide",
      kind: "protocol-api",
      status: "active",
      summary:
        "Operational guide for humans, LLM sessions, and deterministic generators to create assets from semantic intent through objects, selectors, transformations, diagrams, behaviors, ports, and flashcards.",
      tags: ["llm-authoring", "codex", "asset-authoring", "generator", "guide"],
      domains: ["authoring", "runtime", "curriculum"],
      interfaces: [
        "authoring checklist",
        "external port recipe",
        "decomposition recipe",
        "flashcard references",
        "review checklist"
      ],
      maturity: "active guide",
      coverage: [
        "semantic-first naming",
        "selector rules",
        "behavior frames",
        "port diagnostics",
        "anti-patterns"
      ],
      projectRefs: [
        {
          kind: "decision",
          label: "KP Asset Calculus priority decision",
          href: "docs/project/decisions/2026-07-11-kp-asset-calculus-priority.md"
        }
      ],
      sourceRefs: [
        {
          label: "Asset authoring guide",
          href: "docs/project/authoring/kp-asset-authoring-guide.md"
        }
      ],
      verification: ["npm run theseus -- validate"],
      relatedIds: [
        "work-kp-asset-calculus",
        "gallery-kp-asset-calculus",
        "gallery-kp-composition-laws"
      ]
    },
    {
      id: "asset-linear-solve-bundle",
      title: "Linear solve AssetBundle",
      kind: "protocol-api",
      status: "active",
      summary:
        "Canonical KP Asset Calculus example for x + 3 = 7, including equation objects, selector correspondence, semantic transformations, a sequence diagram, behavior, drill-down hook, and flashcards.",
      tags: ["asset-bundle", "linear-solve", "equation", "behavior", "example"],
      domains: ["runtime", "authoring", "math"],
      interfaces: [
        "createLinearSolveKpAssetBundle",
        "createLinearSolveKpBehavior",
        "KpSemanticTransformation",
        "KpSemanticDiagramSequence"
      ],
      maturity: "active canonical example",
      coverage: [
        "semantic objects",
        "selector correspondence",
        "diagram rewind law",
        "behavior determinism"
      ],
      sourceRefs: [
        {
          label: "Linear solve asset",
          href: "src/semantic/linear-solve-asset.ts"
        }
      ],
      verification: [
        "node --disable-warning=ExperimentalWarning --test tests/kp-linear-solve-asset.test.ts"
      ],
      relatedIds: [
        "gallery-kp-asset-calculus",
        "asset-linear-solve-flashcards",
        "port-algebra-trace-fixture"
      ]
    },
    {
      id: "asset-linear-solve-flashcards",
      title: "Linear solve flashcards",
      kind: "protocol-api",
      status: "active",
      summary:
        "Reusable flashcard specs generated from the linear-solve bundle for cloze, predict-next, explain-transform, and selector-persistence prompts.",
      tags: ["flashcard", "linear-solve", "study", "selector", "example"],
      domains: ["authoring", "curriculum", "math"],
      interfaces: ["KpFlashcardSpec", "validateKpFlashcardSpec"],
      maturity: "active canonical example",
      coverage: [
        "cloze selector references",
        "predict-next transformation references",
        "explain-transform prompts",
        "selector persistence focus"
      ],
      sourceRefs: [
        {
          label: "Linear solve flashcards",
          href: "src/semantic/linear-solve-asset.ts"
        },
        {
          label: "Flashcard contract",
          href: "src/semantic/asset-flashcard.ts"
        }
      ],
      verification: [
        "node --disable-warning=ExperimentalWarning --test tests/kp-linear-solve-asset.test.ts tests/kp-asset-flashcard.test.ts"
      ],
      relatedIds: [
        "asset-linear-solve-bundle",
        "gallery-kp-asset-calculus",
        "gallery-kp-asset-authoring-guide"
      ]
    },
    {
      id: "port-algebra-trace-fixture",
      title: "Algebra trace port fixture",
      kind: "protocol-api",
      status: "active",
      summary:
        "Deterministic external algebra-trace port fixture that imports generated solve steps into the canonical linear-solve bundle shape with explicit provenance and loss diagnostics.",
      tags: ["port", "algebra-trace", "diagnostics", "linear-solve", "example"],
      domains: ["runtime", "authoring", "math", "verification"],
      interfaces: [
        "createLinearSolveAlgebraTracePort",
        "linearSolveAlgebraTraceFixture",
        "checkKpPortDeterminism",
        "checkKpPortLossDiagnostics"
      ],
      maturity: "active fixture",
      coverage: [
        "strict deterministic import",
        "port provenance",
        "shape parity with canonical bundle",
        "partial-loss diagnostics"
      ],
      sourceRefs: [
        {
          label: "Algebra trace port fixture",
          href: "src/semantic/algebra-trace-port-fixture.ts"
        },
        {
          label: "Port law helpers",
          href: "src/semantic/asset-laws.ts"
        }
      ],
      verification: [
        "node --disable-warning=ExperimentalWarning --test tests/kp-algebra-trace-port-fixture.test.ts tests/kp-asset-port.test.ts"
      ],
      relatedIds: [
        "asset-linear-solve-bundle",
        "gallery-kp-composition-laws",
        "gallery-kp-asset-authoring-guide"
      ]
    },
    {
      id: "asset-program-trace-skeleton",
      title: "Program trace asset skeleton",
      kind: "protocol-api",
      status: "active",
      summary:
        "Semantic wrapper for the addition execution trace fixture, exposing source-file and execution-step objects, advanceExecutionTrace transformations, a diagram, and deterministic behavior sampling.",
      tags: ["programming", "execution-trace", "source-file", "behavior", "example"],
      domains: ["runtime", "authoring", "programming"],
      interfaces: [
        "createAdditionProgramTraceKpAsset",
        "advanceExecutionTrace",
        "KpBehavior"
      ],
      maturity: "active skeleton",
      coverage: [
        "source range selectors",
        "execution-step objects",
        "trace transformation sequence",
        "behavior determinism"
      ],
      sourceRefs: [
        {
          label: "Program trace asset",
          href: "src/semantic/program-trace-asset.ts"
        },
        {
          label: "Execution trace fixture",
          href: "src/tutorial/programming-execution-trace-fixture.ts"
        }
      ],
      verification: [
        "node --disable-warning=ExperimentalWarning --test tests/kp-program-trace-asset.test.ts tests/programming-execution-trace-fixture.test.ts"
      ],
      relatedIds: [
        "gallery-kp-asset-calculus",
        "visual-code",
        "report-programming-readiness"
      ]
    },
    {
      id: "tutorial-card-manifest-v0",
      title: "Tutorial card manifest v0",
      kind: "protocol-api",
      status: "active",
      summary:
        "Serializable capsule contract for portable tutorials with semantic objects, transformations, layouts, timelines, checks, dependencies, fallbacks, and export profiles.",
      tags: ["tutorial", "manifest", "runtime", "export"],
      domains: ["runtime", "authoring", "curriculum"],
      interfaces: [
        "KpTutorialCardManifest",
        "createKpTutorialCardManifest",
        "validateKpTutorialCardManifest",
        "createLinearSolveTutorialCardManifest"
      ],
      maturity: "active TS API",
      coverage: [
        "semantic object refs",
        "semantic transformation refs",
        "layout refs",
        "timeline refs",
        "readiness checks",
        "dependency manifest",
        "fallback render",
        "export profiles"
      ],
      projectRefs: [
        {
          kind: "roadmap",
          label: "KP roadmap",
          href: "docs/project/roadmap.md"
        },
        {
          kind: "thread",
          label: "Semantic runtime thread",
          href: "docs/project/threads/semantic-runtime.md"
        },
        {
          kind: "decision",
          label: "Semantic runtime roadmap decision",
          href: "docs/theseus/nodes/decisions/decision.kp.semantic-animation-runtime-roadmap.json",
          id: "decision.kp.semantic-animation-runtime-roadmap"
        },
        {
          kind: "theseus",
          label: "Tutorial card manifest slice",
          href: "docs/theseus/nodes/next-actions/next.kp.tutorial-card-manifest-v0.json",
          id: "next.kp.tutorial-card-manifest-v0"
        }
      ],
      sourceRefs: [
        {
          label: "Tutorial card manifest API",
          href: "src/tutorial/card-manifest.ts"
        },
        {
          label: "Embeds and export API outline",
          href: "src/editor/api-catalog.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-manifest.test.ts",
        "tests/api-catalog.test.ts",
        "tests/project-dashboard.test.ts"
      ],
      relatedIds: [
        "gallery-rendering-time-api",
        "sample-synced-equation-graph-linear-solve",
        "report-semantic-runtime-readiness"
      ]
    },
    {
      id: "iframe-export-artifact",
      title: "Iframe export artifact",
      kind: "protocol-api",
      status: "active",
      summary:
        "Resolved iframe export artifact for the linear-solve tutorial card, carrying artifact identity, profile metadata, dependency phases, fallback data, and an iframe-ready HTML document shell.",
      tags: ["iframe", "export", "embed", "tutorial-card"],
      domains: ["runtime", "authoring", "export"],
      interfaces: [
        "KpTutorialCardExportArtifact",
        "resolveKpTutorialCardIframeExportArtifact",
        "renderKpTutorialCardIframeDocument"
      ],
      maturity: "active metadata artifact",
      coverage: [
        "artifact identity",
        "iframe profile mapping",
        "dependency metadata",
        "fallback metadata",
        "iframe document shell"
      ],
      sourceRefs: [
        {
          label: "Export artifact contract",
          href: "src/tutorial/export-artifact.ts"
        },
        {
          label: "Iframe artifact resolver",
          href: "src/tutorial/export-artifact-resolver.ts"
        },
        {
          label: "Iframe document renderer",
          href: "src/tutorial/iframe-export-document.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-export-artifact.test.ts",
        "tests/tutorial-card-iframe-document.test.ts",
        "tests/project-dashboard.test.ts"
      ],
      sampleTargets: [
        {
          kind: "export-artifact",
          label: "Open iframe export artifact",
          artifactId: "artifact.linear-solve.iframe",
          manifestId: "tutorial.linear-solve.card",
          profileId: "export.linear-solve.iframe",
          payloadKind: "html-document"
        },
        {
          kind: "api-catalog-item",
          label: "Open IframeExportArtifact API sample",
          itemId: "embed-iframe-export-artifact"
        }
      ],
      relatedIds: [
        "tutorial-card-manifest-v0",
        "sample-synced-equation-graph-linear-solve",
        "report-semantic-runtime-readiness"
      ]
    },
    {
      id: "static-step-export-artifact",
      title: "Static-step export artifact",
      kind: "protocol-api",
      status: "active",
      summary:
        "Renderable static-step export artifact for the linear-solve tutorial card, selecting parent-timeline checkpoints and sampling frames into a JSON step sequence.",
      tags: ["static-step", "step-sequence", "export", "tutorial-card", "json"],
      domains: ["runtime", "authoring", "export"],
      interfaces: [
        "KpTutorialCardStaticStepArtifact",
        "selectKpTutorialStaticStepCheckpoints",
        "renderKpTutorialCardStaticStepSequence"
      ],
      maturity: "active renderable artifact",
      coverage: [
        "checkpoint selection",
        "parent timeline boundaries",
        "frame sampling",
        "JSON sequence output"
      ],
      sourceRefs: [
        {
          label: "Static-step artifact contract",
          href: "src/tutorial/static-step-artifact.ts"
        },
        {
          label: "Static-step checkpoint selector",
          href: "src/tutorial/static-step-checkpoints.ts"
        },
        {
          label: "Static-step sequence renderer",
          href: "src/tutorial/static-step-sequence-renderer.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-static-step-artifact.test.ts",
        "tests/project-dashboard.test.ts",
        "tests/api-catalog.test.ts"
      ],
      sampleTargets: [
        {
          kind: "export-artifact",
          label: "Open static-step export artifact",
          artifactId: "artifact.linear-solve.steps",
          manifestId: "tutorial.linear-solve.card",
          profileId: "export.linear-solve.steps",
          payloadKind: "json-document"
        },
        {
          kind: "api-catalog-item",
          label: "Open StaticStepExportArtifact API sample",
          itemId: "embed-static-step-export-artifact"
        }
      ],
      relatedIds: [
        "tutorial-card-manifest-v0",
        "iframe-export-artifact",
        "sample-synced-equation-graph-linear-solve",
        "report-semantic-runtime-readiness"
      ]
    },
    {
      id: "frame-sequence-export-preview",
      title: "Frame-sequence export preview",
      kind: "protocol-api",
      status: "active",
      summary:
        "Parent-timeline media export sampler that bundles synchronized equation, graph, and programming frames into a renderable JSON frame-sequence artifact with a static HTML preview.",
      tags: ["frame-sequence", "export", "media", "timeline", "preview"],
      domains: ["runtime", "authoring", "export", "programming"],
      interfaces: [
        "createKpTutorialParentTimelineFrameExportContract",
        "sampleKpTutorialEquationFramesForExport",
        "sampleKpTutorialGraphFramesForExport",
        "sampleKpTutorialProgrammingFramesForExport",
        "createKpTutorialFrameSequenceArtifact",
        "renderKpTutorialFrameSequencePreviewHtml"
      ],
      maturity: "active frame-sequence preview",
      coverage: [
        "parent timeline frame sampling",
        "equation frame sequence",
        "graph frame sequence",
        "programming trace frame sequence",
        "rewind frame ids",
        "HTML preview"
      ],
      sourceRefs: [
        {
          label: "Frame export contract",
          href: "src/tutorial/frame-export-contract.ts"
        },
        {
          label: "Equation frame export sampler",
          href: "src/tutorial/equation-frame-export-sampler.ts"
        },
        {
          label: "Graph frame export sampler",
          href: "src/tutorial/graph-frame-export-sampler.ts"
        },
        {
          label: "Programming frame export sampler",
          href: "src/tutorial/programming-frame-export-sampler.ts"
        },
        {
          label: "Frame-sequence artifact",
          href: "src/tutorial/frame-sequence-artifact.ts"
        },
        {
          label: "Frame-sequence preview",
          href: "src/tutorial/frame-sequence-preview.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-frame-export-contract.test.ts",
        "tests/tutorial-card-equation-frame-export-sampler.test.ts",
        "tests/tutorial-card-graph-frame-export-sampler.test.ts",
        "tests/tutorial-card-programming-frame-export-sampler.test.ts",
        "tests/tutorial-card-frame-sequence-artifact.test.ts",
        "tests/tutorial-card-frame-sequence-preview.test.ts"
      ],
      sampleTargets: [
        {
          kind: "export-artifact",
          label: "Open frame-sequence export preview",
          artifactId: "artifact.linear-solve.gif.frames",
          manifestId: "tutorial.linear-solve.card",
          profileId: "export.linear-solve.gif",
          payloadKind: "json-document"
        },
        {
          kind: "api-catalog-item",
          label: "Open FrameSequenceExportPreview API sample",
          itemId: "embed-frame-sequence-export-preview"
        }
      ],
      relatedIds: [
        "static-step-export-artifact",
        "iframe-export-artifact",
        "programming-execution-trace-card",
        "report-hosted-package-readiness",
        "report-semantic-runtime-readiness"
      ]
    },
    {
      id: "iframe-asset-manifest",
      title: "Iframe asset manifest",
      kind: "protocol-api",
      status: "active",
      summary:
        "Serializable iframe export manifest for dependency phases, capability keys, asset ids, and sandbox/permission/referrer embed policy metadata.",
      tags: ["iframe", "manifest", "assets", "policy", "hardening"],
      domains: ["runtime", "export", "embed"],
      interfaces: ["createKpIframeExportAssetManifest"],
      maturity: "active export hardening artifact",
      coverage: [
        "dependency phases",
        "capability keys",
        "asset ids",
        "embed policy metadata"
      ],
      sourceRefs: [
        {
          label: "Iframe asset manifest",
          href: "src/tutorial/iframe-asset-manifest.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-iframe-asset-manifest.test.ts",
        "tests/tutorial-card-iframe-document.test.ts"
      ],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open IframeAssetManifest API sample",
          itemId: "embed-iframe-asset-manifest"
        }
      ],
      relatedIds: [
        "iframe-export-artifact",
        "tutorial-card-manifest-v0",
        "report-tutorial-launch-readiness"
      ]
    },
    {
      id: "hosted-artifact-readiness",
      title: "Hosted artifact readiness",
      kind: "protocol-api",
      status: "active",
      summary:
        "Static-host/package readiness validator for iframe and static-step export artifacts, aggregating artifact validity, dependency closure, fallback readiness, dev-server asset URL checks, and iframe embed policy.",
      tags: ["hosted", "readiness", "export", "fallback", "hardening"],
      domains: ["runtime", "export", "embed"],
      interfaces: ["validateKpTutorialHostedArtifactReadiness"],
      maturity: "active hosted-readiness gate",
      coverage: [
        "artifact validity",
        "dependency closure",
        "fallback readiness",
        "dev-server asset URL diagnostics",
        "iframe embed policy diagnostics"
      ],
      sourceRefs: [
        {
          label: "Hosted artifact readiness",
          href: "src/tutorial/hosted-artifact-readiness.ts"
        }
      ],
      verification: [
        "tests/tutorial-hosted-artifact-readiness.test.ts",
        "tests/tutorial-static-host-fallback-readiness.test.ts"
      ],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open HostedArtifactReadiness API sample",
          itemId: "embed-hosted-artifact-readiness"
        }
      ],
      relatedIds: [
        "iframe-export-artifact",
        "static-step-export-artifact",
        "iframe-asset-manifest",
        "report-tutorial-launch-readiness"
      ]
    },
    {
      id: "static-host-fixture-root",
      title: "Static-host fixture root",
      kind: "protocol-api",
      status: "active",
      summary:
        "Serializable static-host root for packaged iframe and static-step artifact entries with relative paths, HTML payloads, readiness diagnostics, and fallback metadata.",
      tags: ["hosted", "fixture", "iframe", "static-step", "hardening"],
      domains: ["runtime", "export", "embed"],
      interfaces: [
        "createLinearSolveStaticHostFixtureRoot",
        "findKpStaticHostFixtureEntry"
      ],
      maturity: "active packaged smoke fixture",
      coverage: [
        "relative hosted paths",
        "iframe document entry",
        "static-step document entry",
        "fallback readiness metadata",
        "packaged browser smoke"
      ],
      sourceRefs: [
        {
          label: "Static-host fixture root",
          href: "src/tutorial/static-host-fixture-root.ts"
        },
        {
          label: "Packaged iframe smoke",
          href: "tests/packaged-iframe-smoke.browser.spec.ts"
        },
        {
          label: "Packaged static-step smoke",
          href: "tests/packaged-static-step-smoke.browser.spec.ts"
        }
      ],
      verification: [
        "tests/tutorial-static-host-fixture-root.test.ts",
        "tests/packaged-iframe-smoke.browser.spec.ts",
        "tests/packaged-static-step-smoke.browser.spec.ts"
      ],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open StaticHostFixtureRoot API sample",
          itemId: "embed-static-host-fixture-root"
        }
      ],
      relatedIds: [
        "hosted-artifact-readiness",
        "iframe-export-artifact",
        "static-step-export-artifact",
        "report-tutorial-launch-readiness"
      ]
    },
    {
      id: "programming-execution-trace-card",
      title: "Programming execution-trace card",
      kind: "protocol-api",
      status: "active",
      summary:
        "Browser-smokeable programming tutorial card that composes SourceFile and execution-trace panels from one sampled clock.",
      tags: ["programming", "trace", "tutorial-card", "hardening"],
      domains: ["programming", "runtime", "tutorial"],
      interfaces: [
        "createAdditionProgrammingExecutionTraceTutorialCardSample",
        "renderKpProgrammingExecutionTraceTutorialCardHtmlShell"
      ],
      maturity: "active tutorial-card sample",
      coverage: [
        "SourceFile panel",
        "execution-trace panel",
        "shared progress sampling",
        "browser nonblank smoke"
      ],
      sourceRefs: [
        {
          label: "Execution trace card sample",
          href: "src/tutorial/programming-execution-trace-card-sample.ts"
        },
        {
          label: "Execution trace panel",
          href: "src/tutorial/programming-execution-trace-panel.ts"
        }
      ],
      verification: [
        "tests/programming-execution-trace-card-sample.test.ts",
        "tests/programming-execution-trace-card-smoke.browser.spec.ts"
      ],
      sampleTargets: [
        {
          kind: "tutorial-card",
          label: "Open programming execution-trace card",
          sampleId: "tutorial.programming.add.execution-trace.card.live-sample",
          manifestId: "tutorial.programming.add.execution-trace.card",
          sharedClockId: "clock.programming.add-demo"
        },
        {
          kind: "api-catalog-item",
          label: "Open ProgrammingExecutionTraceCard API sample",
          itemId: "embed-programming-execution-trace-card"
        }
      ],
      relatedIds: [
        "semantic-source-file",
        "report-tutorial-launch-readiness",
        "report-programming-readiness"
      ]
    },
    {
      id: "synchronized-comparison-card",
      title: "Synchronized comparison card",
      kind: "protocol-api",
      status: "active",
      summary:
        "Comparison shell that renders two tutorial-card samples from one shared progress value for synchronized explanation layouts.",
      tags: ["comparison", "sync", "tutorial-card", "layout", "hardening"],
      domains: ["runtime", "layout", "tutorial"],
      interfaces: [
        "createLinearSolveProgrammingComparisonSample",
        "renderKpSynchronizedComparisonHtmlShell"
      ],
      maturity: "active comparison sample shell",
      coverage: [
        "shared progress sampling",
        "two tutorial-card child shells",
        "browser smoke"
      ],
      sourceRefs: [
        {
          label: "Synchronized comparison shell",
          href: "src/tutorial/synchronized-comparison-card.ts"
        }
      ],
      verification: [
        "tests/synchronized-comparison-card.test.ts",
        "tests/synchronized-comparison-card.browser.spec.ts"
      ],
      sampleTargets: [
        {
          kind: "api-catalog-item",
          label: "Open SynchronizedComparisonCard API sample",
          itemId: "embed-synchronized-comparison-card"
        }
      ],
      relatedIds: [
        "sample-synced-equation-graph-linear-solve",
        "programming-execution-trace-card",
        "report-tutorial-launch-readiness"
      ]
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
      id: "report-semantic-runtime-readiness",
      title: "Semantic runtime readiness",
      status: "active",
      grade: "A-",
      lastReviewedOn: "2026-07-11",
      scope:
        "Assess whether KP has enough shared object, transformation, layout, and time runtime to compose live tutorial cards with synchronized equation and graph panels, concrete export artifacts, and future programming views.",
      questions: [
        "Can runtime objects preserve stable semantic selectors across rendered forms?",
        "Can equation, graph, and layout views sample arbitrary progress from one shared clock?",
        "Can synchronized layout composition mount a live card shell with equation, graph, and controls panels?",
        "Can export profiles describe iframe and static-step outputs without changing the semantic manifest?",
        "Can programming SourceFile selectors join the same tutorial-card runtime?"
      ],
      evidence: [
        { label: "Animation kernel", href: "src/animation/kernel.ts" },
        {
          label: "Equation motion sampler",
          href: "src/rendering/equation-motion-sampler.ts"
        },
        {
          label: "Graph transition sampler",
          href: "src/rendering/graph-transitions.ts"
        },
        {
          label: "Synchronized panel layout sample",
          href: "src/layout/synchronized-panel.ts"
        },
        {
          label: "Tutorial card HTML shell",
          href: "src/tutorial/card-html-shell.ts"
        },
        {
          label: "Tutorial card frame sampler",
          href: "src/tutorial/card-frame-sampler.ts"
        },
        {
          label: "Tutorial card export profile resolver",
          href: "src/tutorial/export-profile-resolver.ts"
        },
        {
          label: "Tutorial export artifact catalog",
          href: "src/tutorial/export-artifact-catalog.ts"
        },
        {
          label: "Static-step sequence renderer",
          href: "src/tutorial/static-step-sequence-renderer.ts"
        },
        {
          label: "Programming tutorial card sample",
          href: "src/tutorial/programming-card-sample.ts"
        },
        {
          label: "Graph parent-timeline diagnostic",
          href: "src/tutorial/graph-parent-timeline-diagnostic.ts"
        },
        {
          label: "SourceFile semantic object",
          href: "src/semantic/source-file.ts"
        },
        {
          label: "Semantic runtime loop closeout",
          href: "docs/project/reviews/2026-07-10-semantic-runtime-roadmap-loop-closeout.md"
        }
      ],
      risks: [
        "GIF and video encoders are still profile metadata rather than rendered media artifacts.",
        "Iframe and static-step artifacts are concrete, but they still need broader browser smoke coverage across hosted packaging and dashboard launch paths.",
        "Programming tutorial cards currently cover a static SourceFile panel, not execution traces, stack frames, locals, or runtime state.",
        "Graph diagnostics cover timeline conformance for the current mesh sample; richer graph transformations still need cross-panel readiness checks."
      ],
      recommendedNextActions: [
        "Close the export/embed loop with a stop report and next-loop priorities.",
        "Add browser smoke coverage for iframe, static-step, and programming sample launch paths.",
        "Start GIF or video export sampling after iframe and static-step artifacts stay stable.",
        "Extend programming tutorial cards from static SourceFile panels into execution-trace frames."
      ],
      tags: [
        "runtime",
        "semantic-objects",
        "layout",
        "timeline",
        "readiness",
        "tutorial-card",
        "export"
      ],
      projectRefs: [
        {
          kind: "roadmap",
          label: "KP roadmap",
          href: "docs/project/roadmap.md"
        },
        {
          kind: "review",
          label: "Semantic runtime loop closeout",
          href: "docs/project/reviews/2026-07-10-semantic-runtime-roadmap-loop-closeout.md"
        },
        {
          kind: "theseus",
          label: "Semantic runtime roadmap loop",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.semantic-runtime-roadmap-loop-v1.json",
          id: "run-contract.kp.semantic-runtime-roadmap-loop-v1"
        },
        {
          kind: "theseus",
          label: "Tutorial card runtime loop",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-runtime-loop-v0.json",
          id: "run-contract.kp.tutorial-card-runtime-loop-v0"
        }
      ],
      relatedIds: [
        "work-rendering-time-protocol",
        "gallery-rendering-time-api",
        "sample-synced-equation-graph-linear-solve",
        "tutorial-card-manifest-v0",
        "iframe-export-artifact",
        "static-step-export-artifact",
        "semantic-source-file"
      ]
    },
    {
      id: "report-tutorial-launch-readiness",
      title: "Tutorial launch readiness",
      status: "active",
      grade: "A-",
      lastReviewedOn: "2026-07-11",
      scope:
        "Assess whether current tutorial-card launch surfaces are browser-reachable, sampleable, linked from the dashboard, and backed by export dependency and fallback checks.",
      questions: [
        "Are live, iframe, static-step, and programming tutorial launch targets browser-reachable from the dashboard?",
        "Can tutorial cards be sampled at deterministic progress states with matching clock, scrubber, and beat metadata?",
        "Do equation, graph, and programming panels render nonblank panel content in browser smoke fixtures?",
        "Do iframe and static-step export artifacts expose dependency closure, fallback readiness, and embed policy metadata?"
      ],
      evidence: [
        {
          label: "Tutorial launch target registry",
          href: "src/tutorial/launch-targets.ts"
        },
        {
          label: "Dashboard launch target health",
          href: "src/tutorial/launch-target-dashboard-health.ts"
        },
        {
          label: "Tutorial launch browser smoke",
          href: "tests/tutorial-launch-smoke.browser.spec.ts"
        },
        {
          label: "Iframe export browser smoke",
          href: "tests/iframe-export-smoke.browser.spec.ts"
        },
        {
          label: "Static-step export browser smoke",
          href: "tests/static-step-export-smoke.browser.spec.ts"
        },
        {
          label: "Programming card browser smoke",
          href: "tests/programming-card-smoke.browser.spec.ts"
        },
        {
          label: "Tutorial card seek browser smoke",
          href: "tests/tutorial-card-seek-smoke.browser.spec.ts"
        },
        {
          label: "Tutorial panel nonblank browser smoke",
          href: "tests/tutorial-panel-nonblank-smoke.browser.spec.ts"
        },
        {
          label: "Export dependency closure",
          href: "src/tutorial/export-dependency-closure.ts"
        },
        {
          label: "Export fallback readiness",
          href: "src/tutorial/export-fallback-readiness.ts"
        },
        {
          label: "Iframe asset manifest",
          href: "src/tutorial/iframe-asset-manifest.ts"
        }
      ],
      risks: [
        "Hosted packaging and production deployment checks still need to prove dependency paths outside the dev server.",
        "GIF, video, and generated media export are still future work after iframe/static-step browser paths.",
        "Visual quality is still smoke-level: tests prove launch, seek metadata, and nonblank panels, not full pixel parity."
      ],
      recommendedNextActions: [
        "Close the browser hardening loop with a concise residual-risk report.",
        "Start GIF or video export sampling from parent timeline frames.",
        "Return to the SemanticObject registry and capability loading layer."
      ],
      tags: [
        "tutorial-card",
        "browser-smoke",
        "launch",
        "export",
        "readiness"
      ],
      projectRefs: [
        {
          kind: "theseus",
          label: "Tutorial-card browser hardening loop",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.tutorial-card-browser-hardening-loop-v0.json",
          id: "run-contract.kp.tutorial-card-browser-hardening-loop-v0"
        }
      ],
      relatedIds: [
        "report-semantic-runtime-readiness",
        "sample-synced-equation-graph-linear-solve",
        "iframe-export-artifact",
        "static-step-export-artifact",
        "semantic-source-file",
        "iframe-asset-manifest",
        "programming-execution-trace-card",
        "synchronized-comparison-card"
      ]
    },
    {
      id: "report-hosted-package-readiness",
      title: "Hosted package readiness",
      status: "active",
      grade: "B+",
      lastReviewedOn: "2026-07-11",
      scope:
        "Assess whether static-hosted iframe and static-step tutorial artifacts can launch outside the dev server with closed dependency paths, fallback metadata, and browser smoke coverage.",
      questions: [
        "Do packaged tutorial entries resolve all iframe and static-step dependencies through relative asset paths?",
        "Do hosted artifacts preserve embed policy, fallback metadata, and static-entry labels for dashboard consumers?",
        "Do browser smoke tests prove the packaged iframe and static-step entries render nonblank tutorial content?"
      ],
      evidence: [
        {
          label: "Hosted artifact readiness contract",
          href: "src/tutorial/hosted-artifact-readiness.ts"
        },
        {
          label: "Static host fixture root",
          href: "src/tutorial/static-host-fixture-root.ts"
        },
        {
          label: "Iframe static asset path closure",
          href: "src/tutorial/iframe-asset-manifest.ts"
        },
        {
          label: "Packaged iframe browser smoke",
          href: "tests/packaged-iframe-smoke.browser.spec.ts"
        },
        {
          label: "Packaged static-step browser smoke",
          href: "tests/packaged-static-step-smoke.browser.spec.ts"
        }
      ],
      risks: [
        "production deployment smoke still needs to prove the same package from an actual hosted URL.",
        "Frame export is not yet sampled from the parent timeline, so hosted readiness currently stops at iframe and static-step artifacts.",
        "The static fixture root is intentionally small; more tutorial cards will need the same dependency-closure gate."
      ],
      recommendedNextActions: [
        "Start parent-timeline frame sampling from the hosted-ready tutorial entries.",
        "Add a production deployment smoke once a hosted URL is available.",
        "Expand the static host fixture root after the first frame-sequence artifact is stable."
      ],
      tags: [
        "tutorial-card",
        "hosted",
        "package",
        "iframe",
        "static-step",
        "readiness"
      ],
      projectRefs: [
        {
          kind: "theseus",
          label: "Hosted package readiness and export sampling loop",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.hosted-package-readiness-export-sampling-v0.json",
          id: "run-contract.kp.hosted-package-readiness-export-sampling-v0"
        }
      ],
      relatedIds: [
        "hosted-artifact-readiness",
        "static-host-fixture-root",
        "iframe-export-artifact",
        "static-step-export-artifact",
        "report-tutorial-launch-readiness"
      ]
    },
    {
      id: "report-capability-loading-readiness",
      title: "Capability loading readiness",
      status: "active",
      grade: "B+",
      lastReviewedOn: "2026-07-11",
      scope:
        "Assess whether KP now has registry-backed SemanticObject capability packages that can drive tutorial dependency planning, dashboard search, and export dependency closure without sample-specific capability advertisements.",
      questions: [
        "Do SemanticObject definitions map to stable capability package manifests with source refs and package ids?",
        "Can tutorial dependency planners resolve capability packages from semantic capability keys?",
        "Do iframe, static-step, and frame-sequence exports carry capability package closure alongside legacy capability keys?",
        "Can the dashboard search and preview package metadata without hand-coded sample-specific rows?"
      ],
      evidence: [
        {
          label: "Capability package manifest catalog",
          href: "src/semantic/capability-package-manifest.ts"
        },
        {
          label: "Semantic object registry package ids",
          href: "src/semantic/object-registry.ts"
        },
        {
          label: "Tutorial dependency planner",
          href: "src/tutorial/dependency-planner.ts"
        },
        {
          label: "Capability package closure helper",
          href: "src/tutorial/capability-package-closure.ts"
        },
        {
          label: "Export dependency closure tests",
          href: "tests/tutorial-card-export-dependency-closure.test.ts"
        },
        {
          label: "Capability package dashboard facets",
          href: "src/project-dashboard/capability-package-facets.ts"
        },
        {
          label: "Capability loading report card review",
          href: "docs/project/reviews/2026-07-11-capability-loading-readiness-report.md"
        }
      ],
      risks: [
        "The dynamic package loader is still deferred; current packages are metadata manifests and closure checks.",
        "Package ids cover core Equation, Matrix, Graph, SourceFile, and export fixtures, not a broad generated math/programming catalog.",
        "Export artifacts validate package closure, but the actual browser/media loading pipeline still consumes bundled local code.",
        "Capability package maturity is strong enough for dashboard planning, but not yet a public extension/package API."
      ],
      recommendedNextActions: [
        "Refresh the roadmap and semantic runtime thread around capability packages as the next stable dependency layer.",
        "Define the first dynamic loader boundary only after the metadata catalog remains stable.",
        "Extend package manifests to generated tutorial families before adding new render domains.",
        "Keep package source refs mandatory for new SemanticObject capability definitions."
      ],
      tags: [
        "semantic-objects",
        "capability-packages",
        "dependency-closure",
        "dashboard",
        "export"
      ],
      projectRefs: [
        {
          kind: "theseus",
          label: "SemanticObject capability loading loop",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.semantic-capability-loading-v0.json",
          id: "run-contract.kp.semantic-capability-loading-v0"
        },
        {
          kind: "review",
          label: "Capability loading readiness report",
          href: "docs/project/reviews/2026-07-11-capability-loading-readiness-report.md"
        }
      ],
      relatedIds: [
        "work-semantic-object-registry",
        "tutorial-card-manifest-v0",
        "iframe-export-artifact",
        "static-step-export-artifact",
        "frame-sequence-export-preview",
        "report-hosted-package-readiness"
      ]
    },
    {
      id: "report-kp-asset-calculus-readiness",
      title: "KP Asset Calculus readiness",
      status: "active",
      grade: "B",
      lastReviewedOn: "2026-07-11",
      scope:
        "Assess whether the new KP Asset Calculus contracts are ready to guide semantic authoring across math, external traces, programming traces, flashcards, dashboard search, and future renderer integrations.",
      questions: [
        "Can authored assets expose objects, transformations, diagrams, behavior, inspection, drill-downs, and flashcards from one source of truth?",
        "Can deterministic external traces import into KP assets with explicit provenance and loss diagnostics?",
        "Can programming execution traces use the same asset, transformation, diagram, and behavior vocabulary as math examples?",
        "Can future Codex sessions discover canonical examples and verification commands through the dashboard?"
      ],
      evidence: [
        {
          label: "KP Asset Calculus readiness report",
          href: "docs/project/reviews/2026-07-11-kp-asset-calculus-readiness-report.md"
        },
        {
          label: "Linear solve asset",
          href: "src/semantic/linear-solve-asset.ts"
        },
        {
          label: "Algebra trace port fixture",
          href: "src/semantic/algebra-trace-port-fixture.ts"
        },
        {
          label: "Program trace asset skeleton",
          href: "src/semantic/program-trace-asset.ts"
        },
        {
          label: "Asset law helpers",
          href: "src/semantic/asset-laws.ts"
        },
        {
          label: "Dashboard artifact rows",
          href: "tests/project-dashboard.test.ts"
        }
      ],
      risks: [
        "Renderer integrations still mostly consume legacy tutorial/card samplers rather than the new asset protocol directly.",
        "The law suite covers determinism, rewind, and port loss diagnostics, but not full associativity, correspondence closure, interpreter composition, or flashcard generation laws.",
        "The external-port story is currently fixture-backed; live CAS, LSP, or runtime adapters may expose ambiguity not yet modeled.",
        "The interfaces are local internal contracts rather than a stable public package API."
      ],
      recommendedNextActions: [
        "Promote the linear-solve renderer path so it consumes the asset bundle, inspection API, drill-down hooks, and flashcards from one source of truth.",
        "Add interpreter contracts for KaTeX frame sampling and dashboard previews before widening the math catalog.",
        "Add law tests for selector correspondence, diagram associativity, flashcard reference closure, and interpreter loss diagnostics.",
        "Keep external ports fixture-first until diagnostics can handle opaque, ambiguous, and lossy live systems."
      ],
      tags: [
        "asset-calculus",
        "semantics",
        "composition",
        "ports",
        "flashcards",
        "programming"
      ],
      projectRefs: [
        {
          kind: "theseus",
          label: "KP Asset Calculus run contract",
          href: "docs/theseus/nodes/run-contracts/run-contract.kp.asset-calculus-denotational-protocol-v0.json",
          id: "run-contract.kp.asset-calculus-denotational-protocol-v0"
        },
        {
          kind: "review",
          label: "KP Asset Calculus readiness report",
          href: "docs/project/reviews/2026-07-11-kp-asset-calculus-readiness-report.md"
        }
      ],
      relatedIds: [
        "work-kp-asset-calculus",
        "asset-linear-solve-bundle",
        "port-algebra-trace-fixture",
        "asset-program-trace-skeleton",
        "asset-linear-solve-flashcards"
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
