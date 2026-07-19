export interface KpConceptRoomArtifactLike {
  readonly schemaVersion: "kp.published-concept.v1";
  readonly integrity: string;
  readonly manifest: {
    readonly conceptId: string;
    readonly version: string;
    readonly title: string;
    readonly modes: readonly ("watch" | "touch" | "ask" | "review")[];
    readonly projections: readonly ("symbolic" | "balance")[];
    readonly styleRoles: readonly string[];
    readonly semanticRefs: readonly {
      readonly id: string;
      readonly kind: string;
    }[];
    readonly checkpoints: readonly {
      readonly id: string;
      readonly title: string;
      readonly explanation: string;
      readonly progressPermille: number;
      readonly semanticRefs: readonly string[];
    }[];
    readonly providers: readonly {
      readonly id: string;
      readonly protocol: string;
      readonly version: string;
    }[];
    readonly route: {
      readonly canonicalPath: string;
      readonly legacyAliases: readonly string[];
    };
    readonly review: {
      readonly title: string;
      readonly summary: string;
      readonly searchableText: string;
      readonly checkpointAnchors: boolean;
    };
    readonly provenance: {
      readonly sourcePath: string;
      readonly authoredBy: string;
      readonly authoredAt: string;
      readonly compilerVersion: string;
    };
  };
}

export interface KpConceptRoomCatalogEntryLike {
  readonly conceptId: string;
  readonly version: string;
  readonly canonicalPath: string;
  readonly legacyAliases: readonly string[];
  load(): Promise<KpConceptRoomArtifactLike>;
}
