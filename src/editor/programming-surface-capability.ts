import "./programming-surface.css";

import {
  registerKpEditorProgrammingSurfaceAdapter
} from "./programming-surface-adapter.ts";

export function registerKpEditorProgrammingSurfaceCapability(): () => void {
  return registerKpEditorProgrammingSurfaceAdapter();
}
