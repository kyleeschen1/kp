export const kpInternalStudioViews = [
  "editor",
  "dashboard",
  "animation-library-host",
  "animation-workbench",
  "ftc-tutorial"
] as const;

export type KpInternalStudioView = typeof kpInternalStudioViews[number];

export function readKpInternalStudioView(
  search: string
): KpInternalStudioView | undefined {
  const value = new URLSearchParams(search).get("view");
  return kpInternalStudioViews.find((view) => view === value);
}

export function writeKpInternalStudioView(
  search: string,
  view: KpInternalStudioView
): string {
  const params = new URLSearchParams(search);
  params.set("view", view);
  return `?${params.toString()}`;
}
