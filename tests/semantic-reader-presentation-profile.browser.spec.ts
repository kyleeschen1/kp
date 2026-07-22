import { expect, test } from "@playwright/test";

const route = (profile?: string) =>
  "/reader/solve-fractional-linear/" +
  "?kpLesson=lesson.solve-x.fractional-linear&kpVersion=1&kpProgress=500" +
  (profile === undefined ? "" : `&kpProfile=${profile}`);

test("reader projects the URL-selected certified profile and preserves it in share state", async ({
  page
}) => {
  await page.goto(route("explain"));
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-equation-profile", "explain");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-equation-profile-source",
    "url"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute("data-kp-reader-equation-profile", "explain");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-derivation-mode",
    "balanced-operation-v1"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-identity-mode",
    "hold-until-settled-v1"
  );
  await expect.poll(async () => new URL(
    await page.locator("[data-kp-reader-share]").evaluate(
      (element) => (element as HTMLAnchorElement).href
    )
  ).searchParams.get("kpProfile")).toBe("explain");
});

test("reader uses the compiler-declared Standard profile when the URL omits one", async ({
  page
}) => {
  await page.goto(route());
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-equation-profile", "standard");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-equation-profile-source",
    "default"
  );
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
    "data-kp-reader-equation-identity-mode",
    "omit-transient-v1"
  );
});

test("profiles do not invent witnesses for counter-orbit authored cancellations", async ({
  page
}) => {
  const witness = page.locator("[data-kp-reader-annihilation-witness]");
  for (const profile of ["explain", "standard"] as const) {
    await page.goto(route(profile).replace("kpProgress=500", "kpProgress=810"));
    await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
      "data-kp-reader-identity-witness-state",
      profile === "explain" ? "waiting" : "omitted"
    );
    await expect(witness).toHaveCSS("opacity", "0");
  }
});
