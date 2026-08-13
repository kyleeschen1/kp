import "katex/dist/katex.min.css";

import {
  registerKpEditorEquationSurfaceAdapter
} from "./equation-surface-adapter.ts";
import { prepareKpEditorKatexFonts } from "./katex-font-capability.ts";

export async function registerKpEditorEquationSurfaceCapability():
Promise<() => void> {
  await prepareKpEditorKatexFonts();
  return registerKpEditorEquationSurfaceAdapter();
}
