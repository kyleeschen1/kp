/** Bounded real-scalar collect/evaluate/distribute authoring. This entrypoint
 * changes vocabulary, not proof authority, source schemas or supported moves.
 * Keep it separate from mathematical matrices and browser renderer imports. */
export {
  prepareKpComposedAlgebraDraftV2 as compile,
  checkKpComposedAlgebraDraftV2 as check,
  exportKpComposedAlgebraSourceV2 as serialize,
  createKpComposedAlgebraAuthoringSessionV2 as session
} from "./composed-algebra-session-v2.ts";
export {
  readKpComposedAlgebraSourceV2 as read,
  parseKpComposedAlgebraSourceV2 as parse,
  type KpComposedAlgebraSourceV2 as Source
} from "./composed-algebra-source-v2.ts";
export { type KpComposedAlgebraPresentationV2 as Presentation } from "./composed-algebra-presentation-v2.ts";
export { KpComposedAlgebraRepair as Repair } from "./composed-algebra-source.ts";
