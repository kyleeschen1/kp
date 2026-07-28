import type {
  KpEquationVisiblePaintCertifiedContact
} from "../../src/rendering/equation-visible-paint-overlap.ts";
import type {
  KpNativeKatexSuccessorContactAuthority,
  KpNativeKatexSuccessorMaterialOwnerFrame
} from "../../src/rendering/native-katex-successor-synthesis.ts";

const exactFusion: KpEquationVisiblePaintCertifiedContact = {
  id: "contact.product-to-result",
  ownerIds: ["owner.input", "owner.result"],
  reason: "semantic-fusion",
  phase: "fusion-contact",
  maximumOverlapWidthPx: 8,
  maximumOverlapHeightPx: 12
};

const catalyst: KpNativeKatexSuccessorContactAuthority = {
  synthesisSide: "source",
  contactRole: "catalyst"
};
const input: KpNativeKatexSuccessorContactAuthority = {
  synthesisSide: "source",
  contactRole: "fusion-input"
};
const result: KpNativeKatexSuccessorContactAuthority = {
  synthesisSide: "target",
  contactRole: "fusion-result"
};

// @ts-expect-error A result endpoint can never inherit catalyst authority.
const targetCatalyst: KpNativeKatexSuccessorContactAuthority = {
  synthesisSide: "target",
  contactRole: "catalyst"
};
// @ts-expect-error Only target paint can be certified as the fusion result.
const sourceResult: KpNativeKatexSuccessorContactAuthority = {
  synthesisSide: "source",
  contactRole: "fusion-result"
};
const relationWide: KpEquationVisiblePaintCertifiedContact = {
  id: "contact.relation-wide",
  // @ts-expect-error Every contact certificate must name exactly two owners.
  ownerIds: ["owner.input"],
  reason: "semantic-fusion",
  phase: "fusion-contact",
  maximumOverlapWidthPx: 8,
  maximumOverlapHeightPx: 12
};
declare const sourceElement: HTMLElement;
// @ts-expect-error Catalysts cannot carry material fusion authority.
const catalystFrame: KpNativeKatexSuccessorMaterialOwnerFrame = {
  ownerId: "owner.catalyst",
  sourceElement,
  rect: { left: 0, top: 0, width: 8, height: 8 },
  opacity: 1,
  transform: "none",
  synthesisId: "synthesis.product",
  relationRecordId: "relation.product",
  annotationId: "operator.times",
  synthesisPhase: "converge",
  synthesisSide: "source",
  contactRole: "catalyst",
  semanticContacts: [exactFusion]
};

void [
  exactFusion,
  catalyst,
  input,
  result,
  targetCatalyst,
  sourceResult,
  relationWide,
  catalystFrame
];
