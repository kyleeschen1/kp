export type KpFixtureLineageRelation =
  | "succession"
  | "merge"
  | "split"
  | "introduction"
  | "elimination"
  | "unsupported";

export interface KpGlyphFixtureToken {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly glyphKey: string;
  readonly groupId: string;
}

export interface KpGlyphFixtureLineage {
  readonly id: string;
  readonly relation: KpFixtureLineageRelation;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export interface KpGlyphFixtureLineageCandidate {
  readonly id: string;
  readonly lineages: readonly KpGlyphFixtureLineage[];
}

export interface KpGlyphFixtureMeasurement {
  readonly tokenId: string;
  readonly role: "moving" | "protected";
  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface KpGlyphFixtureViewport {
  readonly id: "wide" | "phone";
  readonly widthPx: number;
  readonly measurements: readonly KpGlyphFixtureMeasurement[];
}

export interface KpGlyphReconciliationFixture {
  readonly id: string;
  readonly sourceTokens: readonly KpGlyphFixtureToken[];
  readonly targetTokens: readonly KpGlyphFixtureToken[];
  readonly lineageCandidates: readonly KpGlyphFixtureLineageCandidate[];
  readonly viewports: readonly KpGlyphFixtureViewport[];
  readonly expectedDisposition:
    | "unmatched"
    | "ambiguous"
    | "fallback"
    | "clearance-required";
  readonly expectedIssueCodes: readonly string[];
}

export const kpGlyphReconciliationNegativeFixtures = Object.freeze([
  fixture({
    id: "fixture.equal-glyph-unrelated-entities",
    sourceTokens: [
      token("source.x", "entity.source-variable", "x", "source-equation")
    ],
    targetTokens: [
      token("target.x", "entity.target-label", "x", "target-equation")
    ],
    // Equal ink is deliberately insufficient when the semantic trace supplies
    // no lineage between the entities.
    lineageCandidates: [],
    viewports: [],
    expectedDisposition: "unmatched",
    expectedIssueCodes: ["glyph-reconciliation.no-semantic-lineage"]
  }),
  fixture({
    id: "fixture.repeated-token-ambiguous-lineage",
    sourceTokens: [
      token("source.x.left", "entity.source-left", "x", "source-equation"),
      token("source.x.right", "entity.source-right", "x", "source-equation")
    ],
    targetTokens: [
      token("target.x.left", "entity.target-left", "x", "target-equation"),
      token("target.x.right", "entity.target-right", "x", "target-equation")
    ],
    lineageCandidates: [
      candidate("candidate.direct", [
        lineage("lineage.left-left", "succession", ["entity.source-left"], ["entity.target-left"]),
        lineage("lineage.right-right", "succession", ["entity.source-right"], ["entity.target-right"])
      ]),
      candidate("candidate.crossed", [
        lineage("lineage.left-right", "succession", ["entity.source-left"], ["entity.target-right"]),
        lineage("lineage.right-left", "succession", ["entity.source-right"], ["entity.target-left"])
      ])
    ],
    viewports: [],
    expectedDisposition: "ambiguous",
    expectedIssueCodes: ["glyph-reconciliation.ambiguous-semantic-lineage"]
  }),
  fixture({
    id: "fixture.unsupported-lineage-relation",
    sourceTokens: [
      token("source.n", "entity.source-n", "n", "source-equation")
    ],
    targetTokens: [
      token("target.factorial", "entity.target-factorial", "n!", "target-equation")
    ],
    lineageCandidates: [
      candidate("candidate.unsupported", [
        lineage(
          "lineage.unsupported",
          "unsupported",
          ["entity.source-n"],
          ["entity.target-factorial"]
        )
      ])
    ],
    viewports: [],
    expectedDisposition: "fallback",
    expectedIssueCodes: ["glyph-reconciliation.unsupported-lineage"]
  }),
  fixture({
    id: "fixture.quadratic-discriminant-crowding",
    sourceTokens: [
      token("source.power", "entity.discriminant-power", "25", "formula"),
      token("source.minus", "entity.discriminant-minus", "−", "formula"),
      token("source.product", "entity.discriminant-product", "24", "formula"),
      token("source.plus-minus", "entity.plus-minus", "±", "formula")
    ],
    targetTokens: [
      token("target.radical", "entity.discriminant-result", "1", "formula"),
      token("target.plus-minus", "entity.plus-minus", "±", "formula")
    ],
    lineageCandidates: [
      candidate("candidate.discriminant-merge", [
        lineage(
          "lineage.discriminant-merge",
          "merge",
          [
            "entity.discriminant-power",
            "entity.discriminant-minus",
            "entity.discriminant-product"
          ],
          ["entity.discriminant-result"]
        ),
        lineage(
          "lineage.plus-minus",
          "succession",
          ["entity.plus-minus"],
          ["entity.plus-minus"]
        )
      ])
    ],
    viewports: [
      viewport("wide", 1_440, [
        measurement("source.power", "moving", 648, 272, 34, 30),
        measurement("source.product", "moving", 690, 272, 36, 30),
        measurement("source.plus-minus", "protected", 674, 270, 25, 34)
      ]),
      viewport("phone", 390, [
        measurement("source.power", "moving", 166, 314, 34, 30),
        measurement("source.product", "moving", 202, 314, 36, 30),
        measurement("source.plus-minus", "protected", 190, 312, 25, 34)
      ])
    ],
    expectedDisposition: "clearance-required",
    expectedIssueCodes: ["glyph-reconciliation.crowded-baseline"]
  })
]);

export function validateKpGlyphReconciliationFixture(
  fixtureValue: KpGlyphReconciliationFixture
): readonly string[] {
  const issues: string[] = [];
  const sourceIds = fixtureValue.sourceTokens.map(({ id }) => id);
  const targetIds = fixtureValue.targetTokens.map(({ id }) => id);
  if (new Set(sourceIds).size !== sourceIds.length) {
    issues.push(`Fixture ${fixtureValue.id} has duplicate source token ids.`);
  }
  if (new Set(targetIds).size !== targetIds.length) {
    issues.push(`Fixture ${fixtureValue.id} has duplicate target token ids.`);
  }
  const sourceEntities = new Set(
    fixtureValue.sourceTokens.map(({ semanticEntityId }) => semanticEntityId)
  );
  const targetEntities = new Set(
    fixtureValue.targetTokens.map(({ semanticEntityId }) => semanticEntityId)
  );
  for (const candidateValue of fixtureValue.lineageCandidates) {
    for (const lineageValue of candidateValue.lineages) {
      if (lineageValue.sourceEntityIds.some((id) => !sourceEntities.has(id))) {
        issues.push(`Fixture lineage ${lineageValue.id} has an unknown source entity.`);
      }
      if (lineageValue.targetEntityIds.some((id) => !targetEntities.has(id))) {
        issues.push(`Fixture lineage ${lineageValue.id} has an unknown target entity.`);
      }
    }
  }
  const allTokenIds = new Set([...sourceIds, ...targetIds]);
  for (const viewportValue of fixtureValue.viewports) {
    if (viewportValue.measurements.some(({ tokenId }) => !allTokenIds.has(tokenId))) {
      issues.push(`Fixture viewport ${viewportValue.id} measures an unknown token.`);
    }
  }
  return Object.freeze(issues);
}

export function findKpGlyphFixtureOverlaps(
  viewportValue: KpGlyphFixtureViewport
): readonly {
  readonly movingTokenId: string;
  readonly protectedTokenId: string;
}[] {
  const moving = viewportValue.measurements.filter(({ role }) => role === "moving");
  const protectedMeasurements = viewportValue.measurements.filter(
    ({ role }) => role === "protected"
  );
  return Object.freeze(moving.flatMap((movingMeasurement) =>
    protectedMeasurements
      .filter((protectedMeasurement) =>
        intersects(movingMeasurement.rect, protectedMeasurement.rect)
      )
      .map((protectedMeasurement) => Object.freeze({
        movingTokenId: movingMeasurement.tokenId,
        protectedTokenId: protectedMeasurement.tokenId
      }))
  ));
}

function fixture(
  input: KpGlyphReconciliationFixture
): KpGlyphReconciliationFixture {
  return Object.freeze({
    ...input,
    sourceTokens: Object.freeze(input.sourceTokens.map((value) =>
      Object.freeze({ ...value })
    )),
    targetTokens: Object.freeze(input.targetTokens.map((value) =>
      Object.freeze({ ...value })
    )),
    lineageCandidates: Object.freeze(input.lineageCandidates.map((value) =>
      Object.freeze({
        ...value,
        lineages: Object.freeze(value.lineages.map((item) => Object.freeze({
          ...item,
          sourceEntityIds: Object.freeze([...item.sourceEntityIds]),
          targetEntityIds: Object.freeze([...item.targetEntityIds])
        })))
      })
    )),
    viewports: Object.freeze(input.viewports.map((value) => Object.freeze({
      ...value,
      measurements: Object.freeze(value.measurements.map((item) =>
        Object.freeze({ ...item, rect: Object.freeze({ ...item.rect }) })
      ))
    }))),
    expectedIssueCodes: Object.freeze([...input.expectedIssueCodes])
  });
}

function token(
  id: string,
  semanticEntityId: string,
  glyphKey: string,
  groupId: string
): KpGlyphFixtureToken {
  return { id, semanticEntityId, glyphKey, groupId };
}

function candidate(
  id: string,
  lineages: readonly KpGlyphFixtureLineage[]
): KpGlyphFixtureLineageCandidate {
  return { id, lineages };
}

function lineage(
  id: string,
  relation: KpFixtureLineageRelation,
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[]
): KpGlyphFixtureLineage {
  return { id, relation, sourceEntityIds, targetEntityIds };
}

function viewport(
  id: KpGlyphFixtureViewport["id"],
  widthPx: number,
  measurements: readonly KpGlyphFixtureMeasurement[]
): KpGlyphFixtureViewport {
  return { id, widthPx, measurements };
}

function measurement(
  tokenId: string,
  role: KpGlyphFixtureMeasurement["role"],
  x: number,
  y: number,
  width: number,
  height: number
): KpGlyphFixtureMeasurement {
  return { tokenId, role, rect: { x, y, width, height } };
}

function intersects(
  left: KpGlyphFixtureMeasurement["rect"],
  right: KpGlyphFixtureMeasurement["rect"]
): boolean {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}
