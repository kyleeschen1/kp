import type { ProjectDashboardData } from "./model.ts";

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
      status: "blocked",
      priority: "high",
      summary:
        "Expose graph surface-mode morphs through the same playhead and sampler vocabulary as equation transitions.",
      tags: ["graph", "webgl", "surface", "timeline"],
      blockers: [
        "Needs shared playhead protocol before graph morph playback can be unified"
      ],
      relatedIds: ["visual-webgl-graph", "gallery-rendering-time-api"]
    },
    {
      id: "work-semantic-object-registry",
      title: "Semantic object registry",
      category: "semantic-object",
      status: "planned",
      priority: "critical",
      summary:
        "Move toward namespaced object records with render, select, transform, execute, compare, diagnose, and link capabilities.",
      tags: ["objects", "selectors", "capabilities", "registry"],
      relatedIds: ["semantic-matrix", "semantic-equation", "semantic-vector"]
    },
    {
      id: "work-project-dashboard-v1",
      title: "Project dashboard v1",
      category: "todo",
      status: "active",
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
      id: "visual-webgl-graph",
      title: "WebGL graph",
      kind: "visual",
      status: "active",
      summary:
        "Interactive graph rendering with retained 3D scene data, surface modes, lighting, and future timeline-controlled morphs.",
      tags: ["graph", "webgl", "surface"],
      domains: ["graphs", "calculus"],
      interfaces: ["camera controls", "surface mode", "render shell"],
      relatedIds: ["work-graph-surface-morphs"]
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
        }
      ],
      risks: [
        "Browser edits are not persistent in v1.",
        "Card status updates still require Codex to edit seed data."
      ],
      recommendedNextActions: [
        "Define the dashboard write protocol.",
        "Add browser coverage for dashboard navigation and editor return."
      ],
      tags: ["dashboard", "codex", "project-health"],
      relatedIds: ["work-project-dashboard-v1"]
    }
  ]
};
