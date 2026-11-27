import { uuid, newId, NotebookGap, type UUID } from './model.ts';
import { coefficientLimit, tangentLimit, type QuadraticCoefficients } from '../math/authoring/quadratic-contract.ts';

export type CoefficientDraft = Readonly<Record<keyof QuadraticCoefficients, string>>;
interface Resource { readonly id: UUID; readonly revision: number; readonly name: string }
export interface QuadraticResource extends Resource {
  readonly kind: 'quadratic'; readonly coefficients: QuadraticCoefficients; readonly draft: CoefficientDraft;
}
export interface DerivativeResource extends Resource {
  readonly kind: 'derivative'; readonly source: UUID; readonly recipe: 'quadratic.derivative@1';
}
export interface TangentResource extends Resource {
  readonly kind: 'tangent'; readonly source: UUID; readonly recipe: 'quadratic.tangent@1';
  readonly at: number; readonly draftAt: string;
}
export type MathResource = QuadraticResource | DerivativeResource | TangentResource;
export interface NotebookMathematics { readonly schemaVersion: 1; readonly resources: readonly MathResource[] }
export type MathView = 'equation' | 'graph';
export interface MathViewport { readonly x: readonly [number, number]; readonly y: readonly [number, number] }
export const defaultMathViewport: MathViewport = { x: [-4, 4], y: [-5, 10] };
const gap = (code: string, path: string, message: string): never => { throw new NotebookGap(code, path, message); };
const record = (value: unknown, path: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype)
    return gap('invalid-math-data', path, 'Expected a plain object.');
  if (Object.values(Object.getOwnPropertyDescriptors(value)).some(descriptor => !descriptor.enumerable || !('value' in descriptor)))
    return gap('invalid-math-data', path, 'Use plain JSON data without accessors.');
  return value as Record<string, unknown>;
};
const keys = (value: Record<string, unknown>, fields: readonly string[], path: string) => {
  if (Object.keys(value).some(key => !fields.includes(key)) || fields.some(key => !Object.hasOwn(value, key)))
    gap('invalid-math-data', path, `Expected exactly ${fields.join(', ')}.`);
};
const text = (value: unknown, path: string, limit = 100): string => typeof value === 'string' && value.length <= limit
  ? value : gap('invalid-math-data', path, `Expected text of at most ${limit} characters.`);
const number = (value: unknown, limit: number, path: string): number => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit
  ? value : gap('unsupported-math-value', path, `Use a finite number between -${limit} and ${limit}.`);
export function parseMathNumber(value: string, limit: number): number | undefined {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return;
  const parsed = Number(value); return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : undefined;
}
export function readMathViewport(raw: unknown): MathViewport {
  const value = record(raw, 'viewport'); keys(value, ['x', 'y'], 'viewport');
  const domain = (raw: unknown, axis: string): readonly [number, number] => {
    if (!Array.isArray(raw) || raw.length !== 2) return gap('invalid-domain', axis, 'Expected two bounds.');
    const min = number(raw[0], 100, axis), max = number(raw[1], 100, axis);
    if (max - min < 0.1) return gap('invalid-domain', axis, 'Bounds must increase with a span of at least 0.1.');
    return [min, max];
  };
  return { x: domain(value['x'], 'x'), y: domain(value['y'], 'y') };
}
export function readNotebookMathematics(raw: unknown): NotebookMathematics {
  const value = record(raw, 'mathematics'); keys(value, ['schemaVersion', 'resources'], 'mathematics');
  if (value['schemaVersion'] !== 1 || !Array.isArray(value['resources']) || value['resources'].length > 32)
    return gap('unsupported-math-schema', 'mathematics', 'This exemplar supports version 1 and at most 32 resources.');
  if (Object.keys(value['resources']).length !== value['resources'].length)
    return gap('invalid-math-data', 'resources', 'Use a dense JSON resource array.');
  const seen = new Set<string>();
  const resources = value['resources'].map((raw: unknown): MathResource => {
    const v = record(raw, 'resource'), id = uuid(v['id']);
    if (seen.has(id)) gap('duplicate-math-id', id, 'A resource UUID must be unique.'); seen.add(id);
    if (!Number.isSafeInteger(v['revision']) || Number(v['revision']) < 0) gap('invalid-math-revision', id, 'Expected a nonnegative revision.');
    const base = { id, revision: Number(v['revision']), name: text(v['name'], id) };
    if (v['kind'] === 'quadratic') {
      keys(v, ['id', 'revision', 'name', 'kind', 'coefficients', 'draft'], id);
      const c = record(v['coefficients'], id), d = record(v['draft'], id); keys(c, ['a', 'b', 'c'], id); keys(d, ['a', 'b', 'c'], id);
      const coefficients = { a: number(c['a'], coefficientLimit, id), b: number(c['b'], coefficientLimit, id), c: number(c['c'], coefficientLimit, id) };
      const draft = { a: text(d['a'], id, 32), b: text(d['b'], id, 32), c: text(d['c'], id, 32) };
      for (const key of ['a', 'b', 'c'] as const) {
        const parsed = parseMathNumber(draft[key], coefficientLimit);
        if (parsed !== undefined && parsed !== coefficients[key]) gap('inconsistent-math-draft', id, 'A valid field must agree with its admitted coefficient.');
      }
      return { ...base, kind: 'quadratic', coefficients, draft };
    }
    if (v['kind'] !== 'derivative' && v['kind'] !== 'tangent') return gap('unsupported-math-resource', id, 'Choose a quadratic, its derivative or its tangent.');
    const source = uuid(v['source']);
    if (v['kind'] === 'derivative') {
      keys(v, ['id', 'revision', 'name', 'kind', 'source', 'recipe'], id);
      if (v['recipe'] !== 'quadratic.derivative@1') return gap('unavailable-math-recipe', id, 'Restore the registered quadratic.derivative@1 recipe.');
      return { ...base, kind: 'derivative', source, recipe: 'quadratic.derivative@1' };
    }
    keys(v, ['id', 'revision', 'name', 'kind', 'source', 'recipe', 'at', 'draftAt'], id);
    if (v['recipe'] !== 'quadratic.tangent@1') return gap('unavailable-math-recipe', id, 'Restore the registered quadratic.tangent@1 recipe.');
    const at = number(v['at'], tangentLimit, id), draftAt = text(v['draftAt'], id, 32), parsed = parseMathNumber(draftAt, tangentLimit);
    if (parsed !== undefined && parsed !== at) gap('inconsistent-math-draft', id, 'A valid tangent field must agree with its admitted point.');
    return { ...base, kind: 'tangent', source, recipe: 'quadratic.tangent@1', at, draftAt };
  });
  for (const r of resources) if (r.kind !== 'quadratic') {
    const source = resources.find(candidate => candidate.id === r.source);
    // The finite recipe family only accepts source quadratics. This also makes
    // cycles and silent derivative-of-derivative coercions unrepresentable.
    if (source?.kind !== 'quadratic') gap('invalid-math-dependency', r.id, 'The recipe requires a quadratic resource in this notebook.');
  }
  return { schemaVersion: 1, resources };
}
export function createQuadraticResource(id = newId()): QuadraticResource {
  return { id, revision: 0, name: 'f', kind: 'quadratic', coefficients: { a: 1, b: 0, c: 0 }, draft: { a: '1', b: '0', c: '0' } };
}
export function mathDraftError(resource: MathResource): string | undefined {
  if (resource.kind === 'quadratic' && Object.values(resource.draft).some(value => parseMathNumber(value, coefficientLimit) === undefined))
    return `Use coefficients between -${coefficientLimit} and ${coefficientLimit}. Showing the last valid values.`;
  if (resource.kind === 'tangent' && parseMathNumber(resource.draftAt, tangentLimit) === undefined)
    return `Use a tangent point between -${tangentLimit} and ${tangentLimit}. Showing the last valid tangent.`;
  return undefined;
}
export function editCoefficient(resource: QuadraticResource, key: keyof QuadraticCoefficients, draft: string): QuadraticResource {
  if (draft.length > 32) gap('invalid-math-data', resource.id, 'Keep the numeric field below 33 characters.');
  const value = parseMathNumber(draft, coefficientLimit);
  return { ...resource, revision: resource.revision + 1, draft: { ...resource.draft, [key]: draft },
    coefficients: { ...resource.coefficients, [key]: value ?? resource.coefficients[key] } };
}
export function editTangent(resource: TangentResource, draftAt: string): TangentResource {
  if (draftAt.length > 32) gap('invalid-math-data', resource.id, 'Keep the numeric field below 33 characters.');
  return { ...resource, revision: resource.revision + 1, draftAt, at: parseMathNumber(draftAt, tangentLimit) ?? resource.at };
}

export const mathematicalOperations = [
  { id: 'math.graph', title: 'Graph selected mathematical object', kind: 'graph', description: 'Another graph of the same source; its viewport stays local.', keywords: ['plot', 'curve', 'representation'] },
  { id: 'math.derivative', title: 'Differentiate selected quadratic', kind: 'derivative', description: 'Create a dependent derivative using quadratic.derivative@1.', keywords: ['derivative', 'derive', 'calculus', 'slope'] },
  { id: 'math.tangent', title: 'Create tangent to selected quadratic', kind: 'tangent', description: 'Create a dependent tangent at x = 1; adjust its contact point afterward.', keywords: ['derive', 'calculus', 'line', 'contact'] }
] as const;
export type MathOperation = typeof mathematicalOperations[number]['kind'];
export function deriveMathResource(source: MathResource, operation: Exclude<MathOperation, 'graph'>, id = newId()): DerivativeResource | TangentResource {
  if (source.kind !== 'quadratic') return gap('unsupported-math-operation', source.id, 'This operation requires a source quadratic.');
  if (mathDraftError(source)) return gap('invalid-math-draft', source.id, 'Correct the coefficient draft before deriving another object.');
  const base = { id, revision: 0, source: source.id };
  return operation === 'derivative' ? { ...base, kind: 'derivative', recipe: 'quadratic.derivative@1', name: `${source.name}′` }
    : { ...base, kind: 'tangent', recipe: 'quadratic.tangent@1', name: `T_${source.name}`, at: 1, draftAt: '1' };
}
