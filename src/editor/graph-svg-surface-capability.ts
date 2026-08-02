import "katex/dist/katex.min.css";

import {
  registerKpEditorGraphSvgViewportAdapter
} from "./graph-svg-viewport.ts";

export function registerKpEditorGraphSvgSurfaceCapability(): () => void {
  return registerKpEditorGraphSvgViewportAdapter();
}
