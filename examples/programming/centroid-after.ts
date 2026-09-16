export function mean(vs: number[]): number {
  let s = 0;
  for (const v of vs) {
    s += v;
  }
  return s / vs.length;
}

// Each call to mean has its own local accumulator; no sum is shared.
export function centroid(xs: number[], ys: number[]): [number, number] {
  const cx = mean(xs);
  const cy = mean(ys);
  return [cx, cy];
}
