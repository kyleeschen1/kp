import type {
  KpVignetteRelease,
  KpVignetteStaticCheckpoint,
  KpVignetteStaticProjection
} from "./kp-article-import-lock.ts";

export function requireKpVignetteStaticProjection(
  release: KpVignetteRelease
): KpVignetteStaticProjection {
  if (release.staticProjection === undefined) {
    throw new Error(
      `${release.id}@${release.version} does not provide a static checkpoint projection.`
    );
  }
  return release.staticProjection;
}

export function selectKpVignetteInitialCheckpoint(
  release: KpVignetteRelease
): KpVignetteStaticCheckpoint {
  const projection = requireKpVignetteStaticProjection(release);
  const targeted = new Set(projection.transitions.map(({ to }) => to));
  const roots = projection.checkpoints.filter(({ id }) => !targeted.has(id));
  if (roots.length !== 1) {
    throw new Error(
      `${release.id}@${release.version} requires one static checkpoint root, found ${roots.length}.`
    );
  }
  return roots[0]!;
}
