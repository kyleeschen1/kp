import type { KpDocument, KpSemanticObject } from "../semantic/document.ts";
import { createGraphSceneFromLatexEquation } from "../semantic/equation-graph.ts";
import {
  DEFAULT_GRAPH_3D_LIGHT_SETTINGS,
  createSaddleSurface3D,
  type Graph3DLightSettings,
  type Surface3DObject
} from "../semantic/graph.ts";

export const SADDLE_DENOMINATOR_MIN = 1;
export const SADDLE_DENOMINATOR_MAX = 16;

export const GRAPH_3D_LIGHT_PRESET_IDS = [
  "studio",
  "raking",
  "flat"
] as const;

export type Graph3DLightPresetId = typeof GRAPH_3D_LIGHT_PRESET_IDS[number];
export type Graph3DLightScalarSetting =
  | "ambient"
  | "diffuse"
  | "depthHaze"
  | "specular"
  | "rim";

export const GRAPH_3D_LIGHT_PRESETS: Record<
  Graph3DLightPresetId,
  Graph3DLightSettings
> = {
  studio: DEFAULT_GRAPH_3D_LIGHT_SETTINGS,
  raking: {
    direction: { x: -0.85, y: -0.25, z: 0.45 },
    ambient: 0.3,
    diffuse: 0.65,
    depthHaze: 1,
    specular: 0.22,
    rim: 0.12
  },
  flat: {
    direction: { x: -0.35, y: -0.45, z: 0.82 },
    ambient: 0.65,
    diffuse: 0.08,
    depthHaze: 0.35,
    specular: 0.02,
    rim: 0.02
  }
};

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

export function applyGraph3DLightPreset(
  document: KpDocument,
  graphId: string,
  presetId: Graph3DLightPresetId
): KpDocument {
  const preset = GRAPH_3D_LIGHT_PRESETS[presetId];

  return {
    ...document,
    objects: document.objects.map((object): KpSemanticObject => {
      if (object.type !== "graph-3d" || object.id !== graphId) {
        return object;
      }

      return {
        ...object,
        light: cloneLightSettings(preset)
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

export function findGraph3DLightPresetId(
  light: Graph3DLightSettings
): Graph3DLightPresetId | undefined {
  return GRAPH_3D_LIGHT_PRESET_IDS.find((presetId) =>
    graph3DLightSettingsEqual(light, GRAPH_3D_LIGHT_PRESETS[presetId])
  );
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

function cloneLightSettings(light: Graph3DLightSettings): Graph3DLightSettings {
  return {
    direction: { ...light.direction },
    ambient: light.ambient,
    diffuse: light.diffuse,
    depthHaze: light.depthHaze,
    specular: light.specular,
    rim: light.rim
  };
}

function graph3DLightSettingsEqual(
  left: Graph3DLightSettings,
  right: Graph3DLightSettings
): boolean {
  return (
    left.direction.x === right.direction.x &&
    left.direction.y === right.direction.y &&
    left.direction.z === right.direction.z &&
    left.ambient === right.ambient &&
    left.diffuse === right.diffuse &&
    left.depthHaze === right.depthHaze &&
    left.specular === right.specular &&
    left.rim === right.rim
  );
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
