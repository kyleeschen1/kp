import "katex/dist/katex.min.css";
import "./styles.css";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "./editor/editor.ts";
import { compileDocumentAsset } from "./editor/compile-client.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Expected #app root element to exist.");
}

const editorDocument = createInitialEditorDocument();

app.innerHTML = renderEditorDocument(editorDocument);

const compileButton = app.querySelector<HTMLButtonElement>(
  '[data-action="compile-document"]'
);
const compiledSource = app.querySelector<HTMLPreElement>("#compiled-source");

compileButton?.addEventListener("click", () => {
  void compileDocumentAsset(editorDocument)
    .then((html) => {
      if (compiledSource !== null) {
        compiledSource.textContent = html;
      }
    })
    .catch((error: unknown) => {
      if (compiledSource !== null) {
        compiledSource.textContent =
          error instanceof Error ? error.message : "Compile request failed.";
      }
    });
});
