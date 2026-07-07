import {
  occludedAxisColor,
  renderGraph3DToSvg,
  renderGraphToSvg
} from "../rendering/graph-svg.ts";
import {
  SADDLE_DENOMINATOR_MAX,
  SADDLE_DENOMINATOR_MIN
} from "./state.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import { defaultLatexRenderer } from "../rendering/matrix-latex.ts";
import {
  createKpDocument,
  type KpDocument,
  type KpSemanticObject
} from "../semantic/document.ts";
import {
  DEFAULT_OCCLUDED_AXIS_LIGHTNESS,
  createDefaultGraph3DScene,
  createDefaultGraphScene
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
      ...createDefaultGraphScene(),
      ...createDefaultGraph3DScene()
    ]
  });
}

export function renderEditorDocument(document: KpDocument): string {
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
  const renderedObjects = document.objects
    .map((object) => renderObjectPreview(object, document))
    .join("");

  return `
    <section class="editor-shell" aria-label="Kinetic Press editor">
      <header class="editor-header">
        <div>
          <p class="eyebrow">Semantic Editor</p>
          <h1>${escapeHtml(document.title)}</h1>
        </div>
        <span class="status-pill">JSON to HTML</span>
      </header>
      <div class="equation-entry" data-role="equation-entry">
        <label class="equation-entry__label" for="equation-input">Equation</label>
        <input class="equation-entry__input" id="equation-input" type="text" value="z = \\frac{x^2-y^2}{4}" data-role="equation-input" aria-describedby="equation-error" />
        <button class="equation-entry__button" type="button" data-action="add-equation-graph">Graph</button>
        <output class="equation-entry__error" id="equation-error" data-role="equation-error" aria-live="polite"></output>
      </div>
      <div class="editor-grid">
        <section class="editor-panel" aria-labelledby="source-title">
          <div class="panel-header">
            <h2 id="source-title">Semantic JSON</h2>
            <button class="compile-button" type="button" data-action="compile-document">Compile</button>
          </div>
          ${validationHtml}
          <pre class="json-source"><code data-role="semantic-json">${escapeHtml(JSON.stringify(document, null, 2))}</code></pre>
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
        "rn-" + object.id + "-svg-preview",
        `${renderGraph3DControls(object, document.objects)}<div class="object-preview__graph">${renderGraph3DToSvg(document.objects, object)}</div>`
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
      <label class="graph-control" for="${escapeHtml(occludedAxisInputId)}">
        <span class="graph-control__label">occluded axes</span>
        <input class="graph-control__range" id="${escapeHtml(occludedAxisInputId)}" type="range" min="0" max="100" step="1" value="${formattedOccludedAxisLightness}" data-action="set-graph-occluded-axis-lightness" data-graph-id="${escapeHtml(graph.id)}" data-kp-graph-color-target="occluded-axis" aria-label="Set occluded axis lightness" />
        <output class="graph-control__value" for="${escapeHtml(occludedAxisInputId)}">${escapeHtml(occludedAxisHex)}</output>
      </label>
      ${saddleSurface === undefined ? "" : renderSaddleDenominatorControl(graph, saddleSurface)}
    </div>
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

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3);
}
