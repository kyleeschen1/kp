import {
  createKpNativeKatexConformanceShapeDescriptor,
  createKpNativeKatexConformanceShapeRegistry,
  type KpNativeKatexConformanceShapeDescriptor
} from "../support/native-katex-compositor-conformance-schema.ts";

type ShapeDefinition = Omit<
  KpNativeKatexConformanceShapeDescriptor,
  "schemaVersion"
>;

// One representative per atomic feature keeps promotion diagnostic without
// turning synonymous glyph spellings into an unbounded visual snapshot suite.
const atomicShapeDefinitions = Object.freeze([
  {
    id: "shape.digit-two",
    label: "digit two",
    representativeLatex: "2",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph"]
  },
  {
    id: "shape.italic-x",
    label: "italic variable x",
    representativeLatex: "x",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  },
  {
    id: "shape.descender-g",
    label: "italic descender g",
    representativeLatex: "g",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  },
  {
    id: "shape.greek-lambda",
    label: "Greek lambda",
    representativeLatex: "\\lambda",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  },
  {
    id: "shape.operator-plus",
    label: "addition operator",
    representativeLatex: "+",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph"]
  },
  {
    id: "shape.relation-equals",
    label: "equality relation",
    representativeLatex: "=",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph"]
  },
  {
    id: "shape.punctuation-comma",
    label: "comma punctuation",
    representativeLatex: ",",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph"]
  }
] as const satisfies readonly ShapeDefinition[]);

export const kpNativeKatexAtomicConformanceShapes = Object.freeze(
  atomicShapeDefinitions.map((definition) =>
    createKpNativeKatexConformanceShapeDescriptor(definition))
);

export const kpNativeKatexAtomicConformanceRegistry =
  createKpNativeKatexConformanceShapeRegistry(
    kpNativeKatexAtomicConformanceShapes
  );

