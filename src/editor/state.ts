import type { KpDocument, KpSemanticObject } from "../semantic/document.ts";

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

export function updateGraph3DAzimuth(
  document: KpDocument,
  graphId: string,
  azimuthDegrees: number
): KpDocument {
  const nextAzimuthDegrees = clamp(azimuthDegrees, -180, 180);

  return {
    ...document,
    objects: document.objects.map((object): KpSemanticObject => {
      if (object.type !== "graph-3d" || object.id !== graphId) {
        return object;
      }

      return {
        ...object,
        camera: {
          ...object.camera,
          azimuthDegrees: nextAzimuthDegrees
        }
      };
    })
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
