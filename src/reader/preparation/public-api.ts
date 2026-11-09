// Dependency-free functions shared by emitted first-paint code and hydration.
// Importing this surface never starts a browser application or animation clock.
export { measureDocumentTheaterLayout } from './document-theater-layout.ts';
export { prepareDocumentTheaterStaticState } from './document-theater-static-state.ts';
export { documentPassageCadence } from './document-passage-cadence.ts';
