import { renderEditorDocument } from "../editor/editor.ts";
import type { KpDocument } from "../semantic/document.ts";

export function compileHtmlFragment(document: KpDocument): string {
  return renderEditorDocument(document);
}

export function compileHtmlDocument(document: KpDocument): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(document.title)}</title>
  </head>
  <body data-kp-document="${escapeHtml(document.id)}">
    ${compileHtmlFragment(document)}
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;"
  ).replaceAll('"', "&quot;");
}
