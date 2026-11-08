import { devices, type PlaywrightTestProject } from "@playwright/test";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
// Exclude children of this checkout, never its .worktrees ancestors.
export const nestedWorktreeIgnore = `${projectRoot}.worktrees/**`;

const desktopDevices = {
  chromium: devices["Desktop Chrome"],
  firefox: devices["Desktop Firefox"],
  webkit: devices["Desktop Safari"]
};

// Keep browser selection explicit at the suite; only device setup is shared.
export function desktopProjects(
  ...browsers: (keyof typeof desktopDevices)[]
): PlaywrightTestProject[] {
  return browsers.map(name => ({ name, use: { ...desktopDevices[name] } }));
}
