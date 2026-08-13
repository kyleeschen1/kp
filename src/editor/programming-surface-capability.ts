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
import {
  registerKpEditorPythonRefactorSurfaceAdapter
} from "./python-refactor-surface-adapter.ts";
import {
  registerKpEditorSchemeFactorialSurfaceAdapter
} from "./scheme-factorial-surface-adapter.ts";

export function registerKpEditorProgrammingSurfaceCapability(): () => void {
  const disposeTrace = registerKpEditorProgrammingSurfaceAdapter();
  const disposeLisp = registerKpEditorLispMaterialSurfaceAdapter();
  const disposeTypeScript = registerKpEditorTypeScriptRefactorSurfaceAdapter();
  const disposePython = registerKpEditorPythonRefactorSurfaceAdapter();
  const disposeScheme = registerKpEditorSchemeFactorialSurfaceAdapter();
  return () => {
    disposeScheme();
    disposePython();
    disposeTypeScript();
    disposeLisp();
    disposeTrace();
  };
}
