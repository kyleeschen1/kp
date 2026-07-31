import { expect, test } from "@playwright/test";

type KpPlaceValueAdditionBrowserHarnessModule = typeof import(
  "./support/place-value-addition-browser-harness.ts"
);

for (const viewport of [
  { name: "wide", width: 960, height: 720 },
  { name: "phone", width: 390, height: 720 }
] as const) {
  test(`${viewport.name} generated unequal-width fixture preserves terminal overflow`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/fixtures/place-value-addition-browser-host.html");
    const evidence = await page.evaluate(async ({ width }) => {
      const harnessUrl =
        "/tests/support/place-value-addition-browser-harness.ts";
      const { createKpGeneratedPlaceValueAdditionBrowserHarness } =
        await import(/* @vite-ignore */ harnessUrl) as
          KpPlaceValueAdditionBrowserHarnessModule;
      const harness =
        await createKpGeneratedPlaceValueAdditionBrowserHarness({
          document,
          viewportWidth: width,
          id: "999-plus-1",
          addends: ["999", "1"]
        });
      const snapshot = (positionId: string, operation: "evaluation" | "exchange") => {
        const stage = harness.operationScene(positionId, operation);
        return harness.materialOwners(stage);
      };
      const historyIndependent = [];
      for (const program of harness.fixture.positionPrograms) {
        harness.applyOperation({
          positionId: program.position.id,
          operation: "evaluation",
          progress: 0.52,
          direction: "forward"
        });
        const direct = snapshot(program.position.id, "evaluation");
        harness.applyOperation({
          positionId: program.position.id,
          operation: "evaluation",
          progress: 0.91,
          direction: "forward"
        });
        harness.applyOperation({
          positionId: program.position.id,
          operation: "evaluation",
          progress: 0.52,
          direction: "forward"
        });
        const replay = snapshot(program.position.id, "evaluation");
        historyIndependent.push({ direct, replay });
        if (program.exchange !== undefined) {
          harness.applyOperation({
            positionId: program.position.id,
            operation: "exchange",
            progress: 0.61,
            direction: "forward"
          });
          const forward = snapshot(program.position.id, "exchange");
          harness.applyOperation({
            positionId: program.position.id,
            operation: "exchange",
            progress: 0.28,
            direction: "rewind"
          });
          harness.applyOperation({
            positionId: program.position.id,
            operation: "exchange",
            progress: 0.61,
            direction: "forward"
          });
          historyIndependent.push({
            direct: forward,
            replay: snapshot(program.position.id, "exchange")
          });
        }
      }
      const alignedSource = {
        upper: harness.paintMetric(harness.persistentCell(
          "digit.addend-0.radix-position-0"
        )),
        lower: harness.paintMetric(harness.persistentCell(
          "digit.addend-1.radix-position-0"
        ))
      };
      const nodeIdsBefore = harness.fixture.projection.cells.map((cell) =>
        harness.persistentCell(cell.semanticEntityId).id
      );
      harness.settleResult();
      const displayOrderedResults = harness.fixture.positions
        .map(({ sequenceIndex }) => ({
          sequenceIndex,
          element: harness.persistentCell(
            `result.radix-position-${sequenceIndex}`
          )
        }))
        .sort((left, right) => right.sequenceIndex - left.sequenceIndex);
      const settled = {
        text: displayOrderedResults.map(({ element }) =>
          element.querySelector<HTMLElement>(".katex-html")
            ?.textContent?.trim() ?? ""
        ).join(""),
        metrics: displayOrderedResults.map(({ element }) =>
          harness.paintMetric(element)
        ),
        visibility: displayOrderedResults.map(({ element }) =>
          getComputedStyle(element).visibility
        ),
        nodeIds: harness.fixture.projection.cells.map((cell) =>
          harness.persistentCell(cell.semanticEntityId).id
        )
      };
      const rootRect = harness.root.getBoundingClientRect();
      harness.root.style.inlineSize = "320px";
      await harness.settleLayout();
      const resized = displayOrderedResults.map(({ element }) =>
        harness.paintMetric(element)
      );
      return {
        expression: harness.fixture.expression,
        verification: harness.fixture.verification,
        operationCount: harness.fixture.workspace.operations.length,
        historyIndependent,
        alignedSource,
        settled,
        nodeIdsBefore,
        rootRect: {
          left: rootRect.left,
          right: rootRect.right
        },
        resized
      };
    }, viewport);

    expect(evidence.expression).toBe("999 + 1 = 1000");
    expect(evidence.verification).toEqual({
      exactSum: true,
      unequalWidth: true,
      terminalResultExtension: true,
      orderedRadixSequence: true
    });
    expect(evidence.operationCount).toBe(3);
    for (const { direct, replay } of evidence.historyIndependent) {
      expect(replay).toEqual(direct);
      expect(direct.length).toBeGreaterThan(0);
      expect(direct.every(({ opacity }) =>
        opacity === "0" || opacity === "1"
      )).toBe(true);
    }
    expect(Math.abs(
      evidence.alignedSource.upper.center.x -
      evidence.alignedSource.lower.center.x
    )).toBeLessThanOrEqual(0.75);
    expect(evidence.settled.text).toBe("1000");
    expect(evidence.settled.visibility).toEqual([
      "visible",
      "visible",
      "visible",
      "visible"
    ]);
    expect(evidence.settled.nodeIds).toEqual(evidence.nodeIdsBefore);
    for (const metric of [
      ...evidence.settled.metrics,
      ...evidence.resized
    ]) {
      expect(metric.left).toBeGreaterThanOrEqual(evidence.rootRect.left - 1);
      expect(metric.left + metric.width)
        .toBeLessThanOrEqual(evidence.rootRect.right + 1);
    }
    expect(evidence.settled.metrics[0]!.center.x)
      .toBeLessThan(evidence.settled.metrics[1]!.center.x);
  });
}
