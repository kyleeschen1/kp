export const kpRadicalCanonicalCheckpointProfiles = Object.freeze([
  Object.freeze({
    id: "wide-dpr1",
    label: "Wide · DPR 1",
    viewport: Object.freeze({ width: 1_100, height: 800 }),
    deviceScaleFactor: 1
  }),
  Object.freeze({
    id: "phone-dpr1",
    label: "Phone · DPR 1",
    viewport: Object.freeze({ width: 390, height: 844 }),
    deviceScaleFactor: 1
  }),
  Object.freeze({
    id: "wide-dpr2",
    label: "Wide · DPR 2",
    viewport: Object.freeze({ width: 1_100, height: 800 }),
    deviceScaleFactor: 2
  }),
  Object.freeze({
    id: "phone-dpr2",
    label: "Phone · DPR 2",
    viewport: Object.freeze({ width: 390, height: 844 }),
    deviceScaleFactor: 2
  })
]);

export const kpRadicalCanonicalCheckpointMoments = Object.freeze([
  ...[0, 250, 500, 750, 960, 999, 1_000].map((progressPermille) =>
    Object.freeze({
      id: `full-${progressPermille}`,
      label: `Full motion · ${progressPermille / 10}%`,
      motion: "full" as const,
      progressPermille
    })
  ),
  ...[0, 1_000].map((progressPermille) =>
    Object.freeze({
      id: `reduced-${progressPermille}`,
      label: `Reduced motion · ${progressPermille / 10}%`,
      motion: "reduced" as const,
      progressPermille
    })
  )
]);

export const kpRadicalCanonicalCheckpointCaptureCount =
  kpRadicalCanonicalCheckpointProfiles.length *
  kpRadicalCanonicalCheckpointMoments.length + 2;
