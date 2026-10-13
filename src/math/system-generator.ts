import { constant } from './expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows } from './typed-semantic-math.ts';
import { eliminateSystem } from './system-elimination.ts';

export interface SystemProblemRequest {
  readonly size: 2 | 3;
  readonly kind: 'unique' | 'infinite' | 'none';
  readonly seed: number;
  readonly rank?: number;
}
const gap = (path: string, message: string) => ({ status: 'repair-required' as const, path, message });

/** Construct a known structural case, scramble invertibly, then independently
 * solve the displayed system. Generation history is never the teaching trace. */
export function generateSystemProblem(request: SystemProblemRequest) {
  const n = request.size, rank = request.rank ?? (request.kind === 'unique' ? n : n - 1);
  if ((n !== 2 && n !== 3) || !Number.isInteger(request.seed) || request.seed < 0 || request.seed > 0xffffffff)
    return gap('request', 'Choose size 2 or 3 and an unsigned 32-bit integer seed.');
  if (!['unique', 'infinite', 'none'].includes(request.kind) || !Number.isInteger(rank) || rank < 1 || rank > n ||
    (request.kind === 'unique' ? rank !== n : rank === n)) return gap('rank', 'Unique systems need full rank; other cases currently use rank 1 through n−1.');
  let state = request.seed >>> 0;
  const random = (count: number) => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state % count; };
  const rows = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r >= rank ? 0 : c < r ? 0 : c === r ? 1 + random(2) : random(5) - 2));
  const known = Array.from({ length: n }, () => random(5) - 2);
  const rhs = rows.map(row => row.reduce((sum, a, c) => sum + a * known[c]!, 0));
  if (request.kind === 'none') rhs[rank] = 1 + random(2);
  for (let i = 0; i < n; i++) {
    const other = random(n);
    for (const row of rows) [row[i], row[other]] = [row[other]!, row[i]!];
  }
  for (let i = 0; i < n + 2; i++) {
    const a = random(n), b = (a + 1 + random(n - 1)) % n, factor = random(2) ? 1 : -1;
    const next = rows[b]!.map((value, c) => value + factor * rows[a]![c]!);
    const nextRhs = rhs[b]! + factor * rhs[a]!;
    if (next.some(value => Math.abs(value) > 9) || Math.abs(nextRhs) > 99) continue;
    rows[b] = next; rhs[b] = nextRhs;
  }
  const swap = random(n); [rows[0], rows[swap]] = [rows[swap]!, rows[0]!]; [rhs[0], rhs[swap]] = [rhs[swap]!, rhs[0]!];
  const id = `system-${n}-${request.kind}-${rank}-${request.seed}`;
  const scalar = (id: string, value: number) => createKpScalarExpression({ id, expression: constant(value) });
  const initial = Object.freeze({ coefficients: createKpTypedMatrixFromRows({ id: `${id}.A`, rows: rows.map((row, r) => row.map((v, c) => scalar(`${id}.a.${r}.${c}`, v))) }),
    rhs: Object.freeze(rhs.map((v, r) => scalar(`${id}.b.${r}`, v))) });
  const solution = eliminateSystem(`${id}.solve`, initial);
  if (solution.status !== 'solved') return solution;
  if (solution.rank !== rank || solution.solution.kind !== request.kind) return gap('verification', 'The generated system did not match the requested structure.');
  return Object.freeze({ status: 'generated' as const, id, request: Object.freeze({ ...request, rank }), initial, solution });
}
