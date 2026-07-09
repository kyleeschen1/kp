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
  type EquationAnimationCatalogEntry
} from "./equation-animation-catalog.ts";
import {
  createKpDocument,
  type KpDocument,
  type KpSemanticObject
} from "../semantic/document.ts";
import { renderApiCatalogOutline } from "./api-catalog.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  createDefaultGraph3DScene,
  type Graph3DSurfaceMode
} from "../semantic/graph.ts";
import type { Graph3DObject, Surface3DObject } from "../semantic/graph.ts";
import { identityMatrix } from "../semantic/matrix.ts";
import { validateKpDocument } from "../semantic/validation.ts";

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
      ...createDefaultGraph3DScene()
    ]
  });
}

export interface EditorRenderOptions {
  readonly katexOperatorScalePercent?: number;
}

export function renderEditorDocument(
  document: KpDocument,
  options: EditorRenderOptions = {}
): string {
  const validationIssues = validateKpDocument(document);
  const katexOperatorScalePercent = normalizeOperatorScalePercent(
    options.katexOperatorScalePercent ?? 85
  );
  const validationHtml =
    validationIssues.length === 0
      ? `<p class="validation-status validation-status--ok">No validation issues</p>`
      : `<ul class="validation-status validation-status--error">${validationIssues
          .map(
            (issue) =>
              `<li><strong>${escapeHtml(issue.path)}</strong>: ${escapeHtml(issue.message)}</li>`
          )
          .join("")}</ul>`;
  const renderedObjects = renderPreviewStage(document, katexOperatorScalePercent);

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
      <div class="equation-entry" data-role="equation-entry">
        <label class="equation-entry__label" for="equation-input">Equation</label>
        <input class="equation-entry__input" id="equation-input" type="text" value="z = \\frac{x^2-y^2}{4}" data-role="equation-input" aria-describedby="equation-error" />
        <button class="equation-entry__button" type="button" data-action="add-equation-graph">Graph</button>
        <output class="equation-entry__error" id="equation-error" data-role="equation-error" aria-live="polite"></output>
      </div>
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
  katexOperatorScalePercent: number
): string {
  let renderedEquationMotionDemo = false;
  const renderedObjects = document.objects.map((object) => {
    const preview = renderObjectPreview(object, document);

    if (!renderedEquationMotionDemo && object.type === "matrix") {
      renderedEquationMotionDemo = true;

      return (
        preview +
        renderEquationMotionDemo() +
        renderKatexVisualTuning(katexOperatorScalePercent)
      );
    }

    return preview;
  });

  if (!renderedEquationMotionDemo) {
    renderedObjects.unshift(
      renderEquationMotionDemo() +
        renderKatexVisualTuning(katexOperatorScalePercent)
    );
  }

  return renderedObjects.join("");
}

function renderKatexVisualTuning(katexOperatorScalePercent: number): string {
  return `
    <section class="katex-visual-tuning" data-kp-visual-tuning data-kp-editor-visual-tuning aria-labelledby="editor-katex-visual-tuning-title">
      <div class="katex-visual-tuning__header">
        <h3 id="editor-katex-visual-tuning-title">Visual Tuning</h3>
        <span>Runtime</span>
      </div>
      <div class="katex-visual-tuning__body">
        <label class="katex-visual-tuning__range" for="editor-katex-operator-scale">
          <span>Operator size</span>
          <input id="editor-katex-operator-scale" type="range" data-action="set-katex-operator-scale" min="50" max="150" step="1" value="${katexOperatorScalePercent}" aria-label="Set KaTeX operator size" />
          <output data-role="katex-operator-scale-output">${katexOperatorScalePercent}%</output>
        </label>
      </div>
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
    case "surface-3d":
      return "";
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
    case "matrix": {
      const latex = defaultLatexRenderer.render(object);
      const html = renderLatexToHtml(latex);

      return renderPreviewArticle(
        object,
        "rn-" + object.id + "-default-latex",
        `<div class="object-preview__math">${html}</div>`
      );
    }
  }
}

function renderEquationMotionDemo(): string {
  const animation = findEquationAnimationCatalogEntry(
    DEFAULT_EQUATION_ANIMATION_ID
  );
  const stateHtml = animation.states
    .map((state) =>
      renderEquationMotionState(
        state.step,
        state.latex,
        state.annotations,
        state.step === 0
      )
    )
    .join("");
  const maxStep = animation.states.length - 1;

  return `
    <section class="equation-motion" data-kp-equation-motion-demo data-kp-equation-animation-id="${escapeHtml(animation.id)}" data-kp-equation-motion-step="0" data-kp-equation-motion-max-step="${maxStep}" data-kp-equation-motion-duration-ms="${animation.defaultDurationMs}" data-kp-equation-motion-collapse-scale-percent="${animation.defaultCollapseScalePercent}">
      ${renderEquationAnimationSelector(animation)}
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
              <input type="range" data-action="set-equation-motion-collapse-scale" min="5" max="50" step="1" value="${animation.defaultCollapseScalePercent}" aria-label="Set equation collapse minimum size" />
              <output class="equation-motion__collapse-scale-output" data-role="equation-motion-collapse-scale-output">${animation.defaultCollapseScalePercent}%</output>
            </label>
          </div>
        </details>
      </div>
    </section>
  `;
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

function renderEquationMotionState(
  step: number,
  latex: string,
  annotations: readonly EquationMotionAnnotation[],
  active: boolean
): string {
  return `
    <div class="equation-motion__state${active ? " equation-motion__state--active" : ""}" data-kp-equation-motion-state="${step}" data-kp-equation-motion-active="${active ? "true" : "false"}" data-kp-equation-motion-latex="${escapeHtml(latex)}" aria-hidden="${active ? "false" : "true"}">
      <!-- Motion IDs live on visible token wrappers so measurement reads rendered boxes, not sidecar anchors. -->
      <div class="equation-motion__formula" aria-label="${escapeHtml(latex)}">
        ${annotations.map(renderEquationMotionAnchor).join("")}
      </div>
    </div>
  `;
}

function renderEquationMotionAnchor(annotation: EquationMotionAnnotation): string {
  const operatorAttribute = isBinaryOperatorToken(annotation.text)
    ? ' data-kp-motion-operator="binary"'
    : "";

  return `<span class="equation-motion__motion-anchor" data-kp-motion-id="${escapeHtml(annotation.motionId)}"${operatorAttribute}>${renderLatexToHtml(annotation.text, { displayMode: false })}</span>`;
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
  body: string
): string {
  return `
    <article class="object-preview" data-kp-object="${escapeHtml(object.id)}" data-kp-render-node="${escapeHtml(renderNodeId)}" data-kp-type="${escapeHtml(object.type)}">
      <div class="object-preview__meta">
        <span>${escapeHtml(object.type)}</span>
        <strong>${escapeHtml(object.id)}</strong>
      </div>
      ${body}
    </article>
  `;
}

function normalizeOperatorScalePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 85;
  }

  return Math.min(150, Math.max(50, Math.round(value)));
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
