import type { KpDocument, KpSemanticObject } from "../semantic/document.ts";
import { createGraphSceneFromLatexEquation } from "../semantic/equation-graph.ts";

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

export function updateGraph3DOccludedAxisLightness(
  document: KpDocument,
  graphId: string,
  lightness: number
): KpDocument {
  const nextLightness = clamp(lightness, 0, 100);

  return {
    ...document,
    objects: document.objects.map((object): KpSemanticObject => {
      if (object.type !== "graph-3d" || object.id !== graphId) {
        return object;
      }

      return {
        ...object,
        occludedAxisLightness: nextLightness
      };
    })
  };
}

export function addLatexEquationGraph(
  document: KpDocument,
  latex: string
): KpDocument {
  const idPrefix = `equation-${nextEquationGraphIndex(document)}`;
  const objects = createGraphSceneFromLatexEquation({
    idPrefix,
    latex
  });

  return {
    ...document,
    objects: [...document.objects, ...objects]
  };
}

function nextEquationGraphIndex(document: KpDocument): number {
  const existingIndices = document.objects.flatMap((object) => {
    const match = /^equation-(\d+)-/.exec(object.id);
    const index = match?.[1] === undefined ? undefined : Number(match[1]);

    return index === undefined || !Number.isInteger(index) ? [] : [index];
  });

  return Math.max(0, ...existingIndices) + 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
