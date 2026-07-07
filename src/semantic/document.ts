export interface KpDocument {
  id: string;
  title: string;
  version: 1;
  objects: readonly KpSemanticObject[];
}

export type KpSemanticObject = MatrixObject;

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
import type { MatrixObject } from "./matrix.ts";
