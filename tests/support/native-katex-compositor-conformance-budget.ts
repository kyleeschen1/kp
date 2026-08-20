export const kpNativeKatexCompositorConformanceBudget = Object.freeze({
  schemaVersion: "kp.native-katex-compositor-conformance-budget.v1" as const,
  sampleSlots: Object.freeze([
    "source-native",
    "source-material-seam",
    "material-midpoint",
    "material-target-seam",
    "target-native"
  ] as const),
  hard: Object.freeze({
    fastCanaryMaximumScenarios: 24,
    promotionMaximumScenarios: 96,
    crossBrowserMaximumScenariosPerEngine: 12,
    maximumSamplesPerTransition: 5,
    maximumPagesPerProfile: 1,
    maximumWorkers: 1,
    routineScreenshotCount: 0,
    defaultUnseededFuzzCases: 0
  }),
  advisoryWallTimeMs: Object.freeze({
    plannerAndUnit: 5_000,
    chromiumCanary: 30_000,
    promotion: 120_000,
    supportedBrowserRelease: 300_000
  }),
  policy: Object.freeze({
    reuseServer: true,
    reuseBrowser: true,
    reusePageWithinProfile: true,
    failureDiagnosticsAreStructuredData: true,
    screenshotsRequireExplicitReviewMode: true,
    generatedCoverageIsDeterministic: true
  })
});
