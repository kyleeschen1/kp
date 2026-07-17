import { expect, test } from "@playwright/test";

test("witnessed annihilation preserves its semantic timing in the browser", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(async () => {
    const plannerPath = "/src/animation/witnessed-annihilation.ts";
    const adapterPath = "/src/rendering/witnessed-annihilation-dom.ts";
    const planner = await import(/* @vite-ignore */ plannerPath);
    const adapter = await import(/* @vite-ignore */ adapterPath);
    const stage = document.createElement("div");
    stage.style.cssText = "position:fixed;left:40px;top:40px;width:340px;height:100px";
    document.body.append(stage);

    const token = (text: string, left: number) => {
      const element = document.createElement("span");
      element.textContent = text;
      element.style.cssText = `position:absolute;left:${left}px;top:30px;font:32px KaTeX_Main,serif`;
      stage.append(element);
      return element;
    };
    const plusThree = token("+3", 80);
    const minusThree = token("−3", 150);
    const witnessElement = token("0", 126);
    const equalsMaterial = token("=", 230);
    const equalsNative = token("=", 176);
    const witness = {
      kind: "cancellation-witness",
      descriptorId: "witness.additive-identity.zero",
      semanticValue: { latex: "0", plainText: "0" },
      law: "additive-identity",
      operationId: "kp.algebra.cancel-additive-inverses",
      transformationId: "transform.fixture",
      cancellationRecordId: "cancel.fixture",
      slot: {
        id: "slot.fixture.left-inverses",
        ownerNodeId: "node.fixture",
        sourceSelectorIds: ["plus3", "minus3"]
      },
      survivorAnchorSelectorIds: ["equals"],
      presentation: {
        ownership: "presentation-controlled-transient",
        beginsAfter: "annihilation-contact",
        endsBefore: "survivor-compaction"
      }
    };
    const plan = planner.createKpWitnessedAnnihilationPlan({
      id: "browser.annihilation",
      witness,
      sources: [
        { id: "plus3", selectorIds: ["plus3"], semanticRole: "term", semanticRank: 0 },
        { id: "minus3", selectorIds: ["minus3"], semanticRole: "inverse", semanticRank: 1 }
      ],
      measurements: {
        plus3: { left: 80, top: 30, width: 40, height: 38 },
        minus3: { left: 150, top: 30, width: 44, height: 38 }
      },
      survivors: [{
        id: "equals",
        sourceSelectorIds: ["equals"],
        targetSelectorIds: ["equals.final"],
        sourceRect: { left: 230, top: 30, width: 22, height: 38 },
        targetRect: { left: 176, top: 30, width: 22, height: 38 }
      }]
    });
    const binding = {
      stage,
      sources: new Map([["plus3", plusThree], ["minus3", minusThree]]),
      witness: witnessElement,
      survivors: new Map([["equals", { material: equalsMaterial, native: equalsNative }]])
    };
    adapter.validateKpWitnessedAnnihilationDomBinding({ plan, binding });

    const sample = (progress: number) => {
      adapter.applyKpWitnessedAnnihilationDomFrame({
        frame: planner.sampleKpWitnessedAnnihilation({ plan, progress }),
        binding
      });
      return {
        phase: stage.dataset["kpAnnihilationPhase"],
        readable: stage.dataset["kpAnnihilationWitnessReadable"],
        witnessOpacity: witnessElement.style.opacity,
        witnessText: witnessElement.textContent,
        absorption: Number(stage.dataset["kpAnnihilationWitnessAbsorption"]),
        compaction: Number(stage.dataset["kpAnnihilationCompaction"]),
        sourceScales: [plusThree.style.scale, minusThree.style.scale],
        nativeOpacity: equalsNative.style.opacity
      };
    };
    const frames = [0.45, 0.7, 0.86, 0.94].map(sample);
    const settled = sample(1);
    stage.remove();
    return { frames, settled };
  });

  const [contact, dwell, absorbing, compacting] = result.frames;
  expect(contact).toBeDefined();
  expect(dwell).toBeDefined();
  expect(absorbing).toBeDefined();
  expect(compacting).toBeDefined();
  expect(contact!).toMatchObject({ readable: "false", witnessOpacity: "0" });
  expect(dwell!).toMatchObject({
    phase: "witness-dwell",
    readable: "true",
    witnessOpacity: "1",
    witnessText: "0"
  });
  expect(dwell!.sourceScales).toEqual(["0.72", "0.72"]);
  expect(absorbing!.absorption).toBeGreaterThan(0);
  expect(absorbing!.compaction).toBe(0);
  expect(compacting!.absorption).toBe(1);
  expect(compacting!.compaction).toBeGreaterThan(0);
  expect(result.settled).toMatchObject({
    phase: "settled",
    witnessOpacity: "0",
    nativeOpacity: ""
  });
});
