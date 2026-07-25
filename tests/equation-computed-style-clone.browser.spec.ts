import { expect, test } from "@playwright/test";

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
