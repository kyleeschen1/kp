import { expect, test } from "@playwright/test";

interface VariationEvidence {
  readonly fixtureId: string;
  readonly constructionKind: string;
  readonly equalityCertificate: {
    readonly source: unknown;
    readonly target: unknown;
  };
  readonly sessions: readonly {
    readonly transitionId: string;
    readonly sessionKind: string;
    readonly sessionMode: string;
    readonly lifecycles: readonly string[];
    readonly trackCount: number;
    readonly noFade: boolean;
    readonly statelessSeek: boolean;
    readonly visualOwner: string;
    readonly materialOwnerCount: number;
  }[];
}

test("governed fraction variation reaches the canonical browser session", async ({
  page
}) => {
  await page.goto(
    "/tests/fixtures/governed-fraction-split-merge-variation.html"
  );
  await page.locator(
    '[data-kp-governed-fraction-variation][data-kp-ready="true"]'
  ).waitFor();
  const evidence = await page.evaluate(() =>
    (window as unknown as {
      __kpGovernedFractionVariationEvidence: VariationEvidence;
    }).__kpGovernedFractionVariationEvidence
  );

  expect(evidence.fixtureId).toBe(
    "fixture.governed.fraction-split-merge-variation.v1"
  );
  expect(evidence.constructionKind).toBe(
    "verified-governed-canonical-construction"
  );
  expect(evidence.equalityCertificate.source).toEqual(
    evidence.equalityCertificate.target
  );
  expect(evidence.sessions).toHaveLength(2);
  expect(evidence.sessions.map(({ sessionKind }) => sessionKind)).toEqual([
    "native-katex-renderer-session",
    "native-katex-renderer-session"
  ]);
  expect(evidence.sessions.every(({ sessionMode }) =>
    sessionMode === "atom-transit"
  )).toBe(true);
  expect(evidence.sessions[0]?.lifecycles).toContain("split");
  expect(evidence.sessions[1]?.lifecycles).toContain("merge");
  expect(evidence.sessions.every(({ trackCount }) => trackCount > 0)).toBe(true);
  expect(evidence.sessions.every(({ noFade }) => noFade)).toBe(true);
  expect(evidence.sessions.every(({ statelessSeek }) => statelessSeek)).toBe(true);
  expect(evidence.sessions.every(({ visualOwner }) =>
    visualOwner === "material-scene"
  )).toBe(true);
  expect(evidence.sessions.every(({ materialOwnerCount, trackCount }) =>
    materialOwnerCount === trackCount
  )).toBe(true);
});
