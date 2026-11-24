import * as M from "../../math/authoring/matrices.ts";
import { compileExpression } from "../../math/expression.ts";
import { sha256 } from "../../kernel/public-api.ts";
import { parse, read, Repair } from "./source.ts";
import { assertMatrixColumnNumerals } from './numeric-support.ts';

const issued = new WeakSet<object>();
export type Draft = ReturnType<typeof compile>;
export function assertDraft(value: Draft): void {
  if (!issued.has(value)) throw new TypeError("Compile matrix source before using its derived presentation.");
}
export function serialize(draft: Draft): string {
  assertDraft(draft);
  return `${JSON.stringify(draft.source, null, 2)}\n`;
}

/** The file cannot supply results, lineage, motion or proof. Those are derived
 * from the existing immutable matrix product, including every scalar pair. */
export function compile(value: unknown) {
  const source = read(value);
  assertMatrixColumnNumerals(source.left, source.right);
  const product = M.product({ id: `${source.id}.AB`, left: M.matrix(`${source.id}.A`, source.left), right: M.matrix(`${source.id}.B`, source.right) });
  const result = Object.freeze(product.result.rows.map(row => Object.freeze(row.map(entry => compileExpression(entry.expression)({})))));
  const draft = Object.freeze({ source, product, result, revision: `sha256:${sha256(JSON.stringify(source))}` });
  issued.add(draft);
  return draft;
}
export function check(json: string) {
  try { return { status: "compiled" as const, draft: compile(parse(json)) }; }
  catch (error) {
    if (!(error instanceof Repair)) throw error;
    return { status: "repair-gap" as const, diagnostic: { code: error.code, path: error.path, expected: error.expected } };
  }
}
