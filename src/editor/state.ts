import type { KpDocument } from "../semantic/document.ts";

export interface EditorState {
  document: KpDocument;
  selectedObjectId: string | null;
}

export function createEditorState(document: KpDocument): EditorState {
  return {
    document,
    selectedObjectId: document.objects[0]?.id ?? null
  };
}
