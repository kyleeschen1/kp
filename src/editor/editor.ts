import { renderGraphToSvg } from "../rendering/graph-svg.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import { defaultLatexRenderer } from "../rendering/matrix-latex.ts";
import {
  createKpDocument,
  type KpDocument,
  type KpSemanticObject
} from "../semantic/document.ts";
import { createDefaultGraphScene } from "../semantic/graph.ts";
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
      ...createDefaultGraphScene()
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
      <div class="editor-grid">
        <section class="editor-panel" aria-labelledby="source-title">
          <div class="panel-header">
            <h2 id="source-title">Semantic JSON</h2>
            <button class="compile-button" type="button" data-action="compile-document">Compile</button>
          </div>
          ${validationHtml}
          <pre class="json-source"><code>${escapeHtml(JSON.stringify(document, null, 2))}</code></pre>
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
    case "axis-2d":
    case "curve-2d":
      return "";
    case "graph-2d":
      return renderPreviewArticle(
        object,
        "rn-" + object.id + "-svg-preview",
        `<div class="object-preview__graph">${renderGraphToSvg(document.objects, object)}</div>`
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
