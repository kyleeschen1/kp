import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { compileFractionChainPublication } from "../src/tutorial/fraction-chain/publication.ts";
import { checkFractionChainAuthorSource } from "../src/authoring/fraction-chain-author-check.ts";
import { readFractionChainSource } from "../src/authoring/fraction-chain-source.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";

for (const id of ["fraction-add-reduce", "fraction-two-sided", "fraction-subtract", "fraction-negative"]) {
  const input = readFileSync(new URL(`../content/authoring/convergence/${id}.json`, import.meta.url), "utf8");
  const checked = checkFractionChainAuthorSource(input);
  const parsed = readFractionChainSource(JSON.parse(input));
  if (checked.status !== "compiled" || checked.hostEligibility.status !== "eligible" || parsed.status !== "parsed")
    throw new Error(`Convergence source is not host eligible: ${id}`);
  const { source } = parsed;
  const article = readFileSync(new URL(`../content/authoring/convergence/${id}.article.md`, import.meta.url), "utf8");
  const template = readFileSync(new URL("../experiments/fraction-chain/index.html", import.meta.url), "utf8");
  const html = template.replace("<!-- kp:fraction-chain -->", compileFractionChainPublication(article, JSON.parse(input)));

  test(`${id}: exact source reaches existing host and preserves native endpoints and return`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    // Reuse the real host module and styles without changing the shared route's source.
    await page.route(url => url.pathname === "/experiments/fraction-chain/" && url.searchParams.get("convergence") === id,
      route => route.fulfill({ status: 200, contentType: "text/html", body: html }));
    await page.goto(`/experiments/fraction-chain/?convergence=${id}`);
    const root = page.locator("[data-fraction-passage]");
    await expect(root).toHaveAttribute("data-fraction-ready", /true|repair/, { timeout: 30_000 });
    expect(await root.getAttribute("data-fraction-ready"), await root.locator("[data-fraction-status]").textContent() ?? "").toBe("true");
    await expect(root).toHaveAttribute("data-source-revision", checked.revisionId);
    expect(JSON.parse(await page.locator("#fraction-chain-source").textContent() ?? "null")).toEqual(JSON.parse(input));
    await expect(page.locator("h1")).toHaveText(source.title);
    const equations = root.locator("[data-fraction-row]:not([data-fraction-detail]) > .energy-derivation-equation");
    const nativeEquality = await equations.locator(".katex-html").evaluateAll((nodes, expected) => nodes.map((node, index) => {
      const reference = document.createElement("div"); reference.innerHTML = expected[index]!;
      return node.innerHTML === reference.querySelector(".katex-html")?.innerHTML;
    }), source.states.map(state => renderLatexToHtml(state.latex)));
    expect(nativeEquality).toEqual(source.states.map(() => true));
    expect(await equations.locator(".katex-mathml annotation").allTextContents()).toEqual(source.states.map(state => state.latex));
    const end = source.states.length - 1;
    for (const position of [0, .3, .8, 1, 1.25, 1.75, 2, ...(end === 3 ? [2.4, 3] : []), 1.75, .3, 0])
      await seek(page, position);
    await seek(page, 1.25);
    const held = Number(await root.getAttribute("data-fraction-position"));
    const disclosure = root.locator("[data-fraction-disclosure]");
    await disclosure.click(); await seek(page, 1.75); await disclosure.click();
    expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
    expect(errors).toEqual([]);
    await info.attach("source-application", { contentType: "application/json", body: JSON.stringify({
      id, sourceSha256: createHash("sha256").update(input).digest("hex"), revision: checked.revisionId,
      host: "/experiments/fraction-chain/", mode: "existing-host-fixture", browser: info.project.name,
      checks: ["exact source value", "owner revision", "native endpoints", "accessible math", "reverse seek", "exact disclosure return"]
    }) });
  });
}

async function seek(page: Page, position: number) {
  const point = await page.evaluate(value => {
    const root = document.querySelector<HTMLElement>("[data-fraction-passage]")!;
    const rows = [...root.querySelectorAll<HTMLElement>("[data-fraction-row]")].filter(row => !row.hidden);
    const right = Math.max(1, rows.findIndex(row => Number(row.dataset["position"]) >= value));
    const left = rows[right - 1]!, next = rows[right]!;
    const center = (row: HTMLElement) => { const bounds = row.querySelector(".energy-derivation-equation")!.getBoundingClientRect(); return bounds.top + bounds.height / 2; };
    const y = () => center(left) + (center(next) - center(left)) * (value - Number(left.dataset["position"])) / (Number(next.dataset["position"]) - Number(left.dataset["position"]));
    window.scrollBy({ top: y() - innerHeight / 2, behavior: "instant" });
    const rail = root.querySelector("[data-fraction-rail]")!.getBoundingClientRect();
    return { x: rail.left + rail.width / 2, y: y() };
  }, position);
  await page.mouse.click(Math.round(point.x), Math.round(point.y));
  await expect.poll(async () => Number(await page.locator("[data-fraction-passage]").getAttribute("data-fraction-position"))).toBeCloseTo(position, 2);
}
