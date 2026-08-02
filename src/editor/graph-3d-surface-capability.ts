import {
  registerKpEditorGraph3DSurfaceAdapter
} from "./graph-3d-surface-adapter.ts";

export function registerKpEditorGraph3DSurfaceCapability(): () => void {
  return registerKpEditorGraph3DSurfaceAdapter();
}
