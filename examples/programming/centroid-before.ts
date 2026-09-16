// The lesson assumes nonempty, equally sized arrays of finite coordinates.
export function centroid(xs: number[], ys: number[]): [number, number] {
  let sx = 0;
  for (const x of xs) {
    sx += x;
  }
  const cx = sx / xs.length;

  let sy = 0;
  for (const y of ys) {
    sy += y;
  }
  const cy = sy / ys.length;

  return [cx, cy];
}
