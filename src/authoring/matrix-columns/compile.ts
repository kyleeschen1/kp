import * as M from "../../math/authoring/matrices.ts";
import { compileExpression } from "../../math/expression.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { parse, read, Repair } from "./source.ts";

/** The file cannot supply results, lineage, motion or proof. Those are derived
 * from the existing immutable matrix product, including every scalar pair. */
export function compile(value: unknown) {
  const source = read(value);
  const paint = (["left", "right"] as const).flatMap(factor => source[factor].flatMap((row, r) =>
    row.map((value, c) => ({ value, path: `$.${factor}[${r}][${c}]` }))));
  // Validate intermediate products too: finite factors and even a finite final
  // sum do not establish that every displayed evaluation is representable.
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const terms = [0, 1].map(k => {
      const term = source.left[r]![k]! * source.right[k]![c]!;
      if (!Number.isFinite(term)) throw new Repair("matrix.numeric-range", `$.right[${k}][${c}]`, `Use a coefficient whose product with left[${r}][${k}] remains finite.`);
      paint.push({ value: term, path: `$.right[${k}][${c}]` });
      return term;
    });
    if (!Number.isFinite(terms[0]! + terms[1]!))
      throw new Repair("matrix.numeric-range", `$.left[${r}]`, `Use coefficients whose sum for result row ${r}, column ${c} remains finite.`);
    paint.push({ value: terms[0]! + terms[1]!, path: `$.left[${r}]` });
  }
  // The accepted renderer interpolates ordinary decimal numerals. JavaScript
  // exponent strings would paint an algebraic letter e, not the numeric value;
  // adding superscript choreography is a separate presentation capability.
  for (const entry of paint) if (String(entry.value).includes("e")) {
    throw new Repair("matrix.numeric-notation", entry.path, "Use factors whose entries, products and sums render as ordinary decimal numerals; scientific notation is not supported by this animation.");
  }
  const product = M.product({ id: `${source.id}.AB`, left: M.matrix(`${source.id}.A`, source.left), right: M.matrix(`${source.id}.B`, source.right) });
  const result = Object.freeze(product.result.rows.map(row => Object.freeze(row.map(entry => compileExpression(entry.expression)({})))));
  return Object.freeze({ source, product, result, revision: `sha256:${sha256(JSON.stringify(source))}` });
}
export function check(json: string) {
  try { return { status: "compiled" as const, draft: compile(parse(json)) }; }
  catch (error) {
    if (!(error instanceof Repair)) throw error;
    return { status: "repair-gap" as const, diagnostic: { code: error.code, path: error.path, expected: error.expected } };
  }
}
