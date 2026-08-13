import "./programming-surface.css";

import {
  registerKpEditorProgrammingSurfaceAdapter
} from "./programming-surface-adapter.ts";
import {
  registerKpEditorLispMaterialSurfaceAdapter
} from "./lisp-material-surface-adapter.ts";
import {
  registerKpEditorTypeScriptRefactorSurfaceAdapter
} from "./typescript-refactor-surface-adapter.ts";

export function registerKpEditorProgrammingSurfaceCapability(): () => void {
  const disposeTrace = registerKpEditorProgrammingSurfaceAdapter();
  const disposeLisp = registerKpEditorLispMaterialSurfaceAdapter();
  const disposeTypeScript = registerKpEditorTypeScriptRefactorSurfaceAdapter();
  return () => {
    disposeTypeScript();
    disposeLisp();
    disposeTrace();
  };
}
