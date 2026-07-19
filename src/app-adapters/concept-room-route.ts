import {
  formatConceptRoomRoute,
  parseConceptRoomRoute,
  type KpConceptRoomRoute
} from "../kernel/public-api.ts";

export function parseBrowserConceptRoomRoute(pathAndSearch: string): KpConceptRoomRoute {
  return parseConceptRoomRoute(pathAndSearch);
}

export function formatBrowserConceptRoomRoute(route: KpConceptRoomRoute): string {
  return formatConceptRoomRoute(route);
}
