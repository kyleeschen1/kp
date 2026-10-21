import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCalculusEdition } from "../scripts/build-calculus-edition.ts";

let server: Server, origin: string;
test.beforeAll(async () => {
  const edition = buildCalculusEdition("content/authoring/transfer/stationary-change.json");
  const manifest = JSON.parse(readFileSync(join(edition.directory, "edition.json"), "utf8"));
  const allowed = new Set(Object.keys(manifest.files));
  server = createServer((req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname.slice(1) || "index.html";
    if (!allowed.has(path)) { res.writeHead(404).end(); return; }
    const type = path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : "application/octet-stream";
    res.setHeader("Content-Type", type); res.end(readFileSync(join(edition.directory, path)));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("Missing local port");
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });

test("static selected-source edition reads without JavaScript or external resources", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage(), failed: string[] = [], external: string[] = [];
    page.on("requestfailed", r => failed.push(r.url()));
    page.on("request", r => { if (!r.url().startsWith(origin)) external.push(r.url()); });
    await page.goto(origin);
    await expect(page.locator("h1")).toHaveText("Zero slope does not mean no change");
    await expect(page.locator(".change-card")).toHaveAttribute("data-kp-focus-deck-static", "true");
    for (const id of ["input", "inner", "outer", "compose", "limit"]) await expect(page.locator(`[data-kp-focus-deck-beat="${id}"]`)).toBeVisible();
    await expect(page.locator(".kp-focus-deck__navigation")).toBeHidden();
    expect(await page.locator("math").count()).toBeGreaterThan(20);
    expect(failed).toEqual([]); expect(external).toEqual([]);
  } finally { await context.close(); }
});
