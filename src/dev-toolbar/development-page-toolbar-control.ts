import {
  groupKpDevelopmentPages,
  kpDevelopmentPageGroupLabels
} from "./development-page-directory.ts";
import {
  isKpDevelopmentPageCurrent,
  type KpDevelopmentPageLocation
} from "./development-page-descriptor.ts";
import {
  kpDevToolbarPagesControlId,
  type KpDevToolbarLinks
} from "./dev-toolbar-protocol.ts";

export function createKpDevelopmentPagesControl(
  location: KpDevelopmentPageLocation
): KpDevToolbarLinks {
  return {
    kind: "links",
    id: kpDevToolbarPagesControlId,
    label: "View",
    group: "primary",
    order: 5,
    groups: [...groupKpDevelopmentPages()].map(([id, pages]) => ({
      id,
      label: kpDevelopmentPageGroupLabels[id],
      links: pages.map((page) => ({
        id: page.id,
        label: page.label,
        href: page.href,
        current: isKpDevelopmentPageCurrent(page, location)
      }))
    }))
  };
}
