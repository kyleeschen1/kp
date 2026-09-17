import { parseLatexExpression, type ParsedLatexExpression } from "../math/latex-parser.ts";
import { tokenizeLatex } from "../math/latex-tokenizer.ts";

export type FractionChainHint = "align" | "combine" | "reduce";
export interface FractionChainFraction { readonly numerator: bigint; readonly denominator: bigint }
export type FractionChainExpression =
  | Readonly<{ kind: "fraction"; fraction: FractionChainFraction }>
  | Readonly<{ kind: "pair"; operator: "+" | "-"; terms: readonly [FractionChainFraction, FractionChainFraction] }>;
export interface FractionChainState { readonly id: string; readonly latex: string; readonly expression: FractionChainExpression }
export interface FractionChainMove {
  readonly id: string; readonly from: string; readonly to: string; readonly prose: string; readonly hint?: FractionChainHint;
}
/** Parsed structure is not mathematical or renderer authority. Each adjacency
 * must still pass its operation owner before it can receive a presentation. */
export interface FractionChainSource {
  readonly schema: "kp.algebra.fraction-chain.v1";
  readonly id: string; readonly title: string;
  readonly states: readonly FractionChainState[]; readonly moves: readonly FractionChainMove[];
}
export class FractionChainRepair extends Error {
  readonly code: "fraction-chain.source" | "fraction-chain.notation" | "fraction-chain.operation" | "fraction-chain.presentation";
  readonly path: string;
  constructor(code: FractionChainRepair["code"], path: string, expected: string) {
    super(expected); this.name = "FractionChainRepair"; this.code = code; this.path = path;
  }
}
export type FractionChainDiagnostic = Readonly<{ status: "repair-required"; code: FractionChainRepair["code"]; path: string; expected: string }>;
export function fractionChainDiagnostic(error: FractionChainRepair): FractionChainDiagnostic {
  return { status: "repair-required", code: error.code, path: error.path, expected: error.message };
}
const fail = (path: string, expected: string): never => { throw new FractionChainRepair("fraction-chain.source", path, expected); };

function record(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null))
    return fail(path, "Use a plain data object.");
  const result: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    const field = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== "string" || !keys.includes(key) || !("value" in field))
      return fail(path, "Only the documented data fields are allowed; no authority, geometry or accessors.");
    result[key] = field.value;
  }
  return result;
}
function list(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) return fail(path, "Use a nonempty array of at most eight entries.");
  if (Reflect.ownKeys(value).length !== value.length + 1) return fail(path, "Use a dense data array without extra fields.");
  const result: unknown[] = [];
  for (let i = 0; i < value.length; i++) {
    const field = Object.getOwnPropertyDescriptor(value, String(i));
    if (!field || !("value" in field)) return fail(`${path}[${i}]`, "Use data entries, not accessors or holes.");
    result.push(field.value);
  }
  return result;
}
function text(value: unknown, path: string, limit: number) {
  if (typeof value !== "string" || !value.trim() || value.length > limit) return fail(path, `Use nonempty text of at most ${limit} characters.`);
  return value;
}
function id(value: unknown, path: string) {
  const name = text(value, path, 64);
  if (!/^[a-z][a-z0-9.-]*$/.test(name)) return fail(path, "Use a stable lowercase identifier.");
  return name;
}
function fraction(expression: ParsedLatexExpression, path: string): FractionChainFraction {
  const gap = (): never => { throw new FractionChainRepair("fraction-chain.notation", path, "Use explicit integer fractions with positive denominators, absolute integers at most 1000000."); };
  const integer = (node: ParsedLatexExpression): bigint => {
    const sign = node.kind === "unary" ? -1 : 1;
    const value = node.kind === "unary" ? node.value : node;
    if (value.kind !== "number" || !Number.isSafeInteger(value.value) || Math.abs(value.value) > 1_000_000) return gap();
    return BigInt(sign * value.value);
  };
  if (expression.kind !== "binary" || expression.operator !== "/") return gap();
  const numerator = integer(expression.left), denominator = integer(expression.right);
  if (denominator <= 0n) return gap();
  return Object.freeze({ numerator, denominator });
}
function expression(latex: string, path: string): FractionChainExpression {
  let parsed: ParsedLatexExpression;
  try {
    // Check lexical integers before the parser converts numbers to doubles.
    // A decimal that rounds to an integer must not acquire exact authority.
    if (tokenizeLatex(latex).some(token => token.kind === "number" && !/^\d+$/.test(token.value))) throw new Error("Integer notation required");
    parsed = parseLatexExpression(latex);
  }
  catch { throw new FractionChainRepair("fraction-chain.notation", path, "Use a fraction or an ordered sum/difference of exactly two fractions."); }
  if (parsed.kind === "binary" && (parsed.operator === "+" || parsed.operator === "-")) {
    const terms: readonly [FractionChainFraction, FractionChainFraction] = Object.freeze([fraction(parsed.left, path), fraction(parsed.right, path)]);
    return Object.freeze({ kind: "pair", operator: parsed.operator, terms });
  }
  return Object.freeze({ kind: "fraction", fraction: fraction(parsed, path) });
}

export function readFractionChainSource(value: unknown):
  | { status: "parsed"; source: FractionChainSource }
  | FractionChainDiagnostic {
  try {
    const input = record(value, ["schema", "id", "title", "states", "moves"], "$");
    if (input['schema'] !== "kp.algebra.fraction-chain.v1") fail("$.schema", "Use kp.algebra.fraction-chain.v1.");
    const states = list(input['states'], "$.states").map((value, i) => {
      const path = `$.states[${i}]`, state = record(value, ["id", "latex"], path);
      const latex = text(state['latex'], `${path}.latex`, 256);
      return Object.freeze({ id: id(state['id'], `${path}.id`), latex, expression: expression(latex, `${path}.latex`) });
    });
    if (states.length < 2 || new Set(states.map(state => state.id)).size !== states.length) fail("$.states", "Use two to eight uniquely identified states.");
    const moves = list(input['moves'], "$.moves").map((value, i) => {
      const path = `$.moves[${i}]`, move = record(value, ["id", "from", "to", "prose", "hint"], path);
      const hint = move['hint'];
      if (hint !== undefined && hint !== "align" && hint !== "combine" && hint !== "reduce") fail(`${path}.hint`, "Use align, combine, reduce, or omit the hint.");
      if (move['from'] !== states[i]?.id || move['to'] !== states[i + 1]?.id) fail(path, "Connect consecutive declared states in their written order.");
      return Object.freeze({ id: id(move['id'], `${path}.id`), from: id(move['from'], `${path}.from`),
        to: id(move['to'], `${path}.to`), prose: text(move['prose'], `${path}.prose`, 2000),
        ...(hint === "align" || hint === "combine" || hint === "reduce" ? { hint } : {}) });
    });
    if (moves.length !== states.length - 1 || new Set(moves.map(move => move.id)).size !== moves.length) fail("$.moves", "Supply exactly one uniquely identified move per adjacent pair.");
    return { status: "parsed", source: Object.freeze({ schema: "kp.algebra.fraction-chain.v1", id: id(input['id'], "$.id"),
      title: text(input['title'], "$.title", 160), states: Object.freeze(states), moves: Object.freeze(moves) }) };
  } catch (error) {
    if (error instanceof FractionChainRepair) return fractionChainDiagnostic(error);
    throw error;
  }
}
