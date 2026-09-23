import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { repeatabilityCases, readFrozenInput } from "../scripts/authoring-repeatability-cases.ts";
import { compileFractionChainPublication } from "../src/tutorial/fraction-chain/publication.ts";
import { checkFractionChainAuthorSource } from "../src/authoring/fraction-chain-author-check.ts";
import { readFractionChainSource } from "../src/authoring/fraction-chain-source.ts";
import { renderLatexToHtml } from "../src/rendering/katex-adapter.ts";

const cases = repeatabilityCases.filter(item => item.id === "fraction-add-reduce" || item.id === "fraction-subtract");
for (const item of cases) {
  const input = readFrozenInput(item);
  const parsed = readFractionChainSource(JSON.parse(input));
  const checked = checkFractionChainAuthorSource(input);
  if (parsed.status !== "parsed" || checked.status !== "compiled" || checked.hostEligibility.status !== "eligible")
    throw new Error(`Frozen case is not eligible for application: ${item.id}`);
  const source = parsed.source, revision = checked.revisionId;
  const article = readFileSync(new URL(`../content/authoring/repeatability/${item.id}.article.md`, import.meta.url), "utf8");
  const template = readFileSync(new URL("../experiments/fraction-chain/index.html", import.meta.url), "utf8");
  const html = template.replace("<!-- kp:fraction-chain -->", compileFractionChainPublication(article, JSON.parse(input)));
  const url = `/experiments/fraction-chain/?authoring-trial=${item.id}`;
  async function mount(page: Page) {
    // Use the existing publication compiler and actual host entry/CSS. Only this
    // browser's document response changes; the shared server and accepted source stay intact.
    await page.route(address => address.pathname === "/experiments/fraction-chain/" && address.searchParams.get("authoring-trial") === item.id,
      route => route.fulfill({ status: 200, contentType: "text/html", body: html }));
    await page.goto(url);
  }

  test(`${item.id}: frozen source reaches native endpoints, reverse seeking and exact return`, async ({ page }, info) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await mount(page);
    const root = page.locator("[data-fraction-passage]");
    await expect(root).toHaveAttribute("data-fraction-ready", /true|repair/, { timeout: 30_000 });
    expect(await root.getAttribute("data-fraction-ready"), await root.locator("[data-fraction-status]").textContent() ?? "").toBe("true");
    await expect(root).toHaveAttribute("data-source-revision", revision);
    expect(JSON.parse(await page.locator("#fraction-chain-source").textContent() ?? "null")).toEqual(JSON.parse(input));
    // Visual endpoint equality is distinct from the no-JS accessible-math gate.
    const nativeRows = await root.locator("[data-fraction-row]:not([data-fraction-detail]) > .energy-derivation-equation .katex-html").evaluateAll((nodes, expected) => nodes.map((node, index) => {
      const reference = document.createElement("div"); reference.innerHTML = expected[index]!;
      return node.innerHTML === reference.querySelector(".katex-html")?.innerHTML;
    }), source.states.map(state => renderLatexToHtml(state.latex)));
    expect(nativeRows).toEqual(source.states.map(() => true));
    const end = source.states.length - 1;
    for (const p of [0, .3, .8, 1, 1.25, 1.75, 2, ...(end === 3 ? [2.4, 3] : []), 1.75, 1.25, .3, 0]) await seek(page, p);
    await seek(page, 1.25);
    const held = Number(await root.getAttribute("data-fraction-position"));
    const toggle = root.locator("[data-fraction-disclosure]");
    await toggle.click(); await seek(page, 1.75); await toggle.click();
    expect(Number(await root.getAttribute("data-fraction-position"))).toBeCloseTo(held, 6);
    const firstEquation = root.locator(".energy-derivation-equation").first();
    const originalHeight = await firstEquation.evaluate(node => node.getBoundingClientRect().height);
    await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
    await expect.poll(() => firstEquation.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThan(originalHeight * 1.4);
    // Observe the new font geometry before aiming the next pointer event;
    // WebKit delivers ResizeObserver invalidation after the style mutation.
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await seek(page, end); await seek(page, 0); await seek(page, 1.25);
    const endpointInk = await root.locator("[data-fraction-row]:not([data-fraction-detail]) > .energy-derivation-equation .katex-html").evaluateAll(nodes => nodes.map(node => {
      const bounds = node.getBoundingClientRect(); return { width: bounds.width, height: bounds.height };
    }));
    expect(endpointInk.every(bounds => bounds.width > 0 && bounds.height > 0)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${item.id}.png`), fullPage: true });
    await info.attach("source-application", { contentType: "application/json", body: JSON.stringify({ caseId: item.id,
      sourceSha256: item.sha256, revision, host: url, mode: "existing-host-fixture", browser: info.project.name,
      checks: ["exact source", "owner revision", "native endpoints", "reverse seek", "exact disclosure return", "font resize"] }) });
  });

  test(`${item.id}: no-JS publication retains accessible native mathematics and explanation`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL: "http://localhost:8000" });
    try {
      const page = await context.newPage(); await mount(page);
      await expect(page.locator("h1")).toHaveText(source.title);
      expect(await page.locator("[data-fraction-row]:not([data-fraction-detail]) > .energy-derivation-equation .katex-mathml annotation").allTextContents()).toEqual(source.states.map(state => state.latex));
      await expect(page.locator("[data-fraction-disclosure]")).toBeHidden();
      const detail = page.locator("[data-fraction-static-detail]");
      await detail.locator("summary").click();
      await expect(detail.locator(".katex-html")).toBeVisible();
      for (const move of source.moves) await expect(page.locator("article")).toContainText(move.prose);
    } finally { await context.close(); }
  });
}

async function seek(page: Page, position: number) {
  const point = await page.evaluate(value => {
    const root = document.querySelector<HTMLElement>("[data-fraction-passage]")!;
    const rows = [...root.querySelectorAll<HTMLElement>("[data-fraction-row]")].filter(row => !row.hidden);
    const right = Math.max(1, rows.findIndex(row => Number(row.dataset["position"]) >= value));
    const left = rows[right - 1]!, next = rows[right]!;
    const center = (row: HTMLElement) => { const r = row.querySelector(".energy-derivation-equation")!.getBoundingClientRect(); return r.top + r.height / 2; };
    const y = () => center(left) + (center(next) - center(left)) * (value - Number(left.dataset["position"])) / (Number(next.dataset["position"]) - Number(left.dataset["position"]));
    window.scrollBy({ top: y() - innerHeight / 2, behavior: "instant" });
    const rail = root.querySelector("[data-fraction-rail]")!.getBoundingClientRect();
    return { x: rail.left + rail.width / 2, y: y() };
  }, position);
  await page.mouse.click(Math.round(point.x), Math.round(point.y));
  await expect.poll(async () => Number(await page.locator("[data-fraction-passage]").getAttribute("data-fraction-position"))).toBeCloseTo(position, 2);
}
