import { readFile } from "node:fs/promises";
import type { BrowserContext } from "@playwright/test";

/** Production evidence without a second server or a development fallback.
 * Only an explicit built document and flat emitted assets may be requested. */
export async function installBuiltFocusRoute(context: BrowserContext, input: {
  output: URL; pathname: string; origin: string;
}) {
  const html = await readFile(new URL(input.pathname.slice(1) + "index.html", input.output));
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== input.origin) { await route.abort(); return; }
    if (url.pathname === input.pathname) {
      await route.fulfill({ body: html, contentType: "text/html" }); return;
    }
    const asset = /^\/assets\/([A-Za-z0-9._-]+\.(js|css|woff2?|ttf))$/.exec(url.pathname);
    if (!asset) { await route.abort(); return; }
    const contentType = asset[2] === "js" ? "text/javascript" : asset[2] === "css" ? "text/css" : "application/octet-stream";
    await route.fulfill({ body: await readFile(new URL("assets/" + asset[1], input.output)), contentType });
  });
}
