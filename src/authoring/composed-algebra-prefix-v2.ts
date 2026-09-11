import { sha256 } from "../kernel/public-api.ts";
import { checkKpComposedAlgebraProof, type KpSourceBoundComposedAlgebraProof } from "./composed-algebra-proof.ts";
import { readKpComposedAlgebraSourceV2, type KpComposedAlgebraSourceV2 } from "./composed-algebra-source-v2.ts";

const brand = Symbol("checked-extended-algebra-prefix");
const issued = new WeakSet<object>();

/** Only the first two deductions are proved here. Later source states remain
 * candidates until their own operation owners and the connected chain accept them. */
export interface KpCheckedComposedAlgebraPrefixV2 {
  readonly [brand]: true;
  readonly source: KpComposedAlgebraSourceV2;
  readonly prefix: KpSourceBoundComposedAlgebraProof;
  readonly revisionId: string;
}

export function checkKpComposedAlgebraPrefixV2(value: unknown): KpCheckedComposedAlgebraPrefixV2 {
  const source = readKpComposedAlgebraSourceV2(value);
  const prefix = checkKpComposedAlgebraProof({ ...source, schemaVersion: "kp.composed-algebra-source.v1",
    states: [source.states[0], source.states[1], source.states[2]] });
  const checked: KpCheckedComposedAlgebraPrefixV2 = Object.freeze({ [brand]: true as const, source, prefix,
    revisionId: `sha256:${sha256(JSON.stringify({ source, prefixRevision: prefix.revisionId }))}` });
  issued.add(checked);
  return checked;
}

export function assertKpCheckedComposedAlgebraPrefixV2(value: unknown): asserts value is KpCheckedComposedAlgebraPrefixV2 {
  if (typeof value !== "object" || value === null || !issued.has(value))
    throw new TypeError("Recheck the extended source to obtain issued prefix evidence.");
}
