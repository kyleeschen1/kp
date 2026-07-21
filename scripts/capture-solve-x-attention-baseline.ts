import { chromium, type Page } from "playwright";
import { mkdir } from "node:fs/promises";

const output = "tmp/codex/solve-x-attention-baseline";
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const states = [];
for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844 }
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(
    "http://127.0.0.1:8000/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=833"
  );
  await page.locator("body[data-kp-dev-review-ready=true]").waitFor();
  await page.locator("[data-kp-reader-equation-stage]").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.screenshot({ path: `${output}/${viewport.name}-closed.png`, fullPage: false });
  const closed = await geometry(page);
  await page.locator("[data-kp-dev-review-shell]").locator("button.launcher").click();
  await page.locator("[data-kp-dev-review-shell]").locator("textarea").waitFor();
  await page.screenshot({ path: `${output}/${viewport.name}-open.png`, fullPage: false });
  const open = await geometry(page);
  states.push({ viewport, closed, open });
  await page.close();
}
await browser.close();
process.stdout.write(`${JSON.stringify(states, null, 2)}\n`);

async function geometry(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const box = (selector: string): DOMRect | undefined =>
      document.querySelector<HTMLElement>(selector)?.getBoundingClientRect();
    const stage = box("[data-kp-reader-equation-stage]");
    const activeBeat = box("[data-kp-beat][data-kp-reader-active=true]")
      ?? box("[data-kp-beat][aria-current]");
    const masthead = box(".kp-reader-masthead");
    const host = document.querySelector<HTMLElement>("[data-kp-dev-review-shell]");
    const panel = host?.shadowRoot?.querySelector<HTMLElement>(".panel")?.getBoundingClientRect();
    const rect = (value: DOMRect | undefined) => value === undefined ? undefined : ({
      x: value.x, y: value.y, width: value.width, height: value.height,
      right: value.right, bottom: value.bottom
    });
    const intersection = (left: DOMRect | undefined, right: DOMRect | undefined) => {
      if (left === undefined || right === undefined) return 0;
      const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
      const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
      return width * height;
    };
    return {
      scrollY: window.scrollY,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      progress: document.body.dataset["kpReaderProgress"],
      stage: rect(stage),
      activeBeat: rect(activeBeat),
      masthead: rect(masthead),
      reviewPanel: rect(panel),
      reviewStageIntersectionArea: intersection(panel, stage),
      bodyScrollHeight: document.documentElement.scrollHeight
    };
  });
}
