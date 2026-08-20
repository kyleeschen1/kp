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

const scriptStyleShapeDefinitions = Object.freeze([
  {
    id: "shape.script.superscript-two",
    label: "superscript digit two",
    representativeLatex: "x^{2}",
    shapeClass: "script",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "script"]
  },
  {
    id: "shape.script.subscript-i",
    label: "subscript italic i",
    representativeLatex: "x_{i}",
    shapeClass: "script",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "script"]
  },
  {
    id: "shape.style.roman-x",
    label: "roman variable x",
    representativeLatex: "\\mathrm{x}",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  },
  {
    id: "shape.style.bold-x",
    label: "bold variable x",
    representativeLatex: "\\mathbf{x}",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  },
  {
    id: "shape.style.calligraphic-f",
    label: "calligraphic F",
    representativeLatex: "\\mathcal{F}",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  },
  {
    id: "shape.style.monospace-x",
    label: "monospace variable x",
    representativeLatex: "\\mathtt{x}",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "font-style"]
  }
] as const satisfies readonly ShapeDefinition[]);

// Structured representatives name the paint/ownership seam that actually
// needs pressure; their internal glyph spellings are not separate scenarios.
const structuredShapeDefinitions = Object.freeze([
  {
    id: "shape.structure.fraction",
    label: "stacked fraction",
    representativeLatex: "\\frac{1}{2}",
    shapeClass: "vertical-list",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["rule", "vertical-list"]
  },
  {
    id: "shape.structure.root",
    label: "square root",
    representativeLatex: "\\sqrt{x}",
    shapeClass: "vertical-list",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["rule", "vertical-list"]
  },
  {
    id: "shape.structure.rule",
    label: "standalone rule",
    representativeLatex: "\\rule{1em}{0.04em}",
    shapeClass: "rule",
    paintClass: "rule",
    ownershipGrain: "leaf",
    baseline: "not-applicable",
    riskTags: ["rule"]
  },
  {
    id: "shape.structure.accent",
    label: "accented variable",
    representativeLatex: "\\hat{x}",
    shapeClass: "accent",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["glyph"]
  },
  {
    id: "shape.structure.fixed-delimiter",
    label: "fixed parenthesis pair",
    representativeLatex: "(x)",
    shapeClass: "delimiter",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["delimiter"]
  },
  {
    id: "shape.structure.stretchy-delimiter",
    label: "stretchy parenthesis pair",
    representativeLatex: "\\left(\\frac{1}{2}\\right)",
    shapeClass: "delimiter",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["rule", "vertical-list", "delimiter"]
  }
] as const satisfies readonly ShapeDefinition[]);

const matrixShapeDefinitions = Object.freeze([
  {
    id: "shape.matrix.whole-2x2",
    label: "whole two by two matrix",
    representativeLatex: "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}",
    shapeClass: "multirow-compound",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["vertical-list", "delimiter", "multirow"]
  },
  {
    id: "shape.matrix.heterogeneous-2x2",
    label: "heterogeneous two by two matrix",
    representativeLatex:
      "\\begin{pmatrix}x&\\frac{1}{2}\\\\g&y^{2}\\end{pmatrix}",
    shapeClass: "multirow-compound",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: [
      "glyph",
      "rule",
      "script",
      "vertical-list",
      "delimiter",
      "multirow",
      "font-style"
    ]
  }
] as const satisfies readonly ShapeDefinition[]);

const compoundShapeDefinitions = Object.freeze([
  {
    id: "shape.compound.large-operator",
    label: "large operator with limits",
    representativeLatex: "\\sum_{i=1}^{n}x_i",
    shapeClass: "vertical-list",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["glyph", "script", "vertical-list", "font-style"]
  },
  {
    id: "shape.compound.cases",
    label: "two-row cases expression",
    representativeLatex:
      "\\begin{cases}x,&x>0\\\\-x,&x\\leq0\\end{cases}",
    shapeClass: "multirow-compound",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: [
      "glyph",
      "vertical-list",
      "delimiter",
      "multirow",
      "font-style"
    ]
  },
  {
    id: "shape.compound.aligned",
    label: "two-row aligned expression",
    representativeLatex:
      "\\begin{aligned}x&=1\\\\y&=2\\end{aligned}",
    shapeClass: "multirow-compound",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["glyph", "vertical-list", "multirow", "font-style"]
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

export const kpNativeKatexScriptStyleConformanceShapes = Object.freeze(
  scriptStyleShapeDefinitions.map((definition) =>
    createKpNativeKatexConformanceShapeDescriptor(definition))
);

export const kpNativeKatexStructuredConformanceShapes = Object.freeze(
  structuredShapeDefinitions.map((definition) =>
    createKpNativeKatexConformanceShapeDescriptor(definition))
);

export const kpNativeKatexMatrixConformanceShapes = Object.freeze(
  matrixShapeDefinitions.map((definition) =>
    createKpNativeKatexConformanceShapeDescriptor(definition))
);

export const kpNativeKatexCompoundConformanceShapes = Object.freeze(
  compoundShapeDefinitions.map((definition) =>
    createKpNativeKatexConformanceShapeDescriptor(definition))
);

export const kpNativeKatexConformanceShapeRegistry =
  createKpNativeKatexConformanceShapeRegistry([
    ...kpNativeKatexAtomicConformanceShapes,
    ...kpNativeKatexScriptStyleConformanceShapes,
    ...kpNativeKatexStructuredConformanceShapes,
    ...kpNativeKatexMatrixConformanceShapes,
    ...kpNativeKatexCompoundConformanceShapes
  ]);
