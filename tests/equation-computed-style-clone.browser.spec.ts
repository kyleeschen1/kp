import { expect, test } from "@playwright/test";

test("material templates reuse exact revisions without sharing mutable paint", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/rendering/equation-material-layer-dom.ts";
    const { setKpEquationMaterialOwnerVisual } = await import(modulePath);
    const stage = document.createElement("div");
    stage.dataset["kpEquationMaterialVisualCache"] = "dual-revision";
    stage.dataset["kpEquationMaterialPaintRevision"] = "layout0:paint0";
    const source = document.createElement("span");
    source.id = "native-authority";
    source.style.color = "rgb(23, 45, 67)";
    stage.append(source);
    document.body.append(stage);
    const sample = () => {
      const owner = document.createElement("span"); stage.append(owner);
      return setKpEquationMaterialOwnerVisual({ owner, sourceElement: source, revisionKey: "source:one" });
    };
    const first = sample();
    first.style.color = "red";
    const second = sample();
    source.style.color = "rgb(90, 80, 70)";
    stage.dataset["kpEquationMaterialPaintRevision"] = "layout0:paint1";
    const changed = sample();
    const result = { second: second.style.color, changed: changed.style.color, separate: first !== second, noAuthority: second.id === "" };
    stage.remove();
    return result;
  });
  expect(result).toEqual({ second: "rgb(23, 45, 67)", changed: "rgb(90, 80, 70)", separate: true, noAuthority: true });
});

test("computed-style clone preserves inherited and nested equation typography", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves this browser-side absolute module specifier.
    const { cloneElementWithComputedStyles } = await import("/src/rendering/computed-style-clone.ts");
    const source = document.createElement("span");
    source.style.fontFamily = "serif";
    source.style.fontSize = "37px";
    source.style.lineHeight = "41px";
    source.style.color = "rgb(31, 99, 113)";
    const child = document.createElement("span");
    child.style.fontFamily = "monospace";
    child.style.fontStyle = "italic";
    child.textContent = "x";
    source.append(child);
    document.body.append(source);

    const clone = cloneElementWithComputedStyles(source);
    const cloneChild = clone.firstElementChild as HTMLElement;
    const snapshot = {
      root: {
        fontFamily: clone.style.fontFamily,
        fontSize: clone.style.fontSize,
        lineHeight: clone.style.lineHeight,
        color: clone.style.color
      },
      child: {
        fontFamily: cloneChild.style.fontFamily,
        fontSize: cloneChild.style.fontSize,
        fontStyle: cloneChild.style.fontStyle,
        color: cloneChild.style.color
      }
    };
    source.remove();
    return snapshot;
  });

  expect(result.root).toEqual({
    fontFamily: "serif",
    fontSize: "37px",
    lineHeight: "41px",
    color: "rgb(31, 99, 113)"
  });
  expect(result.child).toEqual({
    fontFamily: "monospace",
    fontSize: "37px",
    fontStyle: "italic",
    color: "rgb(31, 99, 113)"
  });
});

test("computed-style clone preserves an intact SVG path subtree", async ({
  page
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves this browser-side absolute module specifier.
    const { cloneElementWithComputedStyles } = await import("/src/rendering/computed-style-clone.ts");
    const namespace = "http://www.w3.org/2000/svg";
    const source = document.createElementNS(namespace, "svg");
    source.setAttribute("viewBox", "0 0 10 10");
    source.style.color = "rgb(12, 34, 56)";
    const path = document.createElementNS(namespace, "path");
    path.setAttribute("d", "M 0 10 L 5 0 L 10 10");
    path.setAttribute("fill", "currentColor");
    source.append(path);
    document.body.append(source);

    const clone = cloneElementWithComputedStyles(source);
    const clonePath = clone.querySelector("path")!;
    const snapshot = {
      namespace: clone.namespaceURI,
      viewBox: clone.getAttribute("viewBox"),
      pathData: clonePath.getAttribute("d"),
      fill: clonePath.getAttribute("fill"),
      color: clone.style.color
    };
    source.remove();
    return snapshot;
  });

  expect(result).toEqual({
    namespace: "http://www.w3.org/2000/svg",
    viewBox: "0 0 10 10",
    pathData: "M 0 10 L 5 0 L 10 10",
    fill: "currentColor",
    color: "rgb(12, 34, 56)"
  });
});

test("material clone authority stripping is complete, nested, and idempotent", async ({
  page
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/rendering/computed-style-clone.ts";
    const {
      makeKpMaterialOwnerInert,
      stripKpMaterialCloneAuthority
    } = await import(modulePath);
    const owner = document.createElement("span");
    const clone = document.createElement("a");
    clone.id = "clone-link";
    clone.href = "/semantic-target";
    clone.tabIndex = 0;
    clone.setAttribute("role", "button");
    clone.setAttribute("aria-label", "semantic target");
    clone.setAttribute("data-kp-semantic-entity-id", "entity.x");
    clone.setAttribute("onclick", "void 0");
    const nested = document.createElement("button");
    nested.id = "nested-control";
    nested.setAttribute("aria-describedby", "description");
    nested.setAttribute("data-kp-reader-selector-id", "selector.x");
    clone.append(nested);

    makeKpMaterialOwnerInert(owner);
    stripKpMaterialCloneAuthority(clone);
    const once = clone.outerHTML;
    stripKpMaterialCloneAuthority(clone);
    return {
      once,
      twice: clone.outerHTML,
      ownerInert: owner.inert,
      ownerAriaHidden: owner.getAttribute("aria-hidden"),
      ownerPointerEvents: owner.style.pointerEvents,
      remainingAuthority: [
        clone,
        ...clone.querySelectorAll<Element>("*")
      ].flatMap((element) => [...element.attributes].map(({ name }) => name))
        .filter((name) =>
          name === "id" ||
          name === "role" ||
          name === "tabindex" ||
          name === "href" ||
          name.startsWith("aria-") ||
          name.startsWith("data-kp-") ||
          name.startsWith("on")
        )
    };
  });

  expect(result.twice).toBe(result.once);
  expect(result.ownerInert).toBe(true);
  expect(result.ownerAriaHidden).toBe("true");
  expect(result.ownerPointerEvents).toBe("none");
  expect(result.remainingAuthority).toEqual([]);
});
