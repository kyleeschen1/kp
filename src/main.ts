import "katex/dist/katex.min.css";
import "./styles.css";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "./editor/editor.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (app === null) {
  throw new Error("Expected #app root element to exist.");
}

app.innerHTML = renderEditorDocument(createInitialEditorDocument());
