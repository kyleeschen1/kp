import "./programming-surface.css";

import {
  registerKpEditorProgrammingSurfaceAdapter
} from "./programming-surface-adapter.ts";
import {
  registerKpEditorLispMaterialSurfaceAdapter
} from "./lisp-material-surface-adapter.ts";

export function registerKpEditorProgrammingSurfaceCapability(): () => void {
  const disposeTrace = registerKpEditorProgrammingSurfaceAdapter();
  const disposeLisp = registerKpEditorLispMaterialSurfaceAdapter();
  return () => {
    disposeLisp();
    disposeTrace();
  };
}
