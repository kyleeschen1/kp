import { compileExpression, cos, sin, variable } from '../../math/expression.ts';

export class CircleTrigGap extends Error { readonly code = 'kp.circle-trig.invalid'; }
export const bounds = [-360, 720] as const;
export const entities = Object.freeze({ point: 'circle-trig.point', x: 'circle-trig.cosine', y: 'circle-trig.sine', angle: 'circle-trig.angle' });
export const expressions = Object.freeze({ x: cos(variable('x')), y: sin(variable('x')) });
const evaluateX = compileExpression(expressions.x), evaluateY = compileExpression(expressions.y);
export function readAngle(text: string): number {
  if (text.length > 24 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text.trim())) throw new CircleTrigGap('Enter a real angle in degrees from −360 to 720.');
  const angle = Number(text);
  if (!Number.isFinite(angle) || angle < bounds[0] || angle > bounds[1]) throw new CircleTrigGap('Use an angle from −360° to 720°. The last valid point remains visible.');
  return angle === 0 ? 0 : angle;
}
export function sampleCircle(angle: number) {
  if (!Number.isFinite(angle) || angle < bounds[0] || angle > bounds[1]) throw new CircleTrigGap('Angle is outside the supported range.');
  const remainder = angle % 360, wrapped = remainder < 0 ? remainder + 360 : remainder, radians = wrapped * Math.PI / 180;
  // Exact axes are mathematical endpoint facts. Nearby angles still use the
  // expression evaluator; display rounding never changes geometry or signs.
  const quarter = ((angle / 90) % 4 + 4) % 4;
  const axes = [[1, 0], [0, 1], [-1, 0], [0, -1]] as const;
  const exact = angle % 90 === 0 ? axes[quarter] : undefined;
  // Evaluate the signed remainder: adding a full turn can round a tiny angle
  // onto an axis. Wrapping is a graph location, never coordinate authority.
  const evaluatedRadians = remainder * Math.PI / 180;
  const x = exact?.[0] ?? evaluateX({ x: evaluatedRadians }), y = exact?.[1] ?? evaluateY({ x: evaluatedRadians });
  const region = exact ? (['Positive x-axis', 'Positive y-axis', 'Negative x-axis', 'Negative y-axis'][quarter]!)
    : x > 0 ? (y > 0 ? 'Quadrant I: x > 0, y > 0' : 'Quadrant IV: x > 0, y < 0')
    : y > 0 ? 'Quadrant II: x < 0, y > 0' : 'Quadrant III: x < 0, y < 0';
  return Object.freeze({ angle, wrapped, radians, x, y, region, entities, turns: Math.floor(angle / 360) });
}
export type CircleFrame = ReturnType<typeof sampleCircle>;
export const toProgress = (angle: number) => { sampleCircle(angle); return (angle - bounds[0]) / (bounds[1] - bounds[0]); };
export function fromProgress(progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new CircleTrigGap('Progress must be between zero and one.');
  return bounds[0] + progress * (bounds[1] - bounds[0]);
}
export function nextQuarter(angle: number, direction: 1 | -1) {
  sampleCircle(angle);
  return Math.max(bounds[0], Math.min(bounds[1], (direction === 1 ? Math.floor(angle / 90) + 1 : Math.ceil(angle / 90) - 1) * 90));
}
// Number serialization uses exponent notation for small values. Both source
// entry and URL restore admit the same bounded canonical number language.
export function readCircleUrl(params: URLSearchParams) { return readAngle(params.get('angle') ?? '45'); }
export const readoutSpecs = Object.freeze({
  angle: { min: -360, max: 720, decimals: 1, columns: 6 },
  wrapped: { min: 0, max: 360, decimals: 1, columns: 5 },
  x: { min: -1, max: 1, decimals: 3, columns: 6 },
  y: { min: -1, max: 1, decimals: 3, columns: 6 }
});
export type Readout = keyof typeof readoutSpecs;
export function formatReadout(id: Readout, value: number) {
  const spec = readoutSpecs[id];
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) throw new CircleTrigGap('Readout exceeds its declared range.');
  const formatted = value.toFixed(spec.decimals);
  return Number(formatted) === 0 ? (0).toFixed(spec.decimals) : formatted;
}
