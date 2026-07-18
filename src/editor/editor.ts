import {
  occludedAxisColor,
  renderGraphToSvg
} from "../rendering/graph-svg.ts";
import { renderGraph3DWebGLShell } from "../rendering/graph-webgl.ts";
import {
  GRAPH_3D_LIGHT_PRESET_IDS,
  GRAPH_3D_SURFACE_MODE_IDS,
  GRAPH_3D_SURFACE_QUALITY_IDS,
  GRAPH_3D_VIEW_MODE_IDS,
  findGraph3DLightPresetId,
  SADDLE_DENOMINATOR_MAX,
  SADDLE_DENOMINATOR_MIN,
  type Graph3DLightPresetId,
  type Graph3DLightScalarSetting
} from "./state.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import { defaultLatexRenderer } from "../rendering/matrix-latex.ts";
import type { EquationMotionAnnotation } from "../math/equation-transform.ts";
import {
  DEFAULT_EQUATION_ANIMATION_ID,
  equationAnimationCatalogEntries,
  findEquationAnimationCatalogEntry,
  type EquationAnimationCatalogEntry,
  type EquationAnimationState,
  type EquationAnimationStructuralMotionAnnotation
} from "./equation-animation-catalog.ts";
import {
  createKpDocument,
  type KpDocument,
  type KpSemanticObject
} from "../semantic/document.ts";
import type { ExpressionObject } from "../semantic/expression-object.ts";
import { renderApiCatalogOutline } from "./api-catalog.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  createDefaultGraph3DScene,
  type Graph3DSurfaceMode
} from "../semantic/graph.ts";
import type { Graph3DObject, Surface3DObject } from "../semantic/graph.ts";
import {
  createLatexComparisonObject,
  createLatexFormObject,
  type LatexComparisonObject,
  type LatexFormObject
} from "../semantic/latex-form.ts";
import { identityMatrix } from "../semantic/matrix.ts";
import { validateKpDocument } from "../semantic/validation.ts";
import {
  createKpEditorAnimationLibrary,
  selectKpEditorAnimationDescriptor
} from "./animation-library.ts";
import {
  createKpEditorAnimationPickerModel,
  renderKpEditorAnimationPicker
} from "./animation-picker.ts";
import {
  dispatchKpEditorAnimationSurface
} from "./animation-surface-dispatch.ts";
import {
  renderKpEditorAnimationDiagnosticsLoading
} from "./animation-diagnostics.ts";
import {
  renderKpEditorAnimationPlayerShell
} from "./animation-player-shell.ts";

export function createInitialEditorDocument(): KpDocument {
  return createKpDocument({
    id: "identity-matrix-demo",
    title: "Identity Matrix",
    objects: [
      identityMatrix({
        id: "identity-3x3",
        label: "I_3",
        size: 3
      }),
      createLatexFormObject({
        id: "formula-ftc-derivative",
        label: "FTC: derivative form",
        latex: String.raw`\frac{d}{dx}\int_{a}^{x} f(t)\,dt = f(x)`,
        summary:
          "The derivative of an accumulation function recovers the integrand.",
        tags: ["calculus", "fundamental theorem"]
      }),
      createLatexFormObject({
        id: "formula-ftc-net-change",
        label: "FTC: net change form",
        latex: String.raw`\int_{a}^{b} f'(x)\,dx = f(b)-f(a)`,
        summary:
          "A definite integral of a derivative measures total change.",
        tags: ["calculus", "fundamental theorem"]
      }),
      createLatexFormObject({
        id: "formula-fourier-transform",
        label: "Fourier transform",
        latex:
          String.raw`\widehat{f}(\xi)=\mathcal{F}\{f\}(\xi)=\int_{-\infty}^{\infty} f(x)e^{-2\pi i x\xi}\,dx`,
        summary:
          "Represents a function by its frequency-domain components.",
        tags: ["analysis", "fourier"]
      }),
      createLatexFormObject({
        id: "formula-inverse-fourier-transform",
        label: "Inverse Fourier transform",
        latex:
          String.raw`f(x)=\int_{-\infty}^{\infty}\widehat{f}(\xi)e^{2\pi i x\xi}\,d\xi`,
        summary:
          "Reconstructs the original function from its frequency representation.",
        tags: ["analysis", "fourier"]
      }),
      createLatexFormObject({
        id: "formula-jacobian",
        label: "Jacobian",
        latex:
          String.raw`J_f(x)=\begin{bmatrix}\frac{\partial f_1}{\partial x_1} & \cdots & \frac{\partial f_1}{\partial x_n}\\ \vdots & \ddots & \vdots\\ \frac{\partial f_m}{\partial x_1} & \cdots & \frac{\partial f_m}{\partial x_n}\end{bmatrix}`,
        summary:
          "A first-derivative matrix for vector-valued functions.",
        tags: ["calculus", "linear algebra", "jacobian"]
      }),
      createLatexFormObject({
        id: "formula-hessian",
        label: "Hessian",
        latex:
          String.raw`H_f(x)=\begin{bmatrix}\frac{\partial^2 f}{\partial x_1^2} & \cdots & \frac{\partial^2 f}{\partial x_1\partial x_n}\\ \vdots & \ddots & \vdots\\ \frac{\partial^2 f}{\partial x_n\partial x_1} & \cdots & \frac{\partial^2 f}{\partial x_n^2}\end{bmatrix}`,
        summary:
          "A second-derivative matrix for scalar-valued functions.",
        tags: ["calculus", "linear algebra", "hessian"]
      }),
      createLatexComparisonObject({
        id: "comparison-jacobian-hessian",
        label: "Jacobian / Hessian",
        formIds: ["formula-jacobian", "formula-hessian"],
        summary: "Compare first- and second-derivative matrix forms."
      }),
      ...createDefaultGraph3DScene()
    ]
  });
}

export interface EditorRenderOptions {
  readonly equationAnimationId?: string | undefined;
  readonly editorAnimationDescriptorId?: string | undefined;
}

export function renderEditorDocument(
  document: KpDocument,
  options: EditorRenderOptions = {}
): string {
  const validationIssues = validateKpDocument(document);
  const validationHtml =
    validationIssues.length === 0
      ? `<p class="validation-status validation-status--ok">No validation issues</p>`
      : `<ul class="validation-status validation-status--error">${validationIssues
          .map(
            (issue) =>
              `<li><strong>${escapeHtml(issue.path)}</strong>: ${escapeHtml(issue.message)}</li>`
          )
          .join("")}</ul>`;
  const renderedObjects = renderPreviewStage(
    document,
    options.equationAnimationId,
    options.editorAnimationDescriptorId
  );

  return `
    <section class="editor-shell" aria-label="Kinetic Press editor">
      <header class="editor-header">
        <div>
          <p class="eyebrow">Semantic Editor</p>
          <h1>${escapeHtml(document.title)}</h1>
        </div>
        <div class="editor-header__actions">
          <button class="editor-header__button" type="button" data-action="show-project-dashboard">Project Dashboard</button>
          <span class="status-pill">Semantic API</span>
        </div>
      </header>
      <div class="editor-grid">
        <section class="editor-panel" aria-labelledby="api-outline-title">
          <div class="panel-header">
            <h2 id="api-outline-title">API Outline</h2>
            <button class="compile-button" type="button" data-action="compile-document">Compile</button>
          </div>
          ${validationHtml}
          ${renderApiCatalogOutline()}
        </section>
        <section class="editor-panel" aria-labelledby="preview-title">
          <div class="panel-header">
            <h2 id="preview-title">Rendered Asset</h2>
          </div>
          <div class="preview-stage">${renderedObjects}</div>
          <pre class="compiled-source" id="compiled-source" aria-live="polite"></pre>
        </section>
      </div>
    </section>
  `;
}

function renderPreviewStage(
  document: KpDocument,
  equationAnimationId: string | undefined,
  editorAnimationDescriptorId: string | undefined
): string {
  return [
    renderEditorAnimationLibrary(editorAnimationDescriptorId),
    renderEquationMotionDemo(equationAnimationId),
    ...document.objects.map((object) => renderObjectPreview(object, document))
  ].join("");
}

function renderEditorAnimationLibrary(
  requestedDescriptorId: string | undefined
): string {
  const descriptors = createKpEditorAnimationLibrary();
  const selected = selectKpEditorAnimationDescriptor(
    descriptors,
    requestedDescriptorId
  );
  const picker = createKpEditorAnimationPickerModel({
    descriptors,
    selectedDescriptorId: selected.id
  });
  const surface = dispatchKpEditorAnimationSurface(selected);

  return `
    <section class="editor-animation-library" data-kp-editor-animation-library data-kp-editor-animation-descriptor-id="${escapeHtml(selected.id)}" data-kp-editor-animation-id="${escapeHtml(selected.animationId)}" data-kp-editor-animation-surface="${escapeHtml(surface.kind)}" data-kp-editor-animation-maturity="${selected.promotion?.maturity ?? "unclassified"}" data-kp-editor-animation-novelty="${selected.promotion?.novelty ?? "unclassified"}" data-kp-editor-animation-gold-cohort="${selected.promotion?.goldCohort === true}" aria-labelledby="editor-animation-library-title">
      ${renderKpEditorAnimationPicker(picker)}
      <div class="editor-animation-library__selection">
        <p class="eyebrow">Concrete animation asset</p>
        <h3 id="editor-animation-library-title">${escapeHtml(selected.title)}</h3>
        <p>${escapeHtml(selected.summary)}</p>
        <dl>
          <div><dt>Surface</dt><dd>${escapeHtml(surface.kind)}</dd></div>
          <div><dt>Animation ID</dt><dd>${escapeHtml(selected.animationId)}</dd></div>
          ${selected.familyId === undefined ? "" : `<div><dt>Family</dt><dd>${escapeHtml(selected.familyId)}</dd></div>`}
        </dl>
      </div>
      ${renderKpEditorAnimationPlayerShell({ descriptor: selected })}
      ${renderKpEditorAnimationDiagnosticsLoading(selected)}
    </section>
  `;
}

function renderObjectPreview(object: KpSemanticObject, document: KpDocument): string {
  switch (object.type) {
    case "animation-intent":
    case "axis-2d":
    case "axis-3d":
    case "curve-2d":
    case "curve-3d":
    case "source-file":
    case "surface-3d":
      return "";
    case "expression":
      return renderExpressionPreview(object);
    case "latex-comparison":
      return renderLatexComparisonPreview(object, document.objects);
    case "latex-form":
      if (isLatexFormReferencedByComparison(object.id, document.objects)) {
        return "";
      }

      return renderLatexFormPreview(object);
    case "graph-2d":
      return renderPreviewArticle(
        object,
        "rn-" + object.id + "-svg-preview",
        `<div class="object-preview__graph">${renderGraphToSvg(document.objects, object)}</div>`
      );
    case "graph-3d":
      return renderPreviewArticle(
        object,
        "rn-" + object.id + "-webgl-preview",
        `${renderGraph3DControls(object, document.objects)}<div class="object-preview__graph">${renderGraph3DWebGLShell(document.objects, object)}</div>`
      );
    case "linear-map":
    case "matrix":
      return "";
  }
}

function renderExpressionPreview(object: ExpressionObject): string {
  const latex = defaultLatexRenderer.render(object);
  const html = renderLatexToHtml(latex);

  return renderPreviewArticle(
    object,
    "rn-" + object.id + "-default-latex",
    `<div class="object-preview__math">${html}</div>`
  );
}

function renderLatexFormPreview(object: LatexFormObject): string {
  const latex = defaultLatexRenderer.render(object);
  const html = renderLatexToHtml(latex);

  return renderPreviewArticle(
    object,
    "rn-" + object.id + "-default-latex",
    `<div class="object-preview__math">${html}</div>`
  );
}

function renderLatexComparisonPreview(
  comparison: LatexComparisonObject,
  objects: readonly KpSemanticObject[]
): string {
  const forms = comparison.formIds
    .map((formId) => findLatexForm(objects, formId))
    .filter((form): form is LatexFormObject => form !== undefined);

  return renderPreviewArticle(
    comparison,
    "rn-" + comparison.id + "-comparison-card",
    `
      <div class="object-preview__summary">
        <h3>${escapeHtml(comparison.label)}</h3>
        <p>${escapeHtml(comparison.summary)}</p>
      </div>
      <div class="object-preview__comparison">
        ${forms
          .map((form) => {
            const html = renderLatexToHtml(defaultLatexRenderer.render(form));

            return `
              <div class="object-preview__comparison-item" data-kp-comparison-item="${escapeHtml(form.id)}">
                <h3>${escapeHtml(form.label)}</h3>
                <div class="object-preview__math">${html}</div>
                <p>${escapeHtml(form.summary)}</p>
              </div>
            `;
          })
          .join("")}
      </div>
    `,
    { wide: true }
  );
}

function isLatexFormReferencedByComparison(
  formId: string,
  objects: readonly KpSemanticObject[]
): boolean {
  return objects.some(
    (object) =>
      object.type === "latex-comparison" && object.formIds.includes(formId)
  );
}

function findLatexForm(
  objects: readonly KpSemanticObject[],
  formId: string
): LatexFormObject | undefined {
  return objects.find(
    (object): object is LatexFormObject =>
      object.type === "latex-form" && object.id === formId
  );
}

function renderEquationMotionDemo(equationAnimationId: string | undefined): string {
  const animation = selectEquationAnimation(equationAnimationId);
  const stateHtml = animation.states
    .map((state) =>
      renderEquationMotionState(
        state,
        state.step === 0
      )
    )
    .join("");
  const maxStep = animation.states.length - 1;

  return `
    <section class="equation-motion" data-kp-equation-motion-demo data-kp-equation-animation-id="${escapeHtml(animation.id)}" data-kp-equation-motion-step="0" data-kp-equation-motion-max-step="${maxStep}" data-kp-equation-motion-duration-ms="${animation.defaultDurationMs}" data-kp-equation-motion-collapse-scale-percent="${animation.defaultCollapseScalePercent}" tabindex="0" aria-label="Equation animation card">
      ${renderEquationAnimationSelector(animation)}
      ${renderEquationAnimationKeyboardPicker(animation)}
      <div class="equation-motion__stage">
        ${stateHtml}
      </div>
      <div class="equation-motion__controls">
        <div class="equation-motion__step-controls" data-kp-equation-motion-step-controls>
          <button type="button" data-action="equation-motion-rewind">Back</button>
          <button type="button" data-action="equation-motion-next">Forward</button>
        </div>
        <details class="equation-motion__settings" data-kp-equation-motion-settings>
          <summary>Timing controls</summary>
          <div class="equation-motion__settings-body">
            <label class="equation-motion__scrubber">
              <span>Beat</span>
              <input type="range" data-action="set-equation-motion-beat" min="0" max="${animation.beatCount}" step="1" value="0" data-kp-equation-motion-beats="${animation.beatCount}" aria-label="Scrub equation motion beat" />
              <output class="equation-motion__beat-output" data-role="equation-motion-beat-output">0/${animation.beatCount}</output>
            </label>
            <label class="equation-motion__scrubber equation-motion__duration">
              <span>Duration</span>
              <input type="range" data-action="set-equation-motion-duration" min="200" max="3000" step="20" value="${animation.defaultDurationMs}" aria-label="Set equation animation duration" />
              <output class="equation-motion__duration-output" data-role="equation-motion-duration-output">${animation.defaultDurationMs} ms</output>
            </label>
            <label class="equation-motion__scrubber equation-motion__collapse-scale">
              <span>Min size</span>
              <input type="range" data-action="set-equation-motion-collapse-scale" min="0" max="50" step="1" value="${animation.defaultCollapseScalePercent}" aria-label="Set equation collapse minimum size" />
              <output class="equation-motion__collapse-scale-output" data-role="equation-motion-collapse-scale-output">${animation.defaultCollapseScalePercent}%</output>
            </label>
          </div>
        </details>
      </div>
    </section>
  `;
}

function selectEquationAnimation(
  equationAnimationId: string | undefined
): EquationAnimationCatalogEntry {
  if (equationAnimationId === undefined) {
    return findEquationAnimationCatalogEntry(DEFAULT_EQUATION_ANIMATION_ID);
  }

  try {
    return findEquationAnimationCatalogEntry(equationAnimationId);
  } catch {
    return findEquationAnimationCatalogEntry(DEFAULT_EQUATION_ANIMATION_ID);
  }
}

function renderEquationAnimationSelector(
  selectedAnimation: EquationAnimationCatalogEntry
): string {
  return `
    <label class="equation-motion__selector" data-kp-equation-animation-selector>
      <span>Animation</span>
      <select data-action="set-equation-motion-animation" aria-label="Select equation animation">
        ${equationAnimationCatalogEntries
          .map(
            (entry) =>
              `<option value="${escapeHtml(entry.id)}"${entry.id === selectedAnimation.id ? " selected" : ""}>${escapeHtml(entry.label)}</option>`
          )
          .join("")}
      </select>
    </label>
  `;
}

function renderEquationAnimationKeyboardPicker(
  selectedAnimation: EquationAnimationCatalogEntry
): string {
  return `
    <div class="equation-motion__keyboard-picker" data-kp-equation-animation-picker role="listbox" aria-label="Animation picker" hidden>
      ${equationAnimationCatalogEntries
        .map(
          (entry, index) =>
            `<div class="equation-motion__keyboard-picker-option" id="equation-motion-picker-${escapeHtml(entry.id)}" data-kp-equation-animation-picker-option data-kp-equation-animation-id="${escapeHtml(entry.id)}" data-kp-equation-animation-index="${index}" role="option" aria-selected="${entry.id === selectedAnimation.id ? "true" : "false"}">${escapeHtml(entry.label)}</div>`
        )
        .join("")}
    </div>
  `;
}

function renderEquationMotionState(
  state: EquationAnimationState,
  active: boolean
): string {
  const formulaHtml = renderEquationMotionFormula(state);

  return `
    <div class="equation-motion__state${active ? " equation-motion__state--active" : ""}" data-kp-equation-motion-state="${state.step}" data-kp-equation-motion-active="${active ? "true" : "false"}" data-kp-equation-motion-latex="${escapeHtml(state.latex)}" aria-hidden="${active ? "false" : "true"}">
      <!-- Motion IDs live on visible token wrappers so measurement reads rendered boxes, not sidecar anchors. -->
      <div class="equation-motion__formula" aria-label="${escapeHtml(state.latex)}">
        ${formulaHtml}
      </div>
    </div>
  `;
}

function renderEquationMotionFormula(state: EquationAnimationState): string {
  if (state.renderLatex === undefined) {
    return state.annotations.map(renderEquationMotionAnchor).join("");
  }

  const html = renderLatexToHtml(state.renderLatex, {
    displayMode: false,
    trust: true
  });

  return applyStructuralMotionAnnotations(
    html,
    state.structuralMotionAnnotations ?? []
  );
}

function renderEquationMotionAnchor(annotation: EquationMotionAnnotation): string {
  const operatorAttribute = isBinaryOperatorToken(annotation.text)
    ? ' data-kp-motion-operator="binary"'
    : "";

  return `<span class="equation-motion__motion-anchor" data-kp-motion-id="${escapeHtml(annotation.motionId)}"${operatorAttribute}>${renderLatexToHtml(annotation.text, { displayMode: false })}</span>`;
}

function applyStructuralMotionAnnotations(
  html: string,
  annotations: readonly EquationAnimationStructuralMotionAnnotation[]
): string {
  return annotations.reduce(
    (nextHtml, annotation) =>
      annotation.selector === "frac-line"
        ? nextHtml.replace(
            'class="frac-line"',
            `class="frac-line" data-kp-motion-id="${escapeHtml(annotation.motionId)}"`
          )
        : annotation.selector === "hide-tail"
          ? nextHtml.replace(
              'class="hide-tail"',
              `class="hide-tail" data-kp-motion-id="${escapeHtml(annotation.motionId)}"`
            )
        : nextHtml,
    html
  );
}

function isBinaryOperatorToken(text: string): boolean {
  return ["+", "-", "*", "\\cdot", "\\times"].includes(text);
}

function renderGraph3DControls(
  graph: Graph3DObject,
  objects: readonly KpSemanticObject[]
): string {
  const azimuthInputId = "control-" + graph.id + "-azimuth";
  const occludedAxisInputId = "control-" + graph.id + "-occluded-axis-lightness";
  const saddleSurface = findSaddleSurfaceForGraph(objects, graph.id);
  const azimuth = formatNumber(graph.camera.azimuthDegrees);
  const occludedAxisLightness =
    graph.occludedAxisLightness ?? DEFAULT_OCCLUDED_AXIS_LIGHTNESS;
  const formattedOccludedAxisLightness = formatNumber(occludedAxisLightness);
  const occludedAxisHex = occludedAxisColor(occludedAxisLightness);

  return `
    <div class="graph-controls" data-kp-object="${escapeHtml(graph.id)}" data-kp-type="graph-view-controls">
      <label class="graph-control" for="${escapeHtml(azimuthInputId)}">
        <span class="graph-control__label">z rotation</span>
        <input class="graph-control__range" id="${escapeHtml(azimuthInputId)}" type="range" min="-180" max="180" step="1" value="${azimuth}" data-action="set-graph-azimuth" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-rotation-axis="z" aria-label="Rotate graph around z-axis" />
        <output class="graph-control__value" for="${escapeHtml(azimuthInputId)}">${azimuth} deg</output>
      </label>
      ${renderGraphViewModeControl(graph)}
      ${renderGraphSurfaceModeControl(graph)}
      <details class="graph-controls__foldout" data-kp-controls-foldout="render-settings">
        <summary class="graph-controls__summary">Render settings</summary>
        <div class="graph-controls__foldout-body">
          ${renderGraphSurfaceQualityControl(graph)}
          <label class="graph-control" for="${escapeHtml(occludedAxisInputId)}">
            <span class="graph-control__label">occluded axes</span>
            <input class="graph-control__range" id="${escapeHtml(occludedAxisInputId)}" type="range" min="0" max="100" step="1" value="${formattedOccludedAxisLightness}" data-action="set-graph-occluded-axis-lightness" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-color-target="occluded-axis" aria-label="Set occluded axis lightness" />
            <output class="graph-control__value" for="${escapeHtml(occludedAxisInputId)}">${escapeHtml(occludedAxisHex)}</output>
          </label>
          ${renderGraphLightPresetControl(graph)}
          ${renderGraphLightScalarControl(graph, "ambient", "ambient light")}
          ${renderGraphLightScalarControl(graph, "diffuse", "diffuse light")}
          ${renderGraphLightScalarControl(graph, "depthHaze", "depth haze")}
          ${renderGraphLightScalarControl(graph, "specular", "specular")}
          ${renderGraphLightScalarControl(graph, "rim", "rim")}
          ${renderGraphShadowEnabledControl(graph)}
          ${renderGraphShadowOpacityControl(graph)}
          ${saddleSurface === undefined ? "" : renderSaddleDenominatorControl(graph, saddleSurface)}
        </div>
      </details>
    </div>
  `;
}

function renderGraphViewModeControl(graph: Graph3DObject): string {
  const inputId = `control-${graph.id}-view-mode`;
  const options = GRAPH_3D_VIEW_MODE_IDS.map((mode) =>
    renderGraphViewModeOption(mode, graph.viewMode)
  ).join("");

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">view</span>
        <select class="graph-control__select" id="${escapeHtml(inputId)}" data-action="set-graph-view-mode" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-view-mode="${escapeHtml(graph.viewMode)}" aria-label="Set graph view mode">
          ${options}
        </select>
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${escapeHtml(graph.viewMode)}</output>
      </label>
  `;
}

function renderGraphViewModeOption(
  mode: Graph3DObject["viewMode"],
  selectedMode: Graph3DObject["viewMode"]
): string {
  const selected = mode === selectedMode ? " selected" : "";

  return `<option value="${escapeHtml(mode)}"${selected}>${escapeHtml(mode)}</option>`;
}

function renderGraphSurfaceModeControl(graph: Graph3DObject): string {
  const inputId = `control-${graph.id}-surface-mode`;
  const options = GRAPH_3D_SURFACE_MODE_IDS.map((mode) =>
    renderGraphSurfaceModeOption(mode, graph.surfaceMode)
  ).join("");

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">surface mode</span>
        <select class="graph-control__select" id="${escapeHtml(inputId)}" data-action="set-graph-surface-mode" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-surface-mode="${escapeHtml(graph.surfaceMode)}" aria-label="Set graph surface mode">
          ${options}
        </select>
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${escapeHtml(graph.surfaceMode)}</output>
      </label>
  `;
}

function renderGraphSurfaceModeOption(
  mode: Graph3DSurfaceMode,
  selectedMode: Graph3DSurfaceMode
): string {
  const selected = mode === selectedMode ? " selected" : "";

  return `<option value="${escapeHtml(mode)}"${selected}>${escapeHtml(mode)}</option>`;
}

function renderGraphSurfaceQualityControl(graph: Graph3DObject): string {
  const inputId = `control-${graph.id}-surface-quality`;
  const options = GRAPH_3D_SURFACE_QUALITY_IDS.map((quality) =>
    renderGraphSurfaceQualityOption(quality, graph.surfaceQuality)
  ).join("");

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">surface detail</span>
        <select class="graph-control__select" id="${escapeHtml(inputId)}" data-action="set-graph-surface-quality" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-surface-quality="${escapeHtml(graph.surfaceQuality)}" aria-label="Set graph surface detail">
          ${options}
        </select>
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${escapeHtml(graph.surfaceQuality)}</output>
      </label>
  `;
}

function renderGraphSurfaceQualityOption(
  quality: Graph3DObject["surfaceQuality"],
  selectedQuality: Graph3DObject["surfaceQuality"]
): string {
  const selected = quality === selectedQuality ? " selected" : "";

  return `<option value="${escapeHtml(quality)}"${selected}>${escapeHtml(quality)}</option>`;
}

function renderGraphLightPresetControl(graph: Graph3DObject): string {
  const inputId = `control-${graph.id}-light-preset`;
  const selectedPresetId = findGraph3DLightPresetId(graph.light);
  const selectedValue = selectedPresetId ?? "custom";
  const options = [
    `<option value="custom"${selectedValue === "custom" ? " selected" : ""}>custom</option>`,
    ...GRAPH_3D_LIGHT_PRESET_IDS.map((presetId) =>
      renderGraphLightPresetOption(presetId, selectedValue)
    )
  ].join("");

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">light preset</span>
        <select class="graph-control__select" id="${escapeHtml(inputId)}" data-action="set-graph-light-preset" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-light-preset="${escapeHtml(selectedValue)}" aria-label="Set graph light preset">
          ${options}
        </select>
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${escapeHtml(selectedValue)}</output>
      </label>
  `;
}

function renderGraphLightPresetOption(
  presetId: Graph3DLightPresetId,
  selectedValue: string
): string {
  const selected = presetId === selectedValue ? " selected" : "";

  return `<option value="${escapeHtml(presetId)}"${selected}>${escapeHtml(presetId)}</option>`;
}

function renderGraphLightScalarControl(
  graph: Graph3DObject,
  setting: Graph3DLightScalarSetting,
  label: string
): string {
  const inputId = `control-${graph.id}-light-${setting}`;
  const value = formatNumber(graph.light[setting]);

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">${escapeHtml(label)}</span>
        <input class="graph-control__range" id="${escapeHtml(inputId)}" type="range" min="0" max="1" step="0.01" value="${value}" data-action="set-graph-light-setting" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-light-setting="${escapeHtml(setting)}" aria-label="Set ${escapeHtml(label)}" />
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${value}</output>
      </label>
  `;
}

function renderGraphShadowEnabledControl(graph: Graph3DObject): string {
  const inputId = `control-${graph.id}-shadow-enabled`;
  const checked = graph.shadow.enabled ? " checked" : "";
  const value = graph.shadow.enabled ? "on" : "off";

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">shadow</span>
        <input class="graph-control__checkbox" id="${escapeHtml(inputId)}" type="checkbox"${checked} data-action="set-graph-shadow-enabled" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-shadow-setting="enabled" aria-label="Toggle graph shadow" />
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${value}</output>
      </label>
  `;
}

function renderGraphShadowOpacityControl(graph: Graph3DObject): string {
  const inputId = `control-${graph.id}-shadow-opacity`;
  const value = formatNumber(graph.shadow.opacity);

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">shadow opacity</span>
        <input class="graph-control__range" id="${escapeHtml(inputId)}" type="range" min="0" max="1" step="0.01" value="${value}" data-action="set-graph-shadow-opacity" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-shadow-setting="opacity" aria-label="Set graph shadow opacity" />
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${value}</output>
      </label>
  `;
}

function renderSaddleDenominatorControl(
  graph: Graph3DObject,
  surface: Surface3DObject
): string {
  const inputId = "control-" + surface.id + "-saddle-denominator";
  const denominator = surface.parameterization?.denominator ?? 4;
  const formattedDenominator = formatNumber(denominator);

  return `
      <label class="graph-control" for="${escapeHtml(inputId)}">
        <span class="graph-control__label">saddle denominator</span>
        <input class="graph-control__range" id="${escapeHtml(inputId)}" type="range" min="${SADDLE_DENOMINATOR_MIN}" max="${SADDLE_DENOMINATOR_MAX}" step="0.25" value="${formattedDenominator}" data-action="set-saddle-denominator" data-graph-id="${escapeHtml(graph.id)}" data-surface-id="${escapeHtml(surface.id)}" data-kp-graph-surface-parameter="saddle-denominator" aria-label="Set saddle denominator" />
        <output class="graph-control__value" for="${escapeHtml(inputId)}">${formattedDenominator}</output>
      </label>
  `;
}

function findSaddleSurfaceForGraph(
  objects: readonly KpSemanticObject[],
  graphId: string
): Surface3DObject | undefined {
  return objects.find(
    (object): object is Surface3DObject =>
      object.type === "surface-3d" &&
      object.graphId === graphId &&
      object.parameterization?.kind === "saddle"
  );
}

function renderPreviewArticle(
  object: KpSemanticObject,
  renderNodeId: string,
  body: string,
  options: { readonly wide?: boolean } = {}
): string {
  return `
    <article class="object-preview${options.wide === true ? " object-preview--wide" : ""}" data-kp-object="${escapeHtml(object.id)}" data-kp-render-node="${escapeHtml(renderNodeId)}" data-kp-type="${escapeHtml(object.type)}">
      <div class="object-preview__meta">
        <span>${escapeHtml(object.type)}</span>
        <strong>${escapeHtml(object.id)}</strong>
      </div>
      ${body}
    </article>
  `;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}
