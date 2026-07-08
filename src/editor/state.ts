import type { KpDocument, KpSemanticObject } from "../semantic/document.ts";
import { createGraphSceneFromLatexEquation } from "../semantic/equation-graph.ts";
import {
  createSaddleSurface3D,
  type Surface3DObject
} from "../semantic/graph.ts";

export const SADDLE_DENOMINATOR_MIN = 1;
export const SADDLE_DENOMINATOR_MAX = 16;

export type Graph3DLightScalarSetting = "ambient" | "diffuse" | "depthHaze";

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

export function updateGraph3DLightSetting(
  document: KpDocument,
  graphId: string,
  setting: Graph3DLightScalarSetting,
  value: number
): KpDocument {
  const nextValue = clamp(value, 0, 1);

  return {
    ...document,
    objects: document.objects.map((object): KpSemanticObject => {
      if (object.type !== "graph-3d" || object.id !== graphId) {
        return object;
      }

      return {
        ...object,
        light: {
          ...object.light,
          [setting]: nextValue
        }
      };
    })
  };
}

export function updateSaddleSurfaceDenominator(
  document: KpDocument,
  surfaceId: string,
  denominator: number
): KpDocument {
  const nextDenominator = clamp(
    denominator,
    SADDLE_DENOMINATOR_MIN,
    SADDLE_DENOMINATOR_MAX
  );

  return {
    ...document,
    objects: document.objects.map((object): KpSemanticObject => {
      if (
        object.type !== "surface-3d" ||
        object.id !== surfaceId ||
        object.parameterization?.kind !== "saddle"
      ) {
        return object;
      }

      return rebuildSaddleSurface(object, nextDenominator);
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

function rebuildSaddleSurface(
  surface: Surface3DObject,
  denominator: number
): Surface3DObject {
  return createSaddleSurface3D({
    id: surface.id,
    graphId: surface.graphId,
    denominator,
    xDomain: surface.xDomain,
    yDomain: surface.yDomain,
    xSampleCount: surface.xSampleCount,
    ySampleCount: surface.ySampleCount
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
