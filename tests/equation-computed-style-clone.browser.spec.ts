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
