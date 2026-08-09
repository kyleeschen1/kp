import { expect, type Browser, type Page } from "@playwright/test";
import {
  kpReaderRouteEntryName,
  type KpReaderRouteDescriptor
} from "../../src/reader/compiler/reader-route-descriptor.ts";

export interface KpSemanticReaderConformanceDescriptor {
  readonly id: string;
  readonly readerId: string;
  readonly documentId: string;
  readonly version: string;
  readonly progress: number;
  readonly beatId: string;
  readonly route: (progress: number) => string;
  readonly stageSelector: string;
  readonly rendererAdapterId: string;
  readonly shareSelector: string;
  readonly fontReadyEvidence: "body-attribute" | "document-fonts";
  readonly progressEvidence:
    | { readonly kind: "attribute"; readonly selector: string; readonly name: string }
    | { readonly kind: "value"; readonly selector: string };
  readonly searchableText: string;
}

export function createKpSemanticReaderConformanceDescriptor(
  routeDescriptor: KpReaderRouteDescriptor
): KpSemanticReaderConformanceDescriptor {
  const profile = routeDescriptor.conformance;
  return {
    id: kpReaderRouteEntryName(routeDescriptor.route),
    readerId: profile.readerId,
    documentId: profile.documentId,
    version: profile.version,
    progress: profile.progressPermille,
    beatId: profile.beatId,
    route: (progress) => {
      const query = new URLSearchParams(profile.query);
      query.set("kpProgress", String(progress));
      return `${routeDescriptor.route}?${query}`;
    },
    stageSelector: profile.stageSelector,
    rendererAdapterId: profile.rendererAdapterId,
    shareSelector: profile.shareSelector,
    fontReadyEvidence: profile.fontReadyEvidence,
    progressEvidence: profile.progressEvidence,
    searchableText: profile.searchableText
  };
}

export async function assertKpSemanticReaderConformance(input: {
  readonly page: Page;
  readonly browser: Browser;
  readonly descriptor: KpSemanticReaderConformanceDescriptor;
}): Promise<void> {
  const { page, browser, descriptor } = input;
  const expectedProgress = String(descriptor.progress);
  await page.goto(descriptor.route(descriptor.progress), { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader", descriptor.readerId);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(page.locator(descriptor.stageSelector)).toHaveAttribute(
    "data-kp-reader-renderer-adapter",
    descriptor.rendererAdapterId
  );
  if (descriptor.fontReadyEvidence === "body-attribute") {
    await expect(page.locator("body")).toHaveAttribute("data-kp-reader-font-ready", "true");
  } else {
    await expect.poll(() => page.evaluate(() => document.fonts.status)).toBe("loaded");
  }
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  // The shell is the readiness authority; a body flag alone can mask a route
  // that never mounted the standard review integration.
  const reviewShell = page.locator("[data-kp-dev-review-shell]");
  await expect(reviewShell).toHaveCount(1);
  await expect(reviewShell.locator("button.launcher")).toBeHidden();
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  await expect(toolbar).toHaveCount(1);
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(reviewShell).toHaveAttribute(
    "data-kp-dev-review-placement",
    /^(left-prose-rail|captured-moment-sheet)$/
  );
  await expectProgress(page, descriptor.progressEvidence, expectedProgress);

  const toc = page.locator(".kp-lesson-toc");
  await expect(toc).toHaveAttribute("data-kp-toc-active-id", descriptor.beatId);
  const active = toc.locator('[data-kp-toc-active="true"]');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute("href", `#${descriptor.beatId}`);
  await expect(active).toHaveAttribute("aria-current", "location");
  await expect(page.locator(`[data-kp-beat="${descriptor.beatId}"]`)).toHaveAttribute("aria-current", "step");

  const shareHref = await page.locator(descriptor.shareSelector).getAttribute("href");
  if (shareHref === null) throw new Error(`${descriptor.id} share link has no href.`);
  const shared = new URL(shareHref, page.url());
  expect(shared.searchParams.get("kpLesson")).toBe(descriptor.documentId);
  expect(shared.searchParams.get("kpVersion")).toBe(descriptor.version);
  expect(shared.searchParams.get("kpProgress")).toBe(expectedProgress);

  await page.reload({ waitUntil: "networkidle" });
  await expectProgress(page, descriptor.progressEvidence, expectedProgress);
  await expect(toc).toHaveAttribute("data-kp-toc-active-id", descriptor.beatId);

  await page.setViewportSize({ width: 360, height: 760 });
  const containment = await page.evaluate((stageSelector) => {
    const rect = document.querySelector<HTMLElement>(stageSelector)!.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      stageInside: rect.left >= -1 && rect.right <= window.innerWidth + 1
    };
  }, descriptor.stageSelector);
  expect(containment).toEqual({ overflow: 0, stageInside: true });

  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await staticContext.newPage();
    await staticPage.goto(descriptor.route(descriptor.progress), { waitUntil: "domcontentloaded" });
    const normalizedText = (await staticPage.locator("body").innerText()).replaceAll(/\s+/g, "");
    expect(normalizedText).toContain(descriptor.searchableText.replaceAll(/\s+/g, ""));
  } finally {
    await staticContext.close();
  }
}

async function expectProgress(
  page: Page,
  evidence: KpSemanticReaderConformanceDescriptor["progressEvidence"],
  value: string
): Promise<void> {
  const locator = page.locator(evidence.selector);
  if (evidence.kind === "value") await expect(locator).toHaveValue(value);
  else await expect(locator).toHaveAttribute(evidence.name, value);
}
