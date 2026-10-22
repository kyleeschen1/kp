import { expect, test } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { buildLocalReader } from "../scripts/local-reader-build.ts";
import { compile } from "../src/authoring/matrix-columns/compile.ts";
import { projectionLoss } from "../content/authoring/linear-algebra/projection-loss.ts";
import { evaluate } from "../src/math/authoring/matrices.ts";

let server: Server, origin: string;
test.beforeAll(async () => {
  const built = await buildLocalReader("src/experiments/matrix-column-combinations/entry.ts");
  const styles = [...built.files.keys()].filter(path => path.endsWith(".css"));
  const template = await readFile("experiments/matrix-column-combinations/index.html", "utf8");
  const html = template.replace('src="/src/experiments/matrix-column-combinations/entry.ts"', 'src="/reader.js"')
    .replace("</head>", `${styles.map(path => `<link rel="stylesheet" href="/${path}">`).join("")}</head>`);
  built.files.set("index.html", Buffer.from(html));
  // Only emitted assets are served; no dev server or source-module fallback.
  server = createServer((request, response) => {
    const path = new URL(request.url!, "http://localhost").pathname.slice(1) || "index.html";
    const bytes = built.files.get(path);
    if (!bytes) { response.writeHead(404).end(); return; }
    response.setHeader("Content-Type", path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : "application/octet-stream");
    response.end(bytes);
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing server address");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test("production editor imports the other accepted source and preserves native results and reversible samples", async ({ page }, info) => {
  const errors: string[] = [], external: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => errors.push(request.url()));
  page.on("request", request => { if (!request.url().startsWith(origin)) external.push(request.url()); });
  const source = { schemaVersion: "kp.matrix-columns.v1", id: projectionLoss.id,
    left: evaluate(projectionLoss.product.left, {}), right: evaluate(projectionLoss.product.right, {}), reading: projectionLoss.reading };
  const draft = compile(source);
  await page.goto(`${origin}/?author=1`);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await page.locator("[data-matrix-file]").setInputFiles({ name: "projection.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(source)) });
  await expect(page.locator("[data-matrix-status]")).toContainText("File loaded");
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(page.locator("#comb-player")).toHaveAttribute("data-revision", draft.revision);
  for (const column of [0, 1]) {
    await page.locator("[data-column-navigation] a").nth(column).click();
    await expect(page.locator("#comb-player")).toHaveAttribute("data-column", String(column));
    const poses = new Map<number, (string | null)[]>();
    for (const progress of [0, .25, .5, .75, 1, .75, .5, .25, 0]) {
      await page.locator("[data-scrub]").evaluate((slider, value) => {
        if (!(slider instanceof HTMLInputElement)) throw new Error("Missing scrubber");
        slider.value = String(value); slider.dispatchEvent(new Event("input", { bubbles: true }));
      }, progress);
      const pose = await page.locator(".comb-material > span").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
      expect(pose.length).toBeGreaterThan(0);
      if (poses.has(progress)) expect(pose).toEqual(poses.get(progress)); else poses.set(progress, pose);
      if (progress === 1) for (const row of [0, 1]) {
        await expect(page.locator(`[data-kp-comb-key="c-${row}-${column}"]`)).toHaveText(String(draft.result[row]![column]));
        await expect(page.locator(`[data-contributor-occurrence="scaled-1-${row}:input:0"]`)).toHaveAttribute("data-source-id", draft.product.right.rows[1]![column]!.id);
      }
    }
  }
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download displayed source", exact: true }).click();
  const exported = await pending;
  expect(compile(JSON.parse(await readFile((await exported.path())!, "utf8"))).revision).toBe(draft.revision);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#comb-player").screenshot({ path: info.outputPath("production-author-phone.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]); expect(external).toEqual([]);
});
