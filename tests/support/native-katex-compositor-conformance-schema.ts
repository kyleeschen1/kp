export const KP_NATIVE_KATEX_CONFORMANCE_SHAPE_SCHEMA_VERSION =
  "kp.native-katex-conformance-shape.v1" as const;

export type KpNativeKatexConformanceShapeClass =
  | "atomic-glyph"
  | "rule"
  | "script"
  | "vertical-list"
  | "delimiter"
  | "accent"
  | "multirow-compound";

export type KpNativeKatexConformancePaintClass =
  | "atomic-text"
  | "rule"
  | "subtree"
  | "vector-paint";

export const kpNativeKatexConformanceRiskTagOrder = Object.freeze([
  "glyph",
  "rule",
  "script",
  "vertical-list",
  "delimiter",
  "multirow",
  "font-style"
] as const);

export type KpNativeKatexConformanceRiskTag =
  typeof kpNativeKatexConformanceRiskTagOrder[number];

export interface KpNativeKatexConformanceShapeDescriptor {
  readonly schemaVersion:
    typeof KP_NATIVE_KATEX_CONFORMANCE_SHAPE_SCHEMA_VERSION;
  readonly id: `shape.${string}`;
  readonly label: string;
  readonly representativeLatex: string;
  readonly shapeClass: KpNativeKatexConformanceShapeClass;
  readonly paintClass: KpNativeKatexConformancePaintClass;
  readonly ownershipGrain: "leaf" | "compound";
  readonly baseline: "required" | "not-applicable";
  readonly riskTags: readonly KpNativeKatexConformanceRiskTag[];
}

export interface KpNativeKatexConformanceShapeRegistry {
  readonly kind: "native-katex-conformance-shape-registry";
  readonly descriptors: readonly KpNativeKatexConformanceShapeDescriptor[];
  readonly byId: ReadonlyMap<
    KpNativeKatexConformanceShapeDescriptor["id"],
    KpNativeKatexConformanceShapeDescriptor
  >;
}

export function createKpNativeKatexConformanceShapeDescriptor(
  input: Omit<KpNativeKatexConformanceShapeDescriptor, "schemaVersion">
): KpNativeKatexConformanceShapeDescriptor {
  requireText(input.id, "shape id");
  requireText(input.label, `${input.id} label`);
  requireText(input.representativeLatex, `${input.id} representative LaTeX`);
  if (input.paintClass === "atomic-text" && input.baseline !== "required") {
    throw new Error(`${input.id} atomic text requires a baseline.`);
  }
  if (input.paintClass === "rule" && input.baseline !== "not-applicable") {
    throw new Error(`${input.id} rule paint cannot claim a text baseline.`);
  }
  if (
    input.shapeClass === "atomic-glyph" &&
    (input.paintClass !== "atomic-text" || input.ownershipGrain !== "leaf")
  ) {
    throw new Error(
      `${input.id} atomic glyphs require leaf-owned atomic text paint.`
    );
  }
  if (
    input.shapeClass === "multirow-compound" &&
    input.ownershipGrain !== "compound"
  ) {
    throw new Error(`${input.id} multirow shapes require compound ownership.`);
  }
  if (new Set(input.riskTags).size !== input.riskTags.length) {
    throw new Error(`${input.id} risk tags must be unique.`);
  }
  const requiredRiskTag = riskTagForShapeClass(input.shapeClass);
  if (!input.riskTags.includes(requiredRiskTag)) {
    throw new Error(
      `${input.id} ${input.shapeClass} requires the ${requiredRiskTag} risk tag.`
    );
  }
  const riskOrder = new Map(
    kpNativeKatexConformanceRiskTagOrder.map((tag, index) => [tag, index])
  );
  return Object.freeze({
    schemaVersion: KP_NATIVE_KATEX_CONFORMANCE_SHAPE_SCHEMA_VERSION,
    ...input,
    riskTags: Object.freeze([...input.riskTags].sort((left, right) =>
      riskOrder.get(left)! - riskOrder.get(right)!
    ))
  });
}

export function createKpNativeKatexConformanceShapeRegistry(
  descriptors: readonly KpNativeKatexConformanceShapeDescriptor[]
): KpNativeKatexConformanceShapeRegistry {
  if (descriptors.length === 0) {
    throw new Error("Native KaTeX conformance requires at least one shape.");
  }
  const byId = new Map(descriptors.map((descriptor) => [
    descriptor.id,
    descriptor
  ]));
  if (byId.size !== descriptors.length) {
    throw new Error("Native KaTeX conformance shape IDs must be unique.");
  }
  return Object.freeze({
    kind: "native-katex-conformance-shape-registry" as const,
    descriptors: Object.freeze([...descriptors]),
    byId
  });
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must be non-empty.`);
}

function riskTagForShapeClass(
  shapeClass: KpNativeKatexConformanceShapeClass
): KpNativeKatexConformanceRiskTag {
  switch (shapeClass) {
    case "atomic-glyph": return "glyph";
    case "rule": return "rule";
    case "script": return "script";
    case "vertical-list": return "vertical-list";
    case "delimiter": return "delimiter";
    case "accent": return "glyph";
    case "multirow-compound": return "multirow";
  }
}
