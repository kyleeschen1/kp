import { test, expect } from "@playwright/test";

test("staged preview keeps the active view intact and releases failed or abandoned candidates", async ({ page }) => {
  await page.goto("/experiments/bayesian-reasoning/");
  const result = await page.evaluate(async () => {
    const path = "/src/authoring/staged-preview.ts";
    const { preparePreview } = await import(path) as typeof import("../src/authoring/staged-preview.ts");
    const frame = document.createElement("iframe"); document.body.append(frame);
    const doc = frame.contentDocument!;
    const display = doc.createElement("div"); display.style.width = "213px";
    display.textContent = "last valid"; doc.body.append(display);
    let disposals = 0;
    const prepared = await preparePreview(display, { className: "candidate", html: "<p>next</p>",
      mount: async staging => {
        if (staging.ownerDocument !== doc || !staging.isConnected || !staging.inert ||
          staging.getAttribute("aria-hidden") !== "true" || staging.style.width !== "213px") throw new Error("Invalid staging boundary");
        return { dispose() { disposals++; throw new Error("teardown failed"); } };
      } });
    let disposeError = "";
    try { prepared.dispose(); } catch (error) { disposeError = String(error); }
    prepared.dispose();
    const removed = !prepared.staging.isConnected;
    let mountError = "";
    try { await preparePreview(display, { className: "candidate", html: "failed",
      mount: async () => { throw new Error("mount failed"); } }); } catch (error) { mountError = String(error); }
    const remaining = doc.querySelectorAll(".candidate").length;
    const active = display.textContent;
    frame.remove();
    return { disposals, disposeError, mountError, removed, remaining, active };
  });
  expect(result).toEqual({ disposals: 1, disposeError: "Error: teardown failed", mountError: "Error: mount failed",
    removed: true, remaining: 0, active: "last valid" });
});
