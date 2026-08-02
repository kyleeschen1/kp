export type KpLegacyArchitectureExceptionKind =
  | "cross-layer-import"
  | "module-singleton-registry"
  | "central-route-branch"
  | "content-owned-style";

export interface KpLegacyArchitectureException {
  readonly id: string;
  readonly kind: KpLegacyArchitectureExceptionKind;
  readonly sourceFile: string;
  readonly evidencePatterns: readonly string[];
  readonly rationale: string;
}

// This is a ratchet input, not an endorsement: later gates may shrink these
// exceptions, but new architecture must not normalize or silently grow them.
export const kpLegacyArchitectureExceptionBaseline = [
  {
    id: "legacy.main.cross-layer-composition",
    kind: "cross-layer-import",
    sourceFile: "src/main.ts",
    evidencePatterns: [
      'import("./editor/editor.ts")',
      'from "./semantic/document.ts"',
      'import("./tutorial/ftc-surface.ts")'
    ],
    rationale:
      "The legacy app entrypoint still composes editor, semantic, and tutorial modules directly, although the editor and rich graph controls are now route-lazy; the concept-room strangler must not add another cross-layer branch here."
  },
  {
    id: "legacy.editor.mutable-surface-registry",
    kind: "module-singleton-registry",
    sourceFile: "src/editor/animation-surface-adapter-registry.ts",
    evidencePatterns: [
      "export const kpEditorAnimationSurfaceAdapterRegistry",
      "createKpEditorAnimationSurfaceAdapterRegistry()"
    ],
    rationale:
      "Editor surface adapters currently register through mutable module state; new room registries must instead be explicit immutable runtime inputs."
  },
  {
    id: "legacy.semantic.canonical-operation-registry",
    kind: "module-singleton-registry",
    sourceFile: "src/semantic/canonical-operation-registry.ts",
    evidencePatterns: [
      "export const kpCanonicalOperationRegistry",
      "createKpCanonicalOperationRegistry({"
    ],
    rationale:
      "The canonical operation registry is a module-scoped default retained for compatibility; new capability resolution must be runtime-scoped and injected."
  },
  {
    id: "legacy.dashboard.semantic-object-registry",
    kind: "module-singleton-registry",
    sourceFile: "src/project-dashboard/capability-preview.ts",
    evidencePatterns: [
      "const semanticObjectRegistry = createDefaultSemanticObjectRegistry()"
    ],
    rationale:
      "The dashboard constructs a module-scoped semantic registry for previews; concept-room discovery must not depend on this dashboard-owned instance."
  },
  {
    id: "legacy.main.query-view-routing",
    kind: "central-route-branch",
    sourceFile: "src/main.ts",
    evidencePatterns: [
      'requestedView === "ftc-tutorial"',
      '| "animation-workbench" = "editor"'
    ],
    rationale:
      "Legacy views and the approved Semantic Animation Workbench are selected by branches in the app entrypoint; generated concept routes still need an isolated resolver rather than another view discriminant."
  },
  {
    id: "legacy.ftc.embedded-render-style",
    kind: "content-owned-style",
    sourceFile: "src/tutorial/ftc-surface.ts",
    evidencePatterns: [
      "<style>",
      'stop-color="#ef936d"',
      ".kp-ftc-label{fill:#33473f"
    ],
    rationale:
      "The FTC renderer embeds CSS, fonts, and raw color values alongside tutorial markup; new content may select semantic style roles only."
  },
  {
    id: "legacy.hermeneutic-shell.embedded-theme",
    kind: "content-owned-style",
    sourceFile: "src/tutorial/hermeneutic-learner-shell.ts",
    evidencePatterns: [
      "<style>${learnerShellCss}</style>",
      "--kp-paper:#f7f3e8",
      "font-family:Inter,system-ui,sans-serif"
    ],
    rationale:
      "The legacy learner shell owns a literal theme and font stack; the concept room must receive versioned theme roles through renderer adapters."
  }
] as const satisfies readonly KpLegacyArchitectureException[];
