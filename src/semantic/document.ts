import type {
  Axis2DObject,
  Axis3DObject,
  Curve2DObject,
  Curve3DObject,
  Graph2DObject,
  Graph3DObject,
  Surface3DObject
} from "./graph.ts";
import type { MatrixObject } from "./matrix.ts";

export interface KpDocument {
  id: string;
  title: string;
  version: 1;
  objects: readonly KpSemanticObject[];
}

export type KpSemanticObject =
  | Axis2DObject
  | Axis3DObject
  | Curve2DObject
  | Curve3DObject
  | Graph2DObject
  | Graph3DObject
  | Surface3DObject
  | MatrixObject;

interface CreateKpDocumentInput {
  id: string;
  title: string;
  objects?: readonly KpSemanticObject[];
}

export function createKpDocument(input: CreateKpDocumentInput): KpDocument {
  return {
    id: input.id,
    title: input.title,
    version: 1,
    objects: input.objects ?? []
  };
}
