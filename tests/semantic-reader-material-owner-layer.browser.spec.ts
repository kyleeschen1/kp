import { expect, test } from "@playwright/test";

test("reader material owners persist by semantic key and sanitize cloned visuals", async ({
  page
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/reader/renderers/equation-material-layer.ts";
    const { createKpReaderEquationMaterialLayer } = await import(modulePath);
    document.body.innerHTML = [
      '<div data-kp-reader-equation-material-layer="true"></div>',
      '<span id="source-a" data-kp-reader-equation-anchor-id="anchor.a"><b id="nested-a">x</b></span>',
      '<span id="source-b" data-kp-reader-equation-anchor-id="anchor.b">=</span>'
    ].join("");
    const layer = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-material-layer]"
    )!;
    const sourceA = document.querySelector<HTMLElement>("#source-a")!;
    const sourceB = document.querySelector<HTMLElement>("#source-b")!;
    const controller = createKpReaderEquationMaterialLayer(layer);
    const ownerA = {
      ownerId: "owner.a",
      rect: { left: 10, top: 20, width: 14, height: 18 },
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      focused: false,
      fragments: [{
        id: "fragment.a",
        visualRevision: "r1",
        sourceElement: sourceA,
        rect: { left: 10, top: 20, width: 14, height: 18 }
      }]
    };
    const first = controller.sync([ownerA]);
    const firstNode = layer.querySelector<HTMLElement>(
      '[data-kp-reader-equation-material-owner-id="owner.a"]'
    )!;
    const second = controller.sync([{
      ...ownerA,
      translateX: 12,
      opacity: 0.6,
      focused: true
    }, {
      ...ownerA,
      ownerId: "owner.b",
      rect: { left: 40, top: 20, width: 10, height: 18 },
      fragments: [{
        id: "fragment.b",
        visualRevision: "r1",
        sourceElement: sourceB,
        rect: { left: 40, top: 20, width: 10, height: 18 }
      }]
    }]);
    const secondNode = layer.querySelector<HTMLElement>(
      '[data-kp-reader-equation-material-owner-id="owner.a"]'
    )!;
    const clone = secondNode.querySelector<HTMLElement>(
      ".kp-reader-equation-material-visual"
    )!;
    const retained = firstNode === secondNode;
    const sanitized =
      clone.id === "" &&
      clone.getAttribute("data-kp-reader-equation-anchor-id") === null &&
      clone.querySelector("#nested-a") === null;
    const focused = secondNode.dataset["kpReaderEquationMaterialFocused"];
    const transform = secondNode.style.transform;
    sourceA.textContent = "y";
    controller.sync([{
      ...ownerA,
      fragments: [{
        ...ownerA.fragments[0]!,
        visualRevision: "r2",
        sourceElement: sourceA
      }]
    }]);
    const revisedClone = firstNode.querySelector<HTMLElement>(
      ".kp-reader-equation-material-visual"
    )!;
    const revisionReplaced = clone.isConnected === false &&
      revisedClone.dataset["kpReaderEquationMaterialVisualRevision"] === "r2" &&
      revisedClone.textContent === "y";
    const third = controller.sync([{
      ...ownerA,
      ownerId: "owner.b",
      rect: { left: 40, top: 20, width: 10, height: 18 },
      fragments: [{
        id: "fragment.b",
        visualRevision: "r1",
        sourceElement: sourceB,
        rect: { left: 40, top: 20, width: 10, height: 18 }
      }]
    }]);
    const removedA = firstNode.isConnected === false;
    controller.dispose();

    return {
      first,
      second,
      third,
      retained,
      sanitized,
      revisionReplaced,
      removedA,
      focused,
      transform,
      ownerCountAfterDispose: layer.childElementCount,
      ariaHidden: layer.getAttribute("aria-hidden")
    };
  });

  expect(result.first).toEqual({
    createdOwnerIds: ["owner.a"],
    retainedOwnerIds: [],
    removedOwnerIds: []
  });
  expect(result.second).toEqual({
    createdOwnerIds: ["owner.b"],
    retainedOwnerIds: ["owner.a"],
    removedOwnerIds: []
  });
  expect(result.third.removedOwnerIds).toEqual(["owner.a"]);
  expect(result.retained).toBe(true);
  expect(result.sanitized).toBe(true);
  expect(result.revisionReplaced).toBe(true);
  expect(result.removedA).toBe(true);
  expect(result.focused).toBe("true");
  expect(result.transform).toContain("translate3d(12px, 0px, 0px)");
  expect(result.ownerCountAfterDispose).toBe(0);
  expect(result.ariaHidden).toBe("true");
});

test("reader material visuals infer measured fraction rules without changing glyph clones", async ({
  page
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/reader/renderers/equation-material-visual-contract.ts";
    const { resolveKpReaderEquationMaterialVisualContract } = await import(modulePath);
    const glyph = document.createElement("span");
    glyph.className = "mord";
    const fractionRule = document.createElement("span");
    fractionRule.className = "frac-line";
    return {
      glyph: resolveKpReaderEquationMaterialVisualContract(glyph),
      fractionRule: resolveKpReaderEquationMaterialVisualContract(fractionRule)
    };
  });

  expect(result.glyph).toEqual({
    kind: "computed-style-clone",
    geometryAuthority: "source-layout-context",
    paintAuthority: "computed-style"
  });
  expect(result.fractionRule).toEqual({
    kind: "measured-fraction-rule",
    geometryAuthority: "material-fragment-rect",
    paintAuthority: "computed-border"
  });
});

test("measured fraction-rule ink is rebased to its material fragment", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/reader/renderers/equation-material-layer.ts";
    const { createKpReaderEquationMaterialLayer } = await import(modulePath);
    document.body.innerHTML = [
      '<div data-kp-reader-equation-material-layer="true" style="position:relative"></div>',
      '<span id="rule" class="frac-line" data-kp-reader-selector-id="fraction.rule" ',
      'style="position:relative;top:21px;display:block;width:14px;height:1px;',
      'border-bottom:1px solid rgb(20, 30, 40)"></span>'
    ].join("");
    const layer = document.querySelector<HTMLElement>(
      "[data-kp-reader-equation-material-layer]"
    )!;
    const source = document.querySelector<HTMLElement>("#rule")!;
    const controller = createKpReaderEquationMaterialLayer(layer);
    controller.sync([{
      ownerId: "owner.rule",
      rect: { left: 10, top: 20, width: 14, height: 1 },
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      focused: false,
      fragments: [{
        id: "anchor.fraction.rule",
        visualRevision: "r1",
        sourceElement: source,
        rect: { left: 10, top: 20, width: 14, height: 1 }
      }]
    }]);
    const fragment = layer.querySelector<HTMLElement>(
      '[data-kp-reader-equation-material-fragment-id="anchor.fraction.rule"]'
    )!;
    const visual = fragment.querySelector<HTMLElement>(".frac-line")!;
    const fragmentRect = fragment.getBoundingClientRect();
    const visualRect = visual.getBoundingClientRect();
    const visualStyle = getComputedStyle(visual);
    const borderBottomColor = visualStyle.borderBottomColor;
    const borderBottomWidth = visualStyle.borderBottomWidth;
    controller.dispose();
    return {
      offsetX: visualRect.left - fragmentRect.left,
      offsetY: visualRect.top - fragmentRect.top,
      widthDelta: visualRect.width - fragmentRect.width,
      heightDelta: visualRect.height - fragmentRect.height,
      kind: visual.dataset["kpReaderMaterialVisualKind"],
      borderBottomColor,
      borderBottomWidth
    };
  });

  expect(result).toEqual({
    offsetX: 0,
    offsetY: 0,
    widthDelta: 0,
    heightDelta: 0,
    kind: "measured-fraction-rule",
    borderBottomColor: "rgb(20, 30, 40)",
    borderBottomWidth: "1px"
  });
});
