import { resolveEnergyDerivationMeasuredPosition } from "../mechanics-relations/energy-derivation-presentation.ts";

export function fractionSceneAt(position: number, end = 3) {
  if ((end !== 2 && end !== 3) || !Number.isFinite(position) || position < 0 || position > end) throw new RangeError("Invalid fraction position.");
  if (position <= 1) return { index: 0, progress: position };
  if (position <= 1.5) return { index: 1, progress: (position - 1) * 2 };
  if (position <= 2) return { index: 2, progress: (position - 1.5) * 2 };
  return { index: 3, progress: position - 2 };
}
export function fractionPositionAtY(y: number, points: readonly { position: number; y: number }[]) {
  validatePoints(points);
  if (!Number.isFinite(y)) throw new RangeError("Fraction pointer position must be finite.");
  const ordinal = resolveEnergyDerivationMeasuredPosition(y, points.map(point => point.y));
  const left = Math.min(points.length - 2, Math.floor(ordinal)), t = ordinal - left;
  return points[left]!.position + t * (points[left + 1]!.position - points[left]!.position);
}
export function fractionIntervalAt(position: number, points: readonly { position: number; y: number }[]) {
  validatePoints(points);
  fractionSceneAt(position, points.at(-1)!.position);
  const right = Math.max(1, points.findIndex(point => point.position >= position));
  const before = points[right - 1]!, after = points[right]!;
  const progress = (position - before.position) / (after.position - before.position);
  return { before, after, progress, y: before.y + (after.y - before.y) * progress };
}

function validatePoints(points: readonly { position: number; y: number }[]) {
  if (points.length < 2 || points[0]?.position !== 0 || ![2, 3].includes(points.at(-1)!.position) ||
      points.some((point, index) => !Number.isFinite(point.position) || !Number.isFinite(point.y) ||
        (index > 0 && (point.position <= points[index - 1]!.position || point.y <= points[index - 1]!.y))))
    throw new RangeError("Fraction rail measurements must cover ordered, distinct endpoints from 0 through the final move.");
}
