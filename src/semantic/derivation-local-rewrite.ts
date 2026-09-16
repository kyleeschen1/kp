/** Exemplar-local binding contracts. The proof-issued derivation supplies the
 * algebraic authority; these obligations prevent lowering it as generic fusion. */
export type DerivationLocalRewrite =
  | { readonly kind: "equal-term-collection"; readonly anchor: string; readonly duplicate: string;
      readonly coefficient: string; readonly removedSyntax: readonly string[] }
  | { readonly kind: "matched-factor-cancellation"; readonly pair: readonly [string, string];
      readonly survivors: readonly string[] }
  | { readonly kind: "scalar-reassociation"; readonly carrier: string; readonly unit: string; readonly fractionRule: string;
      readonly survivors: readonly string[] };

type Roles = { readonly persist: readonly string[]; readonly exits: readonly string[]; readonly entries: readonly string[] };
export class DerivationLocalRewriteGap extends Error {
  readonly code = "derivation.local-rewrite.invalid-binding";
}

/** Role membership is checked as well as presence. A mass hidden inside an
 * eliminated coefficient is not a surviving factor, even if its glyph returns. */
export function assertDerivationLocalRewrite(rewrite: DerivationLocalRewrite, roles: Roles): void {
  const fail = (reason: string): never => { throw new DerivationLocalRewriteGap(reason); };
  const same = (actual: readonly string[], expected: readonly string[]) =>
    actual.length === expected.length && actual.every(role => expected.includes(role));
  const all = [...roles.persist, ...roles.exits];
  if (new Set(all).size !== all.length || new Set([...roles.persist, ...roles.entries]).size !== roles.persist.length + roles.entries.length)
    fail("A role cannot be both surviving and replaced");
  const bindings = {
    "equal-term-collection": () => {
      if (rewrite.kind !== "equal-term-collection") return;
      if (!roles.persist.includes(rewrite.anchor) || rewrite.anchor === rewrite.duplicate ||
          !same(roles.exits, [rewrite.duplicate, ...rewrite.removedSyntax]) || !same(roles.entries, [rewrite.coefficient]))
        fail("Collection requires an anchored common term, its duplicate, coefficient and exact obsolete syntax");
    },
    "matched-factor-cancellation": () => {
      if (rewrite.kind !== "matched-factor-cancellation") return;
      if (rewrite.pair[0] === rewrite.pair[1] || !same(roles.exits, rewrite.pair) || roles.entries.length ||
          !rewrite.survivors.length || !rewrite.survivors.every(role => roles.persist.includes(role)))
        fail("Cancellation must remove only the matched pair and preserve every declared survivor");
    },
    "scalar-reassociation": () => {
      if (rewrite.kind !== "scalar-reassociation") return;
      if (!roles.persist.includes(rewrite.carrier) || !rewrite.survivors.includes(rewrite.fractionRule) || rewrite.carrier === rewrite.fractionRule || !same(roles.exits, [rewrite.unit]) || roles.entries.length ||
          !rewrite.survivors.every(role => roles.persist.includes(role)))
        fail("Reassociation must carry the expression and retain the denominator; only unit syntax withdraws");
    }
  } satisfies Record<DerivationLocalRewrite["kind"], () => void>;
  const check = bindings[rewrite.kind];
  if (!check) fail("Unsupported local rewrite has no generic-fusion fallback");
  check();
}
