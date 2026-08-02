import "katex/dist/katex.min.css";

import {
  registerKpEditorEquationSurfaceAdapter
} from "./equation-surface-adapter.ts";

export function registerKpEditorEquationSurfaceCapability(): () => void {
  return registerKpEditorEquationSurfaceAdapter();
}
