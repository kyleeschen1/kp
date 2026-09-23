import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

/** Chromium exercises the OS clipboard. Other engines lack Playwright's
 * clipboard permission grant: capture transport, but still exercise real DOM
 * selection and the application's copy-event ownership separately. */
export async function prepareCodeClipboard(context: BrowserContext, browserName: string) {
  if (browserName === "chromium") return context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await context.addInitScript(() => {
    let copied = "";
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async (text: string) => { copied = text; }, readText: async () => copied
    } });
  });
}

export async function copyCodeSelection(page: Page, stage: Locator, browserName: string) {
  if (browserName === "chromium") {
    await page.keyboard.press("ControlOrMeta+c");
    return page.evaluate(() => navigator.clipboard.readText());
  }
  return stage.evaluate(node => {
    const selection = getSelection();
    const selected = selection?.toString() ?? "";
    const data = new Map<string, string>();
    const event = new ClipboardEvent("copy", { bubbles: true, cancelable: true });
    // Firefox protects synthetic DataTransfer stores. This tests the app's
    // event contract, not browser clipboard permission or OS transport.
    Object.defineProperty(event, "clipboardData", { value: {
      setData: (type: string, text: string) => data.set(type, text)
    } });
    node.dispatchEvent(event);
    if (selected) {
      if (event.defaultPrevented) throw new Error("Application intercepted native partial selection");
      return selected;
    }
    if (!event.defaultPrevented) throw new Error("Application failed to provide complete source");
    return data.get("text/plain") ?? "";
  });
}

export function expectCodeGeometry(actual: Record<string, number>, expected: Record<string, number>) {
  expect(Object.keys(actual)).toEqual(Object.keys(expected));
  // Gecko rounds native line boxes and document coordinates differently after
  // scrolling. Retain a subpixel bound rather than comparing binary floats.
  for (const key of Object.keys(expected)) expect(Math.abs(actual[key]! - expected[key]!)).toBeLessThan(.1);
}
