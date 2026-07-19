import {
  formatConceptRoomRoute,
  parseConceptRoomRoute,
  type KpConceptRoomRoute
} from "../src/kernel/public-api.ts";

export function parseServerConceptRoomRoute(pathAndSearch: string): KpConceptRoomRoute {
  return parseConceptRoomRoute(pathAndSearch);
}

export function formatServerConceptRoomRoute(route: KpConceptRoomRoute): string {
  return formatConceptRoomRoute(route);
}
