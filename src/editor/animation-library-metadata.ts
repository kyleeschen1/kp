import generatedMetadata from "./animation-library-metadata.generated.json" with {
  type: "json"
};
import {
  createKpEditorAnimationDescriptor,
  type CreateKpEditorAnimationDescriptorInput,
  type KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export function createKpEditorAnimationMetadataLibrary():
  readonly KpEditorAnimationDescriptor[] {
  // Generation validates this projection against concrete assets in tests. The
  // runtime reads only this compact record instead of constructing semantic
  // bundles merely to populate an animation picker.
  const records = generatedMetadata as unknown as readonly
    CreateKpEditorAnimationDescriptorInput[];
  return records.map(createKpEditorAnimationDescriptor);
}
