interface ApiCatalogItem {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly status: "active" | "planned" | "proposed";
  readonly summary: string;
  readonly tags: readonly string[];
}

interface ApiCatalogGroup {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly items: readonly ApiCatalogItem[];
}

const apiCatalogGroups: readonly ApiCatalogGroup[] = [
  {
    id: "semantic-objects",
    title: "Semantic Objects",
    summary: "Stable values with selectors, capabilities, provenance, and views.",
    items: [
      item("semantic-expression", "Expression", "math-core", "active", "Symbolic expression trees with terms, factors, functions, and grouped structure.", ["math", "selectors"]),
      item("semantic-equation", "Equation", "math-core", "active", "Left/right symbolic relation that can transform into rendered math, graphs, and solution sets.", ["math", "katex"]),
      item("semantic-function", "Function", "math-core", "planned", "Named or anonymous mapping with domain, codomain, parameters, evaluation, graph, and LaTeX views.", ["math", "derive"]),
      item("semantic-matrix", "Matrix", "linear-algebra", "active", "Structured row, column, and entry object with matrix-grid, LaTeX, execution, and linear-map views.", ["linear algebra", "execute"]),
      item("semantic-vector", "Vector", "linear-algebra", "planned", "Coordinate or geometric vector with component selectors and graphical depictions.", ["linear algebra", "graph"]),
      item("semantic-linear-map", "LinearMap", "linear-algebra", "proposed", "Structure-preserving map that can derive a matrix in a selected basis and a geometric deformation view.", ["derive", "matrix"]),
      item("semantic-affine-map", "AffineMap", "linear-algebra", "proposed", "Translation-aware transformation represented with homogeneous matrices when needed.", ["matrix", "graph"]),
      item("semantic-graph-2d", "Graph2D", "graphs", "active", "Axes, curves, points, regions, labels, and symbolic source provenance when available.", ["graph", "latex"]),
      item("semantic-graph-3d", "Graph3D", "graphs", "active", "3D axes, surfaces, curves, camera, lighting, surface modes, and WebGL/SVG render paths.", ["webgl", "surface"]),
      item("semantic-source-file", "SourceFile", "programming", "proposed", "Source text with language, parse anchors, diagnostics, source range selectors, and future execution traces.", ["code", "selectors"]),
      item("semantic-problem", "Problem", "curriculum", "proposed", "Generated or authored exercise with givens, target skills, expected answer type, and rubric.", ["assessment", "generation"]),
      item("semantic-solution", "Solution", "curriculum", "proposed", "Verified derivation made of semantic steps, checks, alternate methods, and common wrong paths.", ["assessment", "provenance"])
    ]
  },
  {
    id: "semantic-transformations",
    title: "Semantic Transformations",
    summary: "Structure-aware operations that produce target objects and correspondence maps.",
    items: [
      item("transform-subtract-both-sides", "subtractBothSides", "equation", "active", "Introduces an inverse term on both sides while preserving equation balance.", ["equation", "algebra"]),
      item("transform-cancel-additive-inverse", "cancelAdditiveInverse", "equation", "active", "Marks inverse-related selectors as cancelled-by before a visual motif removes them.", ["cancelation", "correspondence"]),
      item("transform-evaluate-constant-expression", "evaluateConstantExpression", "algebra", "active", "Evaluates a constant expression such as 7 - 3 into a simplified target object.", ["simplification", "execute"]),
      item("transform-matrix-multiply", "matrixMultiply", "linear-algebra", "proposed", "Composes row-column dot products into a matrix product with step-level provenance.", ["matrix", "dot product"]),
      item("transform-compute-jacobian", "computeJacobian", "calculus", "proposed", "Derives the local linear map for a vector-valued function.", ["calculus", "linearization"]),
      item("transform-compute-hessian", "computeHessian", "calculus", "proposed", "Derives the second-derivative matrix and curvature classification evidence.", ["calculus", "curvature"]),
      item("transform-rename-variable", "renameVariable", "programming", "proposed", "Preserves binding/reference identity while labels change across code views.", ["code", "refactor"])
    ]
  },
  {
    id: "notation-transformations",
    title: "Notation Transformations",
    summary: "Semantic-preserving notation changes that keep the same object identity.",
    items: [
      item("notation-inline-to-stacked-fraction", "inlineFractionToStackedFraction", "fraction", "planned", "Changes inline slash notation into stacked fraction notation while preserving expression identity.", ["katex", "fraction"]),
      item("notation-radical-to-exponent", "radicalToExponent", "radical", "proposed", "Switches between radical notation and exponent notation without creating a new semantic value.", ["katex", "radical", "script"]),
      item("notation-implicit-to-explicit-multiply", "implicitToExplicitMultiplication", "multiplication", "planned", "Adds or removes an explicit multiplication operator while preserving product identity.", ["katex", "operator"])
    ]
  },
  {
    id: "capabilities-representations",
    title: "Capabilities & Representations",
    summary: "Optional object powers that should load lazily by domain and view.",
    items: [
      item("capability-select", "select", "capability", "planned", "Lists and resolves semantic selectors independently from rendered DOM, SVG, or WebGL nodes.", ["selectors", "identity"]),
      item("capability-render", "render", "capability", "active", "Produces render plans for LaTeX, KaTeX, graph, table, code, timeline, and inspector views.", ["view", "renderer"]),
      item("capability-derive", "derive", "capability", "proposed", "Produces alternate semantic representations, such as Function to Graph2D or Rotation to Matrix.", ["representation", "provenance"]),
      item("capability-execute", "execute", "capability", "proposed", "Computes structured semantic results such as determinant, inverse, derivative, sampled grid, or test result.", ["computation", "verification"]),
      item("capability-animate", "animate", "capability", "active", "Compiles transformations, correspondence maps, and layouts into sampleable timelines.", ["timeline", "motion"])
    ]
  },
  {
    id: "motion-primitives",
    title: "Motion Primitives",
    summary: "Reusable visual behavior with no semantic truth by itself.",
    items: [
      item("motion-persist", "persist", "motion", "active", "Keeps selector identity visible while it moves or restyles.", ["identity", "timeline"]),
      item("motion-shift", "shift", "motion", "active", "Moves existing render nodes to new measured positions.", ["layout", "tween"]),
      item("motion-vanish", "vanish", "motion", "active", "Converges source selectors, shrinks to a configured minimum, and fades them away.", ["fade", "cancelation"]),
      item("motion-reveal", "reveal", "motion", "active", "Reverse of vanish for target selectors entering from a shared locus.", ["enter", "tween"]),
      item("motion-morph", "morph", "motion", "planned", "Interpolates compatible geometry such as graph surfaces, curves, or token quads.", ["webgl", "geometry"]),
      item("motion-focus", "focus", "motion", "planned", "Emphasizes a selector without changing the semantic object.", ["attention", "annotation"])
    ]
  },
  {
    id: "visual-motifs",
    title: "Visual Motifs",
    summary: "Named compositions of motion primitives used by transformations.",
    items: [
      item("motif-cancelation", "cancelation", "motif", "active", "Inverse-related tokens meet, shrink, fade, then remaining tokens settle.", ["equation", "particles"]),
      item("motif-simplify-into", "simplify-into", "motif", "active", "Source group vanishes while the target group reveals from the same locus.", ["simplification", "katex"]),
      item("motif-dot-product-accumulate", "dot-product-accumulate", "motif", "proposed", "Component pairs highlight, multiply, and accumulate into a scalar result.", ["vector", "matrix"]),
      item("motif-linear-map-deform", "linear-map-deform", "motif", "proposed", "A basis grid, points, and vectors move under a matrix or linear map.", ["graph", "linear algebra"]),
      item("motif-jacobian-local-linearization", "jacobian-local-linearization", "motif", "proposed", "A nonlinear map freezes at a point and reveals its best local linear approximation.", ["calculus", "graph"]),
      item("motif-execution-step", "execution-step", "motif", "proposed", "Source span, stack frame, locals, heap edges, and output advance together.", ["programming", "trace"])
    ]
  },
  {
    id: "layout-objects",
    title: "Layout Objects",
    summary: "Addressable composition structures for synchronized views and nested cards.",
    items: [
      item("layout-row", "row", "layout", "proposed", "Places child views side by side with stable child selectors.", ["composition", "responsive"]),
      item("layout-column", "column", "layout", "proposed", "Stacks child views vertically for narrow or stepwise explanations.", ["composition", "responsive"]),
      item("layout-stack", "stack", "layout", "proposed", "Layers views, annotations, overlays, and focus states in one stage.", ["overlay", "annotation"]),
      item("layout-grid", "grid", "layout", "proposed", "Arranges repeated cards, matrix-like views, or gallery fixtures.", ["composition", "cards"]),
      item("layout-tabs", "tabs", "layout", "proposed", "Switches between LaTeX, grid, graph, code, and inspector views of the same object.", ["views", "navigation"]),
      item("layout-scroll-sequence", "scroll-sequence", "layout", "proposed", "Maps scroll position onto timeline progress and layout states.", ["timeline", "scroll"]),
      item("layout-synchronized-panel", "synchronized-panel", "layout", "proposed", "Keeps equation, graph, code, and explanation panels on one shared playhead.", ["sync", "playhead"])
    ]
  },
  {
    id: "curriculum-assessment",
    title: "Curriculum & Assessment",
    summary: "The behind-the-scenes learning graph for generation and adaptation.",
    items: [
      item("curriculum-concept", "CurriculumConcept", "curriculum", "proposed", "Concept node with prerequisites, canonical objects, misconceptions, and fixture links.", ["knowledge graph", "learning"]),
      item("curriculum-skill", "Skill", "curriculum", "proposed", "Observable learner capability connected to concepts, problems, and review cards.", ["assessment", "mastery"]),
      item("curriculum-misconception", "Misconception", "curriculum", "proposed", "Known wrong model that can drive diagnosis, hints, and targeted generation.", ["diagnosis", "adaptation"]),
      item("curriculum-problem-template", "ProblemTemplate", "curriculum", "proposed", "Parametric generator that can create verified problem variants.", ["generation", "execute"]),
      item("curriculum-spaced-repetition-card", "SpacedRepetitionCard", "curriculum", "proposed", "Object-backed card with semantic front/back, grading, variants, and scheduler metadata.", ["cards", "memory"]),
      item("curriculum-learner-memory", "LearnerMemory", "curriculum", "proposed", "Learner-state record for strengths, weaknesses, review history, and next-step adaptation.", ["personalization", "review"])
    ]
  },
  {
    id: "embeds-export",
    title: "Embeds & Export",
    summary: "Portable tutorial cards and export profiles for semantic mini tutorials.",
    items: [
      item("embed-kp-card", "KpCard", "embed", "proposed", "Semantic capsule with object graph, layout, timeline, dependency manifest, and fallback render.", ["embed", "manifest"]),
      item("embed-mini-tutorial", "MiniTutorial", "tutorial", "proposed", "Executable semantic tutorial that can render as card, GIF, video, or step sequence.", ["tutorial", "export"]),
      item("embed-tutorial-clip", "TutorialClip", "tutorial", "proposed", "Composable tutorial segment with inputs, outputs, prerequisites, and taught concepts.", ["composition", "timeline"]),
      item("embed-export-profile", "ExportProfile", "export", "proposed", "Output target such as gif-small, video, card, embed, or lesson sequence.", ["gif", "video"]),
      item("embed-dependency-manifest", "DependencyManifest", "runtime", "planned", "Critical, interactive, optional, and fallback dependency closure for each card or route.", ["lazy loading", "runtime"])
    ]
  }
];

export function renderApiCatalogOutline(): string {
  return `
    <div class="api-outline" data-kp-api-outline>
      <div class="api-outline__body">
        ${apiCatalogGroups.map(renderApiCatalogGroup).join("")}
      </div>
      <article class="api-outline__sample-card" data-kp-api-sample-card aria-live="polite">
        <p class="api-outline__sample-eyebrow" data-role="api-outline-sample-eyebrow">Sample card preview</p>
        <h3 data-role="api-outline-sample-title">Select an API item to preview its future sample card</h3>
        <p data-role="api-outline-sample-summary">These outline entries will become clickable cards for examples, controls, fixtures, and docs as the API catalog hardens.</p>
        <div class="api-outline__sample-tags" data-role="api-outline-sample-tags"></div>
      </article>
    </div>
  `;
}

export function selectApiCatalogItem(button: HTMLButtonElement): void {
  const outline = button.closest<HTMLElement>("[data-kp-api-outline]");

  if (outline === null) {
    return;
  }

  const selectedId = button.dataset["kpApiOutlineItem"];
  const card = outline.querySelector<HTMLElement>("[data-kp-api-sample-card]");

  if (selectedId === undefined || card === null) {
    return;
  }

  outline.dataset["kpApiCatalogSelected"] = selectedId;

  outline
    .querySelectorAll<HTMLButtonElement>("[data-kp-api-outline-item]")
    .forEach((candidate) => {
      const selected = candidate === button;

      candidate.setAttribute("aria-pressed", selected ? "true" : "false");
      candidate.classList.toggle("api-outline__item--selected", selected);
    });

  setText(card, "api-outline-sample-eyebrow", "Sample card preview");
  setText(card, "api-outline-sample-title", button.dataset["kpApiItemTitle"]);
  setText(
    card,
    "api-outline-sample-summary",
    button.dataset["kpApiItemSummary"]
  );

  const tags = card.querySelector<HTMLElement>(
    '[data-role="api-outline-sample-tags"]'
  );

  if (tags !== null) {
    const tagValues = (button.dataset["kpApiItemTags"] ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    tags.replaceChildren(
      ...tagValues.map((tag) => {
        const badge = document.createElement("span");

        badge.textContent = tag;
        return badge;
      })
    );
  }
}

function renderApiCatalogGroup(group: ApiCatalogGroup): string {
  return `
        <details class="api-outline__group" data-kp-api-outline-group="${escapeHtml(group.id)}" open>
          <summary class="api-outline__group-summary">
            <span>${escapeHtml(group.title)}</span>
            <small>${group.items.length} items</small>
          </summary>
          <p class="api-outline__group-description">${escapeHtml(group.summary)}</p>
          <div class="api-outline__items">
            ${group.items.map(renderApiCatalogItem).join("")}
          </div>
        </details>
  `;
}

function renderApiCatalogItem(item: ApiCatalogItem): string {
  return `
            <button class="api-outline__item" type="button" data-action="select-api-outline-item" data-kp-api-outline-item="${escapeHtml(item.id)}" data-kp-api-item-title="${escapeHtml(item.title)}" data-kp-api-item-kind="${escapeHtml(item.kind)}" data-kp-api-item-summary="${escapeHtml(item.summary)}" data-kp-api-item-tags="${escapeHtml(item.tags.join(","))}" aria-pressed="false">
              <span class="api-outline__item-main">${escapeHtml(item.title)}</span>
              <span class="api-outline__item-meta">${escapeHtml(item.kind)} / ${escapeHtml(item.status)}</span>
            </button>
  `;
}

function item(
  id: string,
  title: string,
  kind: string,
  status: ApiCatalogItem["status"],
  summary: string,
  tags: readonly string[]
): ApiCatalogItem {
  return {
    id,
    title,
    kind,
    status,
    summary,
    tags
  };
}

function setText(root: ParentNode, role: string, value: string | undefined): void {
  const element = root.querySelector<HTMLElement>(
    `[data-role="${CSS.escape(role)}"]`
  );

  if (element !== null) {
    element.textContent = value ?? "";
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}
