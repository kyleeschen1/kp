export const kpPreExpansionLlmGenerationBenchmark = Object.freeze({
  schemaVersion: "kp.llm-generation-benchmark.v1",
  date: "2026-08-13",
  isolation: {
    freshProcesses: 3,
    conversationHistoryProvided: false,
    repositoryAccess: "read-only",
    maximumFilesPerCase: 6,
    outputConstraint: "structured-json"
  },
  cases: Object.freeze([
    Object.freeze({
      id: "existing-operation-variation",
      outcome: "valid-after-one-repair",
      firstPassValid: false,
      validAfterOneTypedRepair: true,
      filesRead: 6,
      apiSelections: 6,
      obsoleteApiSelections: 0,
      callerSpecificLines: 48,
      elapsedWallSeconds: 60,
      selfReportedMetadataAccurate: false,
      preview: "static-js-and-static-step",
      semanticEndpoints: "passed",
      directSeekAndRewind: "passed",
      silentFallbacks: 0,
      firstPassIssue:
        "validator received the compiled result instead of request and authority",
      repair:
        "TypeScript diagnostic identified the required request-authority input"
    }),
    Object.freeze({
      id: "two-operation-composition",
      outcome: "valid-first-pass",
      firstPassValid: true,
      validAfterOneTypedRepair: true,
      filesRead: 5,
      apiSelections: 2,
      obsoleteApiSelections: 0,
      callerSpecificLines: 30,
      elapsedWallSeconds: 25,
      selfReportedMetadataAccurate: true,
      preview: "governed-compound-route",
      semanticEndpoints: "passed",
      directSeekAndRewind: "passed",
      silentFallbacks: 0,
      firstPassIssue: null,
      repair: null
    }),
    Object.freeze({
      id: "unsupported-operation",
      outcome: "typed-repair-gap",
      firstPassValid: true,
      validAfterOneTypedRepair: true,
      filesRead: 5,
      apiSelections: 5,
      obsoleteApiSelections: 0,
      callerSpecificLines: 42,
      elapsedWallSeconds: 29,
      selfReportedMetadataAccurate: true,
      preview: "not-applicable",
      semanticEndpoints: "rejected-before-construction",
      directSeekAndRewind: "not-applicable",
      silentFallbacks: 0,
      firstPassIssue: null,
      repair: "choose-approved-operation"
    })
  ])
} as const);
