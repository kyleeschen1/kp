export interface KpDocument {
  id: string;
  title: string;
  version: 1;
  objects: readonly KpSemanticObject[];
}

export type KpSemanticObject = never;

interface CreateKpDocumentInput {
  id: string;
  title: string;
}

export function createKpDocument(input: CreateKpDocumentInput): KpDocument {
  return {
    id: input.id,
    title: input.title,
    version: 1,
    objects: []
  };
}
