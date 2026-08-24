import "katex/dist/katex.min.css";
import "./graph-3d-saddle-parameter-surface.css";

import {
  registerKpEditorGraph3DSurfaceAdapter
} from "./graph-3d-surface-adapter.ts";
import {
  registerKpEditorGraph3DSaddleSurfaceAdapter
} from "./graph-3d-saddle-parameter-surface-adapter.ts";
import { prepareKpEditorKatexFonts } from "./katex-font-capability.ts";

export async function registerKpEditorGraph3DSurfaceCapability():
Promise<() => void> {
  await prepareKpEditorKatexFonts();
  const disposeLegacy = registerKpEditorGraph3DSurfaceAdapter();
  try {
    const disposeSaddle = registerKpEditorGraph3DSaddleSurfaceAdapter();
    return () => {
      disposeSaddle();
      disposeLegacy();
    };
  } catch (error: unknown) {
    disposeLegacy();
    throw error;
  }
}
